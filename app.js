/* =========================================================
   CXC PAST PAPERS — app.js
   ========================================================= */

// ─── CONFIG ──────────────────────────────────────────────
const SUPABASE_URL = 'https://eavcrtoekpmcwdpdeuvg.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImVhdmNydG9la3BtY3dkcGRldXZnIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzQ1NjIxMzQsImV4cCI6MjA5MDEzODEzNH0.ScLaG4vDgjVN43dFxp88IkJ4ysOmtVyuLNl0ypnzxqk';

const sb = supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

// ─── STATE ───────────────────────────────────────────────
let allSubjects = [];
let allPapers   = [];
let activeLevel = 'all';
let activeYear  = 'all';
let currentSubjectId = null;
let searchQuery = '';
let deferredPrompt = null;

// ─── DOM REFS ────────────────────────────────────────────
const subjectsGrid  = document.getElementById('subjectsGrid');
const recentPapers  = document.getElementById('recentPapers');
const searchInput   = document.getElementById('searchInput');
const searchClear   = document.getElementById('searchClear');
const subjectCount  = document.getElementById('subjectCount');
const statPapers    = document.getElementById('statPapers');
const statSubjects  = document.getElementById('statSubjects');
const statVisitors  = document.getElementById('statVisitors');
const sheetOverlay  = document.getElementById('sheetOverlay');
const subjectSheet  = document.getElementById('subjectSheet');
const sheetTitle    = document.getElementById('sheetTitle');
const sheetIcon     = document.getElementById('sheetIcon');
const sheetLevel    = document.getElementById('sheetLevel');
const sheetPapers   = document.getElementById('sheetPapers');
const sheetClose    = document.getElementById('sheetClose');
const toast         = document.getElementById('toast');
const installBtn    = document.getElementById('installBtn');

// ─── INIT ─────────────────────────────────────────────────
document.addEventListener('DOMContentLoaded', async () => {
  registerSW();
  setupPWAInstall();
  setupDarkMode();
  setupExamCountdown();
  await loadData();
  setupSearch();
  setupLevelFilters();
  setupYearFilters();
  setupSheet();
  trackVisitor();
  renderRecentlyViewed();
  showEmailCapture();
});

