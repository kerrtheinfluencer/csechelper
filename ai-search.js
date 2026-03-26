/* =========================================================
   CXC PAPERS — ai-search.js
   Drop-in AI Search Widget
   Usage: <script type="module" src="ai-search.js"></script>
   ========================================================= */

import { Brain } from './brain.js';

// ─── INJECT STYLES ────────────────────────────────────────
const styles = `
  /* ── AI Search Widget ─────────────────────────── */
  #cxcAIBtn {
    position: fixed;
    bottom: 28px;
    right: 24px;
    z-index: 300;
    display: flex;
    align-items: center;
    gap: 8px;
    padding: 12px 20px;
    background: linear-gradient(135deg, #004d1a 0%, #008c2e 100%);
    color: #ffd700;
    border: none;
    border-radius: 50px;
    font-family: 'Syne', sans-serif;
    font-size: .88rem;
    font-weight: 700;
    cursor: pointer;
    box-shadow: 0 4px 20px rgba(0,77,26,.45), 0 0 0 0 rgba(255,215,0,.4);
    transition: all .2s cubic-bezier(.4,0,.2,1);
    letter-spacing: .3px;
  }
  #cxcAIBtn:hover {
    transform: translateY(-2px);
    box-shadow: 0 8px 28px rgba(0,77,26,.55), 0 0 0 6px rgba(255,215,0,.15);
  }
  #cxcAIBtn.pulsing {
    animation: aiBtnPulse 2s infinite;
  }
  #cxcAIBtn .ai-btn-dot {
    width: 8px; height: 8px;
    background: #ffd700;
    border-radius: 50%;
    flex-shrink: 0;
  }
  #cxcAIBtn.loading-state .ai-btn-dot {
    animation: dotSpin .8s linear infinite;
    background: rgba(255,215,0,.5);
  }
  #cxcAIBtn.ready-state .ai-btn-dot {
    background: #00ff7f;
    box-shadow: 0 0 6px #00ff7f;
  }

  /* ── Panel ─────────────────────────────────────── */
  #cxcAIPanel {
    position: fixed;
    bottom: 90px;
    right: 24px;
    z-index: 299;
    width: min(420px, calc(100vw - 32px));
    background: #0a0a0a;
    border-radius: 20px;
    border: 1px solid rgba(255,215,0,.2);
    box-shadow: 0 24px 64px rgba(0,0,0,.6), 0 0 0 1px rgba(255,255,255,.04);
    display: flex;
    flex-direction: column;
    overflow: hidden;
    transform: translateY(16px) scale(.97);
    opacity: 0;
    pointer-events: none;
    transition: all .25s cubic-bezier(.4,0,.2,1);
    max-height: 70vh;
  }
  #cxcAIPanel.open {
    transform: translateY(0) scale(1);
    opacity: 1;
    pointer-events: all;
  }

  /* Panel Header */
  .ai-panel-header {
    padding: 16px 18px 12px;
    border-bottom: 1px solid rgba(255,255,255,.07);
    display: flex;
    align-items: center;
    justify-content: space-between;
    flex-shrink: 0;
  }
  .ai-panel-title {
    display: flex;
    align-items: center;
    gap: 8px;
  }
  .ai-panel-title span {
    font-family: 'Syne', sans-serif;
    font-size: .95rem;
    font-weight: 800;
    color: #fff;
  }
  .ai-panel-title .ai-badge {
    font-size: .6rem;
    font-weight: 700;
    letter-spacing: 1.5px;
    text-transform: uppercase;
    color: #00ff7f;
    background: rgba(0,255,127,.12);
    padding: 2px 7px;
    border-radius: 10px;
    border: 1px solid rgba(0,255,127,.2);
  }
  .ai-panel-close {
    width: 28px; height: 28px;
    border-radius: 50%;
    background: rgba(255,255,255,.08);
    color: rgba(255,255,255,.5);
    display: flex; align-items: center; justify-content: center;
    font-size: .85rem;
    cursor: pointer;
    transition: all .15s;
    border: none;
    font-family: inherit;
  }
  .ai-panel-close:hover { background: rgba(255,255,255,.14); color: #fff; }

  /* Status bar */
  .ai-status-bar {
    padding: 8px 18px;
    font-size: .72rem;
    color: rgba(255,255,255,.4);
    font-family: 'DM Sans', sans-serif;
    display: flex;
    align-items: center;
    gap: 6px;
    flex-shrink: 0;
  }
  .ai-status-bar.downloading { color: #ffd700; }
  .ai-status-bar.ready       { color: #00ff7f; }
  .ai-status-bar.error       { color: #ff6b6b; }

  /* Progress bar */
  .ai-progress-wrap {
    height: 2px;
    background: rgba(255,255,255,.06);
    flex-shrink: 0;
    overflow: hidden;
  }
  .ai-progress-fill {
    height: 100%;
    background: linear-gradient(90deg, #ffd700, #00ff7f);
    width: 0%;
    transition: width .3s ease;
  }
  .ai-progress-fill.indeterminate {
    width: 40%;
    animation: indeterminate 1.2s ease-in-out infinite;
  }

  /* Search Input */
  .ai-search-wrap {
    padding: 12px 16px;
    flex-shrink: 0;
  }
  .ai-search-inner {
    display: flex;
    align-items: center;
    background: rgba(255,255,255,.06);
    border: 1.5px solid rgba(255,255,255,.1);
    border-radius: 12px;
    padding: 2px 8px 2px 14px;
    gap: 8px;
    transition: border-color .15s;
  }
  .ai-search-inner:focus-within {
    border-color: rgba(255,215,0,.4);
    background: rgba(255,255,255,.08);
  }
  .ai-search-inner input {
    flex: 1;
    background: none;
    border: none;
    outline: none;
    color: #fff;
    font-family: 'DM Sans', sans-serif;
    font-size: .88rem;
    padding: 10px 0;
  }
  .ai-search-inner input::placeholder { color: rgba(255,255,255,.3); }
  .ai-search-inner input:disabled { opacity: .4; cursor: not-allowed; }
  .ai-search-go {
    flex-shrink: 0;
    padding: 6px 12px;
    background: #ffd700;
    color: #004d1a;
    border-radius: 8px;
    font-family: 'Syne', sans-serif;
    font-size: .75rem;
    font-weight: 700;
    cursor: pointer;
    transition: all .15s;
    border: none;
  }
  .ai-search-go:hover:not(:disabled) { background: #ffe033; }
  .ai-search-go:disabled { opacity: .4; cursor: not-allowed; }

  /* Suggestions chips */
  .ai-suggestions {
    display: flex;
    gap: 6px;
    flex-wrap: wrap;
    padding: 0 16px 10px;
    flex-shrink: 0;
  }
  .ai-chip {
    padding: 4px 12px;
    background: rgba(255,255,255,.06);
    border: 1px solid rgba(255,255,255,.1);
    border-radius: 20px;
    color: rgba(255,255,255,.55);
    font-size: .72rem;
    cursor: pointer;
    transition: all .15s;
    font-family: 'DM Sans', sans-serif;
  }
  .ai-chip:hover {
    background: rgba(255,215,0,.12);
    border-color: rgba(255,215,0,.3);
    color: #ffd700;
  }

  /* Results */
  .ai-results {
    flex: 1;
    overflow-y: auto;
    padding: 0 12px 16px;
    display: flex;
    flex-direction: column;
    gap: 6px;
    scrollbar-width: thin;
    scrollbar-color: rgba(255,255,255,.1) transparent;
  }
  .ai-result-item {
    display: flex;
    align-items: center;
    gap: 10px;
    padding: 10px 10px;
    border-radius: 10px;
    background: rgba(255,255,255,.04);
    border: 1px solid rgba(255,255,255,.06);
    cursor: pointer;
    transition: all .15s;
  }
  .ai-result-item:hover {
    background: rgba(255,215,0,.08);
    border-color: rgba(255,215,0,.2);
  }
  .ai-result-emoji {
    font-size: 1.2rem;
    flex-shrink: 0;
    width: 32px;
    height: 32px;
    display: flex; align-items: center; justify-content: center;
    background: rgba(255,255,255,.06);
    border-radius: 8px;
  }
  .ai-result-info { flex: 1; min-width: 0; }
  .ai-result-title {
    font-family: 'Syne', sans-serif;
    font-size: .82rem;
    font-weight: 700;
    color: #fff;
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
  }
  .ai-result-meta {
    font-size: .68rem;
    color: rgba(255,255,255,.4);
    margin-top: 2px;
  }
  .ai-result-score {
    flex-shrink: 0;
    font-size: .65rem;
    font-weight: 700;
    color: #00ff7f;
    background: rgba(0,255,127,.1);
    padding: 2px 6px;
    border-radius: 6px;
    font-family: 'Syne', sans-serif;
  }

  /* Empty / intro state */
  .ai-intro {
    padding: 20px 16px;
    text-align: center;
    color: rgba(255,255,255,.3);
    font-size: .8rem;
    font-family: 'DM Sans', sans-serif;
    line-height: 1.6;
  }
  .ai-intro .ai-intro-icon { font-size: 2rem; margin-bottom: 8px; }
  .ai-intro strong { color: rgba(255,255,255,.6); display: block; margin-bottom: 4px; font-family: 'Syne', sans-serif; font-size: .85rem; }

  /* Load model prompt */
  .ai-load-prompt {
    padding: 20px 16px;
    text-align: center;
  }
  .ai-load-prompt p {
    font-size: .78rem;
    color: rgba(255,255,255,.4);
    font-family: 'DM Sans', sans-serif;
    line-height: 1.6;
    margin-bottom: 14px;
  }
  .ai-load-prompt p strong { color: #ffd700; font-weight: 600; }
  .ai-load-model-btn {
    width: 100%;
    padding: 11px;
    background: linear-gradient(135deg, #004d1a, #008c2e);
    color: #ffd700;
    border: none;
    border-radius: 10px;
    font-family: 'Syne', sans-serif;
    font-size: .85rem;
    font-weight: 700;
    cursor: pointer;
    transition: all .15s;
    letter-spacing: .3px;
  }
  .ai-load-model-btn:hover { filter: brightness(1.1); transform: translateY(-1px); }
  .ai-size-note {
    font-size: .68rem;
    color: rgba(255,255,255,.25);
    margin-top: 8px !important;
    margin-bottom: 0 !important;
  }

  @keyframes aiBtnPulse {
    0%, 100% { box-shadow: 0 4px 20px rgba(0,77,26,.45), 0 0 0 0 rgba(255,215,0,.4); }
    50%       { box-shadow: 0 4px 20px rgba(0,77,26,.45), 0 0 0 8px rgba(255,215,0,0); }
  }
  @keyframes dotSpin {
    0%   { transform: scale(1);   opacity: 1; }
    50%  { transform: scale(1.4); opacity: .5; }
    100% { transform: scale(1);   opacity: 1; }
  }
  @keyframes indeterminate {
    0%   { transform: translateX(-100%); }
    100% { transform: translateX(350%); }
  }
`;

