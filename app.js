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
  await loadData();
  setupSearch();
  setupLevelFilters();
  setupYearFilters();
  setupSheet();
});

// ─── SERVICE WORKER ───────────────────────────────────────
function registerSW() {
  if ('serviceWorker' in navigator) {
    navigator.serviceWorker.register('sw.js').catch(console.warn);
  }
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

  // Reset year chips
  document.querySelectorAll('.year-chip').forEach(c => {
    c.classList.toggle('active', c.dataset.year === 'all');
  });

  renderSheetPapers();
  sheetOverlay.classList.add('open');
  subjectSheet.classList.add('open');
  document.body.style.overflow = 'hidden';

  // Push AI button up so it doesn't overlap sheet
  const aiBtn = document.getElementById('cxcAIBtn');
  const aiPanel = document.getElementById('cxcAIPanel');
  if (aiBtn) aiBtn.style.bottom = '420px';
  if (aiPanel) { aiPanel.classList.remove('open'); aiPanel.style.bottom = '480px'; }
}

function closeSheet() {
  sheetOverlay.classList.remove('open');
  subjectSheet.classList.remove('open');
  document.body.style.overflow = '';
  currentSubjectId = null;

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
      ${url
        ? `<a href="${url}" target="_blank" rel="noopener" class="paper-download-btn ${isFolder ? 'folder-btn' : ''}" onclick="sb.rpc('increment_downloads',{paper_id:'${p.id}'}).catch(()=>{})">${btnLabel}</a>`
        : `<span class="paper-download-btn" style="opacity:.4;cursor:default">Soon</span>`
      }
    </div>`;
}

// ─── DOWNLOAD ─────────────────────────────────────────────
async function handleDownload(paperId, fileUrl, title) {
  if (!fileUrl) { showToast('File not available yet.'); return; }

  // Track view count (fire and forget)
  sb.rpc('increment_downloads', { paper_id: paperId }).catch(() => {});

  // Open PDF in new tab
  window.open(fileUrl, '_blank');
  showToast(`Opening: ${title.slice(0, 30)}…`);
}

// ─── SEARCH ───────────────────────────────────────────────
function setupSearch() {
  let timer;
  searchInput.addEventListener('input', () => {
    searchQuery = searchInput.value.trim();
    searchClear.style.display = searchQuery ? 'block' : 'none';
    clearTimeout(timer);
    timer = setTimeout(renderSubjects, 200);
  });
  searchClear.addEventListener('click', () => {
    searchInput.value = '';
    searchQuery = '';
    searchClear.style.display = 'none';
    renderSubjects();
    searchInput.focus();
  });
}

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

  // Swipe down to close
  let startY = 0;
  subjectSheet.addEventListener('touchstart', e => { startY = e.touches[0].clientY; }, { passive: true });
  subjectSheet.addEventListener('touchend', e => {
    const diff = e.changedTouches[0].clientY - startY;
    if (diff > 80) closeSheet();
  }, { passive: true });
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