// ─── SERVICE WORKER ───────────────────────────────────────
function registerSW() {
  if (!('serviceWorker' in navigator)) return;

  navigator.serviceWorker.register('/sw.js').then(reg => {
    // Tell waiting SW to activate immediately
    reg.addEventListener('updatefound', () => {
      const newWorker = reg.installing;
      newWorker.addEventListener('statechange', () => {
        if (newWorker.state === 'installed' && navigator.serviceWorker.controller) {
          // New version available — show update toast
          showToast('🔄 Update available — refreshing…');
          setTimeout(() => {
            newWorker.postMessage({ type: 'SKIP_WAITING' });
            window.location.reload();
          }, 1500);
        }
      });
    });
  }).catch(console.warn);

  // Track online/offline status
  window.addEventListener('offline', () => showToast('📶 You're offline — cached papers still work'));
  window.addEventListener('online',  () => showToast('✅ Back online!'));
}

// ─── PWA INSTALL ──────────────────────────────────────────
function setupPWAInstall() {
  window.addEventListener('beforeinstallprompt', (e) => {
    e.preventDefault();
    deferredPrompt = e;
    installBtn.style.display = 'block';
  });
  installBtn.addEventListener('click', async () => {
    if (!deferredPrompt) return;
    deferredPrompt.prompt();
    const { outcome } = await deferredPrompt.userChoice;
    if (outcome === 'accepted') showToast('App installed! 🎉');
    deferredPrompt = null;
    installBtn.style.display = 'none';
  });
}

// ─── LOAD DATA ────────────────────────────────────────────
async function loadData() {
  renderSkeletons();

  try {
    const [subRes, paperRes] = await Promise.all([
      sb.from('subjects').select('*').order('name'),
      sb.from('papers').select('*, subjects(name, emoji, level)').order('created_at', { ascending: false })
    ]);

    // Handle offline SW response
    if (subRes.error?.message === 'offline' || paperRes.error?.message === 'offline') {
      subjectsGrid.innerHTML = buildEmptyState('📶', 'You're offline', 'Connect to the internet to load subjects and papers.');
      recentPapers.innerHTML = '';
      return;
    }

    if (subRes.error) throw subRes.error;
    if (paperRes.error) throw paperRes.error;

    allSubjects = subRes.data || [];
    allPapers   = paperRes.data || [];

    // Update stats
    statPapers.textContent   = allPapers.length;
    statSubjects.textContent = allSubjects.length;

    // Expose papers to AI search widget
    window.__cxcPapers = allPapers.map(p => ({
      id:             p.id,
      title:          p.title,
      year:           p.year,
      level:          p.subjects?.level || '',
      subject_name:   p.subjects?.name  || '',
      emoji:          p.subjects?.emoji || '📄',
      paper_number:   p.paper_number,
      is_mark_scheme: p.is_mark_scheme,
      file_url:       p.file_url
    }));

    // Hook: AI results can trigger downloads
    window.__cxcOpenPaper = (id) => {
      const paper = allPapers.find(p => p.id === id);
      if (paper) handleDownload(paper.id, paper.file_url, paper.title);
    };

    renderSubjects();
    renderRecent();

    // Handle ?subject= URL param — auto-open subject on load
    const urlParams = new URLSearchParams(window.location.search);
    const subjectParam = urlParams.get('subject');
    if (subjectParam) {
      const subjectName = subjectParam.replace(/-/g,' ').toLowerCase();
      const match = allSubjects.find(s => s.name.toLowerCase() === subjectName);
      if (match) setTimeout(() => openSheet(match.id), 600);
    }
  } catch (err) {
    console.error('Load error:', err);
    subjectsGrid.innerHTML = buildEmptyState('⚠️', 'Could not load subjects', 'Check your connection and refresh.');
    recentPapers.innerHTML  = '';
  }
}

// ─── RENDER SUBJECTS ──────────────────────────────────────
function renderSubjects() {
  let list = allSubjects.filter(s => {
    const matchLevel = activeLevel === 'all' || s.level === activeLevel;
    const matchSearch = !searchQuery || s.name.toLowerCase().includes(searchQuery.toLowerCase());
    return matchLevel && matchSearch;
  });

  subjectCount.textContent = `${list.length} subject${list.length !== 1 ? 's' : ''}`;

  if (!list.length) {
    subjectsGrid.innerHTML = buildEmptyState('🔍', 'No subjects found', 'Try a different search or filter.');
    return;
  }

  subjectsGrid.innerHTML = list.map((s, i) => {
    const count = allPapers.filter(p => p.subject_id === s.id).length;
    return `
      <div class="subject-card" data-id="${s.id}" style="animation-delay:${i * 40}ms" onclick="openSheet('${s.id}')">
        <div class="subject-card-top">
          <span class="subject-emoji">${s.emoji || '📄'}</span>
          <span class="subject-level-tag ${s.level.toLowerCase()}">${s.level}</span>
        </div>
        <div class="subject-name">${s.name}</div>
        <div class="subject-card-footer">
          <span class="paper-count">${count} paper${count !== 1 ? 's' : ''}</span>
          <span class="card-arrow">→</span>
        </div>
      </div>`;
  }).join('');
}

// ─── RENDER RECENT PAPERS ─────────────────────────────────
function renderRecent() {
  const list = allPapers.slice(0, 8);
  if (!list.length) { recentPapers.innerHTML = ''; return; }

  recentPapers.innerHTML = list.map(p => buildPaperRow(p)).join('');
}

function buildPaperRow(p) {
  const subjectName = p.subjects?.name || 'Unknown';
  const emoji       = p.subjects?.emoji || '📄';
  const level       = p.subjects?.level || '';
  const url         = p.file_url || '';
  const isFolder    = url.includes('drive.google.com/drive/folders');
  const btnLabel    = isFolder ? '📂 Open Folder' : 'Download';
  const badgeEmoji  = isFolder ? '📂' : emoji;
  return `
    <div class="paper-row">
      <div class="paper-type-badge">${badgeEmoji}</div>
      <div class="paper-info">
        <div class="paper-title">${escHtml(p.title)}</div>
        <div class="paper-meta">${subjectName} · ${level} · ${isFolder ? 'Multiple years' : p.year}${p.is_mark_scheme ? ' · Mark Scheme' : ''}</div>
      </div>
      ${url
        ? `<a href="${url}" target="_blank" rel="noopener" class="paper-download-btn ${isFolder ? 'folder-btn' : ''}">${btnLabel}</a>`
        : `<span class="paper-download-btn" style="opacity:.4;cursor:default">Soon</span>`
      }
    </div>`;
}

// ─── OPEN SUBJECT SHEET ───────────────────────────────────
function openSheet(subjectId) {
  currentSubjectId = subjectId;
  activeYear = 'all';

  const subject = allSubjects.find(s => s.id === subjectId);
  if (!subject) return;

  sheetTitle.textContent  = subject.name;
  sheetIcon.textContent   = subject.emoji || '📄';
  sheetLevel.textContent  = subject.level;
  sheetLevel.className    = `sheet-level-badge ${subject.level.toLowerCase()}`;

  // GA4 — track subject view
  if (typeof gtag !== 'undefined') {
    gtag('event', 'view_subject', {
      subject_name: subject.name,
      subject_level: subject.level
    });
  }

  // Recently viewed
  addRecentlyViewed(subject);

  // Update URL — clean SEO-friendly path
  const slug = subject.name.toLowerCase().replace(/[^a-z0-9]+/g, '-');
  const newUrl = `/subject/${slug}`;
  history.pushState({ subjectId }, '', newUrl);

  // Update page title and meta for this subject
  document.title = `${subject.level} ${subject.name} Past Papers – Free PDF | CXC Papers`;
  const metaDesc = document.querySelector('meta[name="description"]');
  if (metaDesc) metaDesc.content = `Free ${subject.level} ${subject.name} past papers PDF download. All years. No sign-up required.`;

  // Reset year chips
  document.querySelectorAll('.year-chip').forEach(c => {
    c.classList.toggle('active', c.dataset.year === 'all');
  });

  renderSheetPapers();
  sheetOverlay.classList.add('open');
  subjectSheet.classList.add('open');
  document.body.style.overflow = 'hidden';

  // Push AI button above the sheet
  const aiBtn = document.getElementById('cxcAIBtn');
  const aiPanel = document.getElementById('cxcAIPanel');
  const sheetH = Math.min(window.innerHeight * 0.78, window.innerHeight) + 16;
  if (aiBtn) aiBtn.style.bottom = sheetH + 'px';
  if (aiPanel) { aiPanel.classList.remove('open'); aiPanel.style.bottom = (sheetH + 60) + 'px'; }
}

function closeSheet() {
  sheetOverlay.classList.remove('open');
  subjectSheet.classList.remove('open');
  document.body.style.overflow = '';
  currentSubjectId = null;

  // Restore clean URL
  history.pushState({}, '', '/');
  document.title = 'CXC Past Papers – Free CSEC & CAPE Past Papers PDF Download';

  // Restore AI button to normal position
  const aiBtn = document.getElementById('cxcAIBtn');
  const aiPanel = document.getElementById('cxcAIPanel');
  if (aiBtn) aiBtn.style.bottom = '28px';
  if (aiPanel) aiPanel.style.bottom = '90px';
}

function renderSheetPapers() {
  const allSubjectPapers = allPapers.filter(p => p.subject_id === currentSubjectId);

  // Build year filter chips dynamically based on actual years in data
  const years = [...new Set(allSubjectPapers.map(p => String(p.year)))].sort((a,b) => b-a);
  const sheetFilters = document.querySelector('.sheet-filters');
  if (sheetFilters) {
    sheetFilters.innerHTML = `<button class="year-chip active" data-year="all">All Years</button>` +
      years.map(y => `<button class="year-chip" data-year="${y}">${y}</button>`).join('');
    // Re-attach click handlers
    sheetFilters.querySelectorAll('.year-chip').forEach(chip => {
      chip.addEventListener('click', () => {
        sheetFilters.querySelectorAll('.year-chip').forEach(c => c.classList.remove('active'));
        chip.classList.add('active');
        activeYear = chip.dataset.year;
        renderSheetPapers();
      });
    });
  }

  let papers = allSubjectPapers;
  if (activeYear !== 'all') papers = papers.filter(p => String(p.year) === activeYear);

  if (!papers.length) {
    sheetPapers.innerHTML = buildEmptyState('📭', 'No papers found', activeYear !== 'all' ? `No papers for ${activeYear} yet.` : 'Papers coming soon.');
    return;
  }

  // Group by year
  const byYear = {};
  papers.forEach(p => {
    if (!byYear[p.year]) byYear[p.year] = [];
    byYear[p.year].push(p);
  });

  sheetPapers.innerHTML = Object.keys(byYear).sort((a,b) => b-a).map(year => `
    <div class="year-group">
      <div class="year-group-label">${year}</div>
      ${byYear[year].map(p => buildSheetPaperItem(p)).join('')}
    </div>
  `).join('');
}

function buildSheetPaperItem(p) {
  const url = p.file_url || '';
  const isFolder = url.includes('drive.google.com/drive/folders');
  const btnLabel = isFolder ? '📂 Open Folder' : 'Download';
  const metaParts = [
    isFolder ? 'Multiple years inside' : p.year,
    p.paper_number ? 'Paper ' + p.paper_number : '',
    p.is_mark_scheme ? '· Mark Scheme' : ''
  ].filter(Boolean).join(' · ');
  return `
    <div class="paper-row">
      <div class="paper-type-badge">${isFolder ? '📂' : p.is_mark_scheme ? '✅' : '📄'}</div>
      <div class="paper-info">
        <div class="paper-title">${escHtml(p.title)}</div>
        <div class="paper-meta">${metaParts}</div>
      </div>
      <div style="display:flex;gap:6px;align-items:center;flex-shrink:0;">
        ${url
          ? `<a href="${url}" target="_blank" rel="noopener" class="paper-download-btn ${isFolder ? 'folder-btn' : ''}" onclick="sb.rpc('increment_downloads',{paper_id:'${p.id}'}).catch(()=>{})">${btnLabel}</a>`
          : `<span class="paper-download-btn" style="opacity:.4;cursor:default">Soon</span>`
        }
        ${url ? `<button class="share-btn" onclick="sharePaper('${escHtml(p.title)}','${url}')" title="Share">↗</button>` : ''}
      </div>
    </div>`;
}

// ─── DOWNLOAD ─────────────────────────────────────────────
async function handleDownload(paperId, fileUrl, title) {
  if (!fileUrl) { showToast('File not available yet.'); return; }

  // Track view count
  sb.rpc('increment_downloads', { paper_id: paperId }).catch(() => {});

  // GA4 — track paper download
  if (typeof gtag !== 'undefined') {
    gtag('event', 'download_paper', {
      paper_title: title,
      paper_id: paperId
    });
  }

  window.open(fileUrl, '_blank');
  showToast(`Opening: ${title.slice(0, 30)}…`);
}

// setupSearch is defined above with autocomplete support

// ─── LEVEL FILTERS ────────────────────────────────────────
function setupLevelFilters() {
  document.querySelectorAll('.filter-chip').forEach(chip => {
    chip.addEventListener('click', () => {
      document.querySelectorAll('.filter-chip').forEach(c => c.classList.remove('active'));
      chip.classList.add('active');
      activeLevel = chip.dataset.level;
      renderSubjects();
    });
  });
}

// ─── YEAR FILTERS ─────────────────────────────────────────
function setupYearFilters() {
  document.querySelectorAll('.year-chip').forEach(chip => {
    chip.addEventListener('click', () => {
      document.querySelectorAll('.year-chip').forEach(c => c.classList.remove('active'));
      chip.classList.add('active');
      activeYear = chip.dataset.year;
      if (currentSubjectId) renderSheetPapers();
    });
  });
}

// ─── SHEET SETUP ──────────────────────────────────────────
function setupSheet() {
  sheetClose.addEventListener('click', closeSheet);
  sheetOverlay.addEventListener('click', closeSheet);

  // Auto-open subject from clean URL /subject/slug OR ?subject= param
  const pathMatch = window.location.pathname.match(/^\/subject\/(.+)/);
  const urlParams = new URLSearchParams(window.location.search);
  const urlSlug = pathMatch ? pathMatch[1] : urlParams.get('subject');
  if (urlSlug) {
    const tryOpen = () => {
      const match = allSubjects.find(s =>
        s.name.toLowerCase().replace(/[^a-z0-9]+/g,'-') === urlSlug
      );
      if (match) openSheet(match.id);
    };
    setTimeout(tryOpen, 800);
    setTimeout(tryOpen, 1800);
  }

  // Handle browser back/forward
  window.addEventListener('popstate', (e) => {
    if (e.state?.subjectId) {
      openSheet(e.state.subjectId);
    } else {
      closeSheet();
    }
  });

  // Share button
  document.getElementById('sheetShare').addEventListener('click', shareSubject);

  // Swipe down to close
  let startY = 0;
  subjectSheet.addEventListener('touchstart', e => { startY = e.touches[0].clientY; }, { passive: true });
  subjectSheet.addEventListener('touchend', e => {
    const diff = e.changedTouches[0].clientY - startY;
    if (diff > 80) closeSheet();
  }, { passive: true });
}

// ─── DARK MODE ────────────────────────────────────────────
function setupDarkMode() {
  const btn = document.getElementById('darkToggle');
  const isDark = localStorage.getItem('cxc_dark') === '1';
  if (isDark) { document.body.classList.add('dark'); btn.textContent = '☀️'; }

  btn.addEventListener('click', () => {
    const dark = document.body.classList.toggle('dark');
    btn.textContent = dark ? '☀️' : '🌙';
    localStorage.setItem('cxc_dark', dark ? '1' : '0');
  });
}

// ─── EXAM COUNTDOWN ───────────────────────────────────────
function setupExamCountdown() {
  const el = document.getElementById('examCountdown');
  if (!el) return;
  // CSEC May/June exams typically start first Monday of May
  const examDate = new Date('2025-05-05T08:00:00');
  const now = new Date();
  const diff = examDate - now;
  if (diff <= 0) {
    el.textContent = '📝 CSEC exams are happening now — good luck!';
    return;
  }
  const days  = Math.floor(diff / (1000 * 60 * 60 * 24));
  const hours = Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
  if (days > 180) { el.style.display = 'none'; return; }
  if (days === 0) el.innerHTML = `⏰ CSEC exams start <strong>TODAY</strong> — you've got this!`;
  else if (days === 1) el.innerHTML = `⏰ CSEC exams start <strong>tomorrow</strong> — last chance to practise!`;
  else el.innerHTML = `⏰ CSEC 2025 exams in <strong>${days} days</strong> — start practising now`;
}

// ─── SEARCH AUTOCOMPLETE ──────────────────────────────────
function setupSearch() {
  const autocomplete = document.getElementById('searchAutocomplete');
  let timer;

  searchInput.addEventListener('input', () => {
    searchQuery = searchInput.value.trim();
    searchClear.style.display = searchQuery ? 'block' : 'none';
    clearTimeout(timer);
    timer = setTimeout(() => {
      renderSubjects();
      renderAutocomplete(searchQuery);
      if (searchQuery.length >= 3 && typeof gtag !== 'undefined') {
        gtag('event', 'search', { search_term: searchQuery });
      }
    }, 150);
  });

  searchClear.addEventListener('click', () => {
    searchInput.value = '';
    searchQuery = '';
    searchClear.style.display = 'none';
    autocomplete.innerHTML = '';
    renderSubjects();
    searchInput.focus();
  });

  // Close autocomplete on outside click
  document.addEventListener('click', (e) => {
    if (!e.target.closest('.search-wrap')) {
      autocomplete.innerHTML = '';
    }
  });
}

function renderAutocomplete(query) {
  const autocomplete = document.getElementById('searchAutocomplete');
  if (!autocomplete) return;
  if (!query || query.length < 1) { autocomplete.innerHTML = ''; return; }

  const matches = allSubjects.filter(s =>
    s.name.toLowerCase().includes(query.toLowerCase())
  ).slice(0, 6);

  if (!matches.length) { autocomplete.innerHTML = ''; return; }

  autocomplete.innerHTML = matches.map(s => {
    const count = allPapers.filter(p => p.subject_id === s.id).length;
    return `<div class="autocomplete-item" onclick="selectAutocomplete('${s.id}')">
      <span class="autocomplete-emoji">${s.emoji || '📄'}</span>
      <span class="autocomplete-name">${s.name}</span>
      <span class="autocomplete-level ${s.level.toLowerCase()}">${s.level}</span>
      <span class="autocomplete-count">${count} paper${count !== 1 ? 's' : ''}</span>
    </div>`;
  }).join('');
}

function selectAutocomplete(subjectId) {
  const subject = allSubjects.find(s => s.id === subjectId);
  if (!subject) return;
  const autocomplete = document.getElementById('searchAutocomplete');
  searchInput.value = subject.name;
  searchQuery = subject.name;
  autocomplete.innerHTML = '';
  openSheet(subjectId);
}

// ─── RECENTLY VIEWED ──────────────────────────────────────
const RV_KEY = 'cxc_recent';
const RV_MAX = 8;

function addRecentlyViewed(subject) {
  let recent = getRecentlyViewed();
  // Remove if already exists
  recent = recent.filter(s => s.id !== subject.id);
  // Add to front
  recent.unshift({ id: subject.id, name: subject.name, emoji: subject.emoji, level: subject.level });
  // Keep max
  recent = recent.slice(0, RV_MAX);
  localStorage.setItem(RV_KEY, JSON.stringify(recent));
  renderRecentlyViewed();
}

function getRecentlyViewed() {
  try { return JSON.parse(localStorage.getItem(RV_KEY) || '[]'); }
  catch { return []; }
}

function renderRecentlyViewed() {
  const section = document.getElementById('recentlyViewed');
  const list    = document.getElementById('recentlyViewedList');
  if (!section || !list) return;

  const recent = getRecentlyViewed();
  if (!recent.length) { section.style.display = 'none'; return; }

  section.style.display = 'block';
  list.innerHTML = recent.map(s => `
    <div class="rv-chip" onclick="openSheet('${s.id}')">
      <span class="rv-chip-emoji">${s.emoji || '📄'}</span>
      <span class="rv-chip-name">${s.name}</span>
      <span class="rv-chip-level">${s.level}</span>
    </div>`
  ).join('');

  document.getElementById('clearRecent').onclick = () => {
    localStorage.removeItem(RV_KEY);
    section.style.display = 'none';
  };
}

// ─── VISITOR TRACKING ─────────────────────────────────────
async function trackVisitor() {
  try {
    // Use a stable localStorage ID so the same person always counts once
    let visitorId = localStorage.getItem('cxc_vid');
    if (!visitorId) {
      // Generate a random stable ID on first visit
      const arr = new Uint8Array(16);
      crypto.getRandomValues(arr);
      visitorId = Array.from(arr).map(b => b.toString(16).padStart(2,'0')).join('');
      localStorage.setItem('cxc_vid', visitorId);
    }

    const { data, error } = await sb.rpc('track_visitor', { v_id: visitorId });
    if (!error && data !== null && statVisitors) {
      statVisitors.textContent = Number(data).toLocaleString();
    }
  } catch (e) {
    // Silently fail — visitor tracking is non-critical
  }
}

// ─── SHARE ────────────────────────────────────────────────
// ─── SHARE SHEET ──────────────────────────────────────────
const shareOverlay = document.getElementById('shareOverlay');
const shareSheet   = document.getElementById('shareSheet');
const shareOptions = document.getElementById('shareOptions');
const shareTitle   = document.getElementById('shareSheetTitle');

document.getElementById('shareCancel').addEventListener('click', closeShareSheet);
shareOverlay.addEventListener('click', closeShareSheet);

function openShareSheet(title, url, gaType) {
  // GA4
  if (typeof gtag !== 'undefined') {
    gtag('event', 'share', { method: 'sheet', content_type: gaType, item_id: title });
  }

  const encodedUrl  = encodeURIComponent(url);
  const encodedText = encodeURIComponent(title + ' – Free CXC Past Papers');

  shareTitle.textContent = title;
  shareOptions.innerHTML = `
    <button class="share-option" onclick="doShare('whatsapp','${url}','${encodedText}','${encodedUrl}')">
      <div class="share-option-icon" style="background:#25D366">💬</div>
      <span class="share-option-label">WhatsApp</span>
    </button>
    <button class="share-option" onclick="doShare('twitter','${url}','${encodedText}','${encodedUrl}')">
      <div class="share-option-icon" style="background:#000">✕</div>
      <span class="share-option-label">X / Twitter</span>
    </button>
    <button class="share-option" onclick="doShare('facebook','${url}','${encodedText}','${encodedUrl}')">
      <div class="share-option-icon" style="background:#1877F2">f</div>
      <span class="share-option-label">Facebook</span>
    </button>
    <button class="share-option" onclick="doShare('copy','${url}','${encodedText}','${encodedUrl}')">
      <div class="share-option-icon" style="background:var(--surface-2)">🔗</div>
      <span class="share-option-label">Copy Link</span>
    </button>
  `;

  shareOverlay.classList.add('open');
  shareSheet.classList.add('open');
  document.body.style.overflow = 'hidden';
}

function closeShareSheet() {
  shareOverlay.classList.remove('open');
  shareSheet.classList.remove('open');
  document.body.style.overflow = '';
}

function doShare(platform, url, encodedText, encodedUrl) {
  const links = {
    whatsapp: `https://wa.me/?text=${encodedText}%20${encodedUrl}`,
    twitter:  `https://twitter.com/intent/tweet?text=${encodedText}&url=${encodedUrl}`,
    facebook: `https://www.facebook.com/sharer/sharer.php?u=${encodedUrl}`,
  };
  if (platform === 'copy') {
    navigator.clipboard.writeText(url).then(() => {
      showToast('Link copied! 📋');
      closeShareSheet();
    });
  } else {
    window.open(links[platform], '_blank', 'width=600,height=500');
    closeShareSheet();
  }
  // GA4 track which platform was used
  if (typeof gtag !== 'undefined') {
    gtag('event', 'share', { method: platform, content_type: 'paper', item_id: url });
  }
}

function shareSubject() {
  const subject = allSubjects.find(s => s.id === currentSubjectId);
  if (!subject) return;
  const url = `https://cxcpastpaper.online/?subject=${subject.name.toLowerCase().replace(/[^a-z0-9]+/g,'-')}&level=${subject.level}`;
  // Use native share on mobile, custom sheet on desktop
  if (navigator.share && /Mobi|Android/i.test(navigator.userAgent)) {
    navigator.share({ title: `Free ${subject.level} ${subject.name} past papers`, url }).catch(() => {});
  } else {
    openShareSheet(subject.name + ' Past Papers', url, 'subject');
  }
}

function sharePaper(title, url) {
  if (navigator.share && /Mobi|Android/i.test(navigator.userAgent)) {
    navigator.share({ title: title + ' – Free PDF', url }).catch(() => {});
  } else {
    openShareSheet(title, url, 'paper');
  }
}

// ─── HELPERS ──────────────────────────────────────────────
function buildEmptyState(icon, title, msg) {
  return `<div class="empty-state"><div class="empty-icon">${icon}</div><h3>${title}</h3><p>${msg}</p></div>`;
}

function renderSkeletons() {
  subjectsGrid.innerHTML = Array(8).fill('<div class="skeleton skeleton-card"></div>').join('');
  recentPapers.innerHTML = Array(4).fill('<div class="skeleton skeleton-row"></div>').join('');
}

function showToast(msg) {
  toast.textContent = msg;
  toast.classList.add('show');
  setTimeout(() => toast.classList.remove('show'), 2500);
}

function escHtml(str) {
  return String(str || '').replace(/'/g, "\\'").replace(/"/g, '&quot;');
}