// ─── INJECT HTML ──────────────────────────────────────────
function injectUI() {
  const styleEl = document.createElement('style');
  styleEl.textContent = styles;
  document.head.appendChild(styleEl);

  document.body.insertAdjacentHTML('beforeend', `
    <!-- AI Floating Button -->
    <button id="cxcAIBtn" class="pulsing" title="AI Search">
      <span class="ai-btn-dot"></span>
      <span id="aiBtnLabel">AI Search</span>
    </button>

    <!-- AI Panel -->
    <div id="cxcAIPanel" role="dialog" aria-label="AI Paper Search">
      <div class="ai-panel-header">
        <div class="ai-panel-title">
          <span>🧠 Smart Search</span>
          <span class="ai-badge" id="aiBadge">LOCAL AI</span>
        </div>
        <button class="ai-panel-close" id="aiPanelClose">✕</button>
      </div>

      <div class="ai-progress-wrap">
        <div class="ai-progress-fill" id="aiProgress"></div>
      </div>

      <div class="ai-status-bar" id="aiStatus">
        Powered by Transformers.js · Runs in your browser
      </div>

      <div id="aiBody">
        <!-- content swapped by JS -->
      </div>
    </div>
  `);
}

// ─── WIDGET CONTROLLER ────────────────────────────────────
class AISearchWidget {
  constructor() {
    injectUI();

    this.btn        = document.getElementById('cxcAIBtn');
    this.panel      = document.getElementById('cxcAIPanel');
    this.body       = document.getElementById('aiBody');
    this.statusBar  = document.getElementById('aiStatus');
    this.progressEl = document.getElementById('aiProgress');
    this.btnLabel   = document.getElementById('aiBtnLabel');
    this.badge      = document.getElementById('aiBadge');
    this.isOpen     = false;
    this.modelLoaded = false;
    this.papers     = [];

    this.SUGGESTIONS = [
      'circle theorems', 'photosynthesis', 'slavery Caribbean',
      'quadratic equations', 'cell biology', 'profit and loss'
    ];

    this.btn.addEventListener('click', () => this.togglePanel());
    document.getElementById('aiPanelClose').addEventListener('click', () => this.closePanel());
    document.addEventListener('keydown', e => { if (e.key === 'Escape') this.closePanel(); });

    this.showLoadPrompt();
  }

