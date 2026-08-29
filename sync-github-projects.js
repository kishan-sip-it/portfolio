const fs = require('node:fs/promises');

const OWNER = 'kishan-sip-it';
const OUTPUT = 'github-projects-data.js';
const API = 'https://api.github.com';

const headers = {
  Accept: 'application/vnd.github+json',
  'User-Agent': 'kishan-sip-it-portfolio-sync',
  ...(process.env.GITHUB_TOKEN ? { Authorization: `Bearer ${process.env.GITHUB_TOKEN}` } : {})
};

async function github(path) {
  const response = await fetch(`${API}${path}`, { headers });
  if (!response.ok) {
    const body = await response.text();
    throw new Error(`GitHub API ${response.status} for ${path}: ${body.slice(0, 300)}`);
  }
  return response.json();
}

async function fetchAllRepos() {
  const repos = [];
  for (let page = 1; ; page += 1) {
    const batch = await github(`/users/${OWNER}/repos?per_page=100&page=${page}&type=owner&sort=pushed`);
    repos.push(...batch);
    if (batch.length < 100) break;
  }
  return repos;
}

async function fetchLanguages(repo) {
  const languageMap = await github(`/repos/${OWNER}/${encodeURIComponent(repo.name)}/languages`);
  return Object.entries(languageMap)
    .sort(([, a], [, b]) => Number(b) - Number(a))
    .map(([language]) => language);
}

async function main() {
  const repos = await fetchAllRepos();

  // Unauthenticated GitHub's /users/:user/repos endpoint returns public repos.
  // Keep the explicit visibility check so the same logic remains correct if a token is supplied.
  const publicRepos = repos.filter(repo => !repo.private && !repo.archived);

  const enriched = await Promise.all(publicRepos.map(async repo => ({
    id: repo.id,
    name: repo.name,
    full_name: repo.full_name,
    html_url: repo.html_url,
    homepage: repo.homepage,
    description: repo.description,
    language: repo.language,
    topics: Array.isArray(repo.topics) ? repo.topics : [],
    private: false,
    archived: false,
    fork: Boolean(repo.fork),
    stargazers_count: repo.stargazers_count || 0,
    forks_count: repo.forks_count || 0,
    updated_at: repo.updated_at,
    pushed_at: repo.pushed_at,
    githubLanguages: await fetchLanguages(repo)
  })));

  enriched.sort((a, b) => new Date(b.pushed_at || b.updated_at) - new Date(a.pushed_at || a.updated_at));

  const output = `// AUTO-GENERATED on Netlify build. Source: GitHub public repositories.\nwindow.__GITHUB_PROJECTS__ = ${JSON.stringify(enriched, null, 2)};\n`;
  await fs.writeFile(OUTPUT, output, 'utf8');

  console.log(`GitHub project sync complete: ${enriched.length} public repositories.`);
  console.log(`Generated ${OUTPUT} with GitHub Languages data for every repository.`);
}

main().catch(error => {
  console.error('GitHub project sync failed:', error);
  process.exit(1);
});
