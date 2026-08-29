(() => {
  'use strict';

  const OWNER = 'kishan-sip-it';
  const PORTFOLIO_REPO = 'portfolio';

  const LIVE_URLS = {
    lpfinder: 'https://lpfinder.onrender.com/',
    kindling: 'https://kindling1.netlify.app/',
    aivoa: 'https://aivoa1.netlify.app/',
    samaaroh_file: 'http://samaaroh.freehosting.dev/'
  };

  const TAG_CLASS = {
    python: 'tag-python', php: 'tag-php', javascript: 'tag-react',
    typescript: 'tag-typescript', react: 'tag-react', postgresql: 'tag-postgresql',
    mysql: 'tag-mysql', fastapi: 'tag-fastapi', langgraph: 'tag-langgraph',
    tailwind: 'tag-tailwind', jwt: 'tag-jwt', redux: 'tag-redux',
    nextjs: 'tag-nextjs', drizzle: 'tag-drizzle', rbac: 'tag-rbac',
    bcrypt: 'tag-bcrypt', testing: 'tag-testing', pypi: 'tag-pypi', dsa: 'tag-dsa',
    html: 'tag-react', css: 'tag-react', sql: 'tag-postgresql',
    'c#': 'tag-typescript', java: 'tag-typescript', visualbasic: 'tag-typescript'
  };

  function escapeHtml(value) {
    return String(value ?? '')
      .replaceAll('&', '&amp;').replaceAll('<', '&lt;').replaceAll('>', '&gt;')
      .replaceAll('"', '&quot;').replaceAll("'", '&#039;');
  }

  function prettyName(name) {
    return name.replace(/[-_]+/g, ' ').replace(/\b\w/g, c => c.toUpperCase());
  }

  function category(repo) {
    if (repo.name === OWNER) return 'GITHUB PROFILE';
    if (repo.name === PORTFOLIO_REPO) return 'PORTFOLIO';
    const topic = repo.topics?.[0];
    if (topic) return topic.replace(/[-_]+/g, ' ').toUpperCase();
    if (repo.language) return `${repo.language} PROJECT`.toUpperCase();
    return 'GITHUB PROJECT';
  }

  function tagline(repo) {
    const description = (repo.description || '').trim();
    if (description) {
      const firstSentence = description.split(/[.!?](?:\s|$)/)[0].trim();
      return firstSentence.length > 58 ? `${firstSentence.slice(0, 55)}...` : firstSentence;
    }
    return repo.language ? `${repo.language} • GITHUB PROJECT` : 'GITHUB PROJECT';
  }

  function tagClass(tag) {
    const normalized = tag.replace(/[^a-z0-9#]/gi, '').toLowerCase();
    return TAG_CLASS[normalized] || '';
  }

  function renderCard(repo, index) {
    const liveUrl = LIVE_URLS[repo.name.toLowerCase()] || repo.homepage || '';
    const repoLanguages = repo.githubLanguages || [];
    const repoTopics = (repo.topics || []).map(topic => String(topic).toLowerCase());
    const repoTags = [...new Set([...repoLanguages, ...repoTopics])].slice(0, 8);
    const updated = repo.updated_at
      ? new Date(repo.updated_at).toLocaleDateString(undefined, { year: 'numeric', month: 'short' })
      : '';
    const stats = `${repo.stargazers_count || 0}★ · ${repo.forks_count || 0} forks`;

    return `
      <div class="proj-card github-project reveal" style="--proj-color:${index % 2 ? '#ff2d78' : '#a855f7'};">
        <div class="proj-head">
          <div class="proj-category">${escapeHtml(category(repo))}</div>
          <div class="proj-num">#${String(index + 1).padStart(3, '0')}</div>
        </div>
        <div class="proj-name">${escapeHtml(prettyName(repo.name))}</div>
        <div class="proj-tagline">${escapeHtml(tagline(repo))}</div>
        <p class="proj-desc">${escapeHtml(repo.description || 'Public GitHub repository with source code and ongoing development.')}</p>
        <div class="proj-tags">
          ${repoTags.map(tag => `<div class="proj-tag ${tagClass(tag)}">${escapeHtml(tag)}</div>`).join('')}
        </div>
        <div class="proj-links">
          <a href="${escapeHtml(repo.html_url)}" target="_blank" rel="noopener noreferrer" class="proj-link"><span class="pl-icon">🐙</span>GITHUB</a>
          ${liveUrl ? `<a href="${escapeHtml(liveUrl)}" target="_blank" rel="noopener noreferrer" class="proj-link live"><span class="pl-icon">🔗</span>LIVE DEMO</a>` : ''}
        </div>
        <div style="margin-top:.75rem;font-size:.58rem;color:var(--grey);">${escapeHtml(stats)}${updated ? ` · updated ${escapeHtml(updated)}` : ''}</div>
      </div>`;
  }

  function getProjectStatNumber() {
    const stat = [...document.querySelectorAll('.stat-box')]
      .find(box => box.querySelector('.stat-label')?.textContent.trim().toUpperCase() === 'PROJECTS');
    return stat?.querySelector('.stat-num') || null;
  }

  function syncProjectStatCount(count) {
    const number = getProjectStatNumber();
    if (!number) return;

    try {
      if (typeof statsObs !== 'undefined') statsObs.disconnect();
    } catch (_) {}

    const expected = `${count}+`;
    number.dataset.githubProjectCount = String(count);
    number.textContent = expected;

    // Protect the GitHub value from the legacy hard-coded 4+ counter and
    // any delayed observer callback that may already be queued.
    if (number._githubCountTimer) clearInterval(number._githubCountTimer);
    number._githubCountTimer = setInterval(() => {
      if (number.textContent !== expected) number.textContent = expected;
    }, 100);
  }

  function installCarousel(grid, cards) {
    const existing = grid.parentElement.querySelector('.github-project-nav');
    if (existing) existing.remove();

    if (cards.length <= 6) {
      grid.classList.remove('github-project-carousel');
      return;
    }

    grid.classList.add('github-project-carousel');
    const nav = document.createElement('div');
    nav.className = 'github-project-nav';
    nav.innerHTML = `
      <button type="button" class="github-project-arrow" data-dir="-1" aria-label="Previous projects">&lt;</button>
      <span class="github-project-page">1 / ${Math.ceil(cards.length / 6)}</span>
      <button type="button" class="github-project-arrow" data-dir="1" aria-label="Next projects">&gt;</button>`;
    grid.parentElement.insertBefore(nav, grid);

    let page = 0;
    const pageCount = Math.ceil(cards.length / 6);
    const renderPage = () => {
      cards.forEach((card, i) => {
        card.style.display = i >= page * 6 && i < (page + 1) * 6 ? '' : 'none';
      });
      nav.querySelector('.github-project-page').textContent = `${page + 1} / ${pageCount}`;
      nav.querySelector('[data-dir="-1"]').disabled = page === 0;
      nav.querySelector('[data-dir="1"]').disabled = page === pageCount - 1;
    };

    nav.addEventListener('click', event => {
      const button = event.target.closest('.github-project-arrow');
      if (!button) return;
      page = Math.max(0, Math.min(pageCount - 1, page + Number(button.dataset.dir)));
      renderPage();
      grid.scrollIntoView({ behavior: 'smooth', block: 'center' });
    });

    renderPage();
  }

  function addCarouselStyles() {
    if (document.getElementById('github-project-styles')) return;
    const style = document.createElement('style');
    style.id = 'github-project-styles';
    style.textContent = `
      .github-project-nav{display:flex;align-items:center;justify-content:center;gap:1rem;margin:-1rem 0 1.5rem;}
      .github-project-arrow{font-family:'Press Start 2P',monospace;font-size:.75rem;line-height:1;border:1px solid var(--green);color:var(--green);background:#0d0d0d;padding:.65rem .8rem;cursor:pointer;transition:all .2s;}
      .github-project-arrow:hover:not(:disabled){background:var(--green);color:var(--black);box-shadow:0 0 14px rgba(57,255,133,.25);}
      .github-project-arrow:disabled{opacity:.25;cursor:not-allowed;}
      .github-project-page{font-family:'Press Start 2P',monospace;font-size:.42rem;color:var(--grey);min-width:72px;text-align:center;}
      @media(min-width:921px){.github-project-carousel{grid-template-columns:repeat(3,minmax(0,1fr));}}
      @media(max-width:920px) and (min-width:641px){.github-project-carousel{grid-template-columns:repeat(2,minmax(0,1fr));}}
      @media(max-width:640px){.github-project-carousel{grid-template-columns:1fr;}}
    `;
    document.head.appendChild(style);
  }

  async function fetchLiveFallback() {
    const response = await fetch(`https://api.github.com/users/${OWNER}/repos?per_page=100&sort=pushed&type=owner`, {
      headers: { Accept: 'application/vnd.github+json' },
      cache: 'no-store'
    });
    if (!response.ok) throw new Error(`GitHub API ${response.status}`);
    return response.json();
  }

  async function fetchLanguages(repo) {
    const url = repo.languages_url || `https://api.github.com/repos/${OWNER}/${encodeURIComponent(repo.name)}/languages`;
    try {
      const response = await fetch(url, {
        headers: { Accept: 'application/vnd.github+json' },
        cache: 'no-store'
      });
      if (!response.ok) return repo.language ? [repo.language] : [];
      const languageMap = await response.json();
      return Object.entries(languageMap)
        .sort(([, a], [, b]) => Number(b) - Number(a))
        .map(([language]) => language);
    } catch {
      return repo.language ? [repo.language] : [];
    }
  }

  async function loadProjects() {
    const grid = document.querySelector('.projects-grid');
    if (!grid) return;

    try {
      let repos = Array.isArray(window.__GITHUB_PROJECTS__) ? window.__GITHUB_PROJECTS__ : null;
      if (!repos) repos = await fetchLiveFallback();

      // All public, non-archived repositories are included in both the
      // counter and the project carousel. Private repositories never enter it.
      const publicRepos = repos.filter(repo => !repo.private && !repo.archived);
      syncProjectStatCount(publicRepos.length);

      const projects = publicRepos
        .slice()
        .sort((a, b) => new Date(b.pushed_at || b.updated_at) - new Date(a.pushed_at || a.updated_at));

      if (!projects.length) return;

      await Promise.all(projects.map(async repo => {
        repo.githubLanguages = (await fetchLanguages(repo)).slice(0, 5);
      }));

      grid.innerHTML = projects.map(renderCard).join('');
      const cards = [...grid.querySelectorAll('.github-project')];

      addCarouselStyles();
      installCarousel(grid, cards);

      const revealObserver = new IntersectionObserver(entries => {
        entries.forEach(entry => {
          if (entry.isIntersecting) entry.target.classList.add('visible');
        });
      }, { threshold: .1, rootMargin: '0px 0px -60px 0px' });
      cards.forEach(card => revealObserver.observe(card));
    } catch (error) {
      console.warn('GitHub project sync unavailable; keeping portfolio fallback projects.', error);
    }
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', loadProjects, { once: true });
  } else {
    loadProjects();
  }
})();