  togglePanel() {
    this.isOpen ? this.closePanel() : this.openPanel();
  }

  openPanel() {
    this.isOpen = true;
    this.panel.classList.add('open');
    this.btn.classList.remove('pulsing');
    if (this.modelLoaded) {
      setTimeout(() => this.panel.querySelector('.ai-search-inner input')?.focus(), 280);
    }
  }

  closePanel() {
    this.isOpen = false;
    this.panel.classList.remove('open');
  }

  // ── Show "load model" prompt ────────────────────────────
  showLoadPrompt() {
    this.body.innerHTML = `
      <div class="ai-load-prompt">
        <p>Smart Search uses a <strong>local AI model</strong> that runs entirely in your browser — no internet needed after loading.</p>
        <p>Find papers by topic, concept, or keyword — not just exact title matches.</p>
        <button class="ai-load-model-btn" id="aiLoadBtn">⬇ Load AI Model</button>
        <p class="ai-size-note">~23MB · downloads once · cached forever</p>
      </div>`;
    document.getElementById('aiLoadBtn').addEventListener('click', () => this.loadModel());
  }

  // ── Load model + index papers ───────────────────────────
  async loadModel() {
    this.setStatus('Downloading model… this takes ~10 seconds', 'downloading');
    this.setProgress(0, true);
    this.btnLabel.textContent = 'Loading…';
    this.btn.classList.add('loading-state');
    this.body.innerHTML = `<div class="ai-intro"><div class="ai-intro-icon">⬇️</div><strong>Downloading AI model</strong>Runs locally in your browser after this.</div>`;

    try {
      await Brain.load(({ status, pct, file }) => {
        if (status === 'downloading') {
          this.setStatus(`Downloading model… ${pct}%`, 'downloading');
          this.setProgress(pct * 0.8); // First 80% = download
        } else if (status === 'done') {
          this.setStatus('Indexing papers…', 'downloading');
        }
      });

      // Index all papers from the global allPapers array (set by app.js)
      const papers = window.__cxcPapers || [];
      this.papers = papers;

      this.body.innerHTML = `<div class="ai-intro"><div class="ai-intro-icon">🔍</div><strong>Indexing ${papers.length} papers…</strong></div>`;

      await Brain.index(papers, ({ indexed, total }) => {
        const pct = 80 + Math.round((indexed / total) * 20);
        this.setProgress(pct);
        this.setStatus(`Indexing papers… ${indexed}/${total}`, 'downloading');
      });

      this.modelLoaded = true;
      this.btn.classList.remove('loading-state', 'pulsing');
      this.btn.classList.add('ready-state');
      this.btnLabel.textContent = 'AI Search';
      this.badge.textContent = '✓ READY';
      this.badge.style.color = '#00ff7f';
      this.badge.style.background = 'rgba(0,255,127,.12)';
      this.badge.style.borderColor = 'rgba(0,255,127,.2)';
      this.setProgress(100);
      setTimeout(() => this.setProgress(0), 600);
      this.setStatus(`${papers.length} papers indexed · search anything`, 'ready');
      this.showSearchUI();

    } catch (err) {
      this.setStatus('Failed to load model. Check your connection.', 'error');
      this.btnLabel.textContent = 'AI Search';
      this.btn.classList.remove('loading-state');
      this.showLoadPrompt();
    }
  }

  // ── Search UI ───────────────────────────────────────────
  showSearchUI(results = null, query = '') {
    const suggestionsHTML = !results ? `
      <div class="ai-suggestions">
        ${this.SUGGESTIONS.map(s => `<button class="ai-chip">${s}</button>`).join('')}
      </div>` : '';

    const bodyContent = results
      ? this.buildResults(results, query)
      : `<div class="ai-intro"><div class="ai-intro-icon">✨</div><strong>Ask anything</strong>Try "circle theorems", "past papers with answers", or a topic name.</div>`;

    this.body.innerHTML = `
      <div class="ai-search-wrap">
        <div class="ai-search-inner">
          <input type="text" id="aiQueryInput" placeholder="Search by topic, concept, subject…" autocomplete="off" value="${escHtml(query)}" />
          <button class="ai-search-go" id="aiGoBtn">Search</button>
        </div>
      </div>
      ${suggestionsHTML}
      <div class="ai-results" id="aiResults">${bodyContent}</div>
    `;

    const input = document.getElementById('aiQueryInput');
    const goBtn = document.getElementById('aiGoBtn');

    const doSearch = async () => {
      const q = input.value.trim();
      if (!q) return;
      await this.runSearch(q);
    };

    goBtn.addEventListener('click', doSearch);
    input.addEventListener('keydown', e => { if (e.key === 'Enter') doSearch(); });
    input.focus();

    // Suggestion chips
    this.body.querySelectorAll('.ai-chip').forEach(chip => {
      chip.addEventListener('click', () => {
        input.value = chip.textContent;
        doSearch();
      });
    });
  }

  async runSearch(query) {
    const resultsEl = document.getElementById('aiResults');
    if (!resultsEl) return;

    resultsEl.innerHTML = `<div class="ai-intro"><div class="ai-intro-icon">🔍</div><strong>Searching…</strong></div>`;
    this.setStatus('Searching…', '');

    try {
      const results = await Brain.search(query, 10);
      this.showSearchUI(results, query);
      this.setStatus(
        results.length ? `${results.length} results for "${query}"` : `No results for "${query}"`,
        'ready'
      );
    } catch (err) {
      resultsEl.innerHTML = `<div class="ai-intro">Search failed. Try again.</div>`;
    }
  }

  buildResults(results, query) {
    if (!results.length) {
      return `<div class="ai-intro"><div class="ai-intro-icon">😔</div><strong>No matches found</strong>Try a different topic or keyword.</div>`;
    }

    return results.map(({ paper, score }) => {
      const pct = Math.round(score * 100);
      return `
        <div class="ai-result-item" onclick="window.__cxcOpenPaper?.('${paper.id}')">
          <div class="ai-result-emoji">${paper.emoji || '📄'}</div>
          <div class="ai-result-info">
            <div class="ai-result-title">${escHtml(paper.title)}</div>
            <div class="ai-result-meta">${paper.subject_name || ''} · ${paper.level || ''} · ${paper.year || ''}</div>
          </div>
          <span class="ai-result-score">${pct}%</span>
        </div>`;
    }).join('');
  }

  // ── Helpers ─────────────────────────────────────────────
  setStatus(msg, type) {
    this.statusBar.textContent = msg;
    this.statusBar.className = `ai-status-bar ${type}`;
  }

  setProgress(pct, indeterminate = false) {
    if (indeterminate) {
      this.progressEl.classList.add('indeterminate');
    } else {
      this.progressEl.classList.remove('indeterminate');
      this.progressEl.style.width = pct + '%';
    }
  }
}

function escHtml(str) {
  return String(str || '').replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;').replace(/'/g,'&#39;');
}

// ─── BOOT ─────────────────────────────────────────────────
// Wait for DOM + fonts then init
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', () => new AISearchWidget());
} else {
  new AISearchWidget();
}
