/* =========================================================
   CXC PAPERS — ai-search.js v2
   Conversational Study Assistant
   - Full chat history with memory
   - Claude API for smart answers + topic help
   - Local semantic search via Transformers.js
   - Paper recommendations woven into conversation
   ========================================================= */

const styles = `
  #cxcAIBtn {
    position: fixed; bottom: 28px; right: 24px; z-index: 300;
    display: flex; align-items: center; gap: 8px;
    padding: 12px 20px;
    background: linear-gradient(135deg, #004d1a 0%, #008c2e 100%);
    color: #ffd700; border: none; border-radius: 50px;
    font-family: 'Syne', sans-serif; font-size: .88rem; font-weight: 700;
    cursor: pointer; box-shadow: 0 4px 20px rgba(0,77,26,.45);
    transition: all .2s cubic-bezier(.4,0,.2,1); letter-spacing: .3px;
  }
  #cxcAIBtn:hover { transform: translateY(-2px); box-shadow: 0 8px 28px rgba(0,77,26,.55); }
  #cxcAIBtn.pulsing { animation: aiBtnPulse 2s infinite; }
  #cxcAIBtn .dot { width: 8px; height: 8px; background: #ffd700; border-radius: 50%; flex-shrink: 0; }
  #cxcAIBtn.loading .dot { animation: dotSpin .8s linear infinite; background: rgba(255,215,0,.5); }
  #cxcAIBtn.ready   .dot { background: #00ff7f; box-shadow: 0 0 6px #00ff7f; }

  #cxcAIPanel {
    position: fixed; bottom: 90px; right: 24px; z-index: 299;
    width: min(400px, calc(100vw - 32px));
    background: #0d0d0d; border-radius: 20px;
    border: 1px solid rgba(255,215,0,.18);
    box-shadow: 0 24px 64px rgba(0,0,0,.7);
    display: flex; flex-direction: column; overflow: hidden;
    transform: translateY(16px) scale(.97); opacity: 0; pointer-events: none;
    transition: all .25s cubic-bezier(.4,0,.2,1);
    height: min(560px, 72vh);
  }
  #cxcAIPanel.open { transform: translateY(0) scale(1); opacity: 1; pointer-events: all; }

  .aip-header {
    padding: 13px 15px 11px; border-bottom: 1px solid rgba(255,255,255,.07);
    display: flex; align-items: center; justify-content: space-between; flex-shrink: 0;
  }
  .aip-title { display: flex; align-items: center; gap: 8px; }
  .aip-name { font-family:'Syne',sans-serif; font-size:.9rem; font-weight:800; color:#fff; }
  .aip-badge {
    font-size:.58rem; font-weight:700; letter-spacing:1.5px; text-transform:uppercase;
    padding:2px 7px; border-radius:10px; border:1px solid;
  }
  .aip-badge.offline { color:#ffd700; background:rgba(255,215,0,.1); border-color:rgba(255,215,0,.2); }
  .aip-badge.online  { color:#00ff7f; background:rgba(0,255,127,.1); border-color:rgba(0,255,127,.2); }
  .aip-actions { display:flex; gap:5px; }
  .aip-icon-btn {
    width:28px; height:28px; border-radius:50%; background:rgba(255,255,255,.07);
    color:rgba(255,255,255,.4); display:flex; align-items:center; justify-content:center;
    font-size:.8rem; cursor:pointer; transition:all .15s; border:none; font-family:inherit;
  }
  .aip-icon-btn:hover { background:rgba(255,255,255,.13); color:#fff; }

  .aip-progress { height:2px; background:rgba(255,255,255,.05); flex-shrink:0; overflow:hidden; }
  .aip-progress-fill { height:100%; background:linear-gradient(90deg,#ffd700,#00ff7f); width:0%; transition:width .3s; }
  .aip-progress-fill.spin { width:40%; animation:progSpin 1.2s ease-in-out infinite; }

  .aip-status {
    padding:4px 14px; font-size:.67rem; color:rgba(255,255,255,.3);
    font-family:'DM Sans',sans-serif; flex-shrink:0;
  }
  .aip-status.dl  { color:#ffd700; }
  .aip-status.ok  { color:rgba(0,255,127,.6); }
  .aip-status.err { color:#ff6b6b; }

  /* Load screen */
  .aip-load {
    flex:1; display:flex; flex-direction:column; align-items:center;
    justify-content:center; padding:28px 22px; text-align:center; gap:10px;
  }
  .aip-load .icon { font-size:2.4rem; }
  .aip-load h3 { font-family:'Syne',sans-serif; font-size:1rem; font-weight:800; color:#fff; }
  .aip-load p { font-size:.78rem; color:rgba(255,255,255,.38); line-height:1.6; max-width:270px; }
  .aip-load p strong { color:#ffd700; }
  .aip-load-btn {
    padding:11px 28px; background:linear-gradient(135deg,#004d1a,#008c2e);
    color:#ffd700; border:none; border-radius:12px;
    font-family:'Syne',sans-serif; font-size:.88rem; font-weight:700;
    cursor:pointer; transition:all .15s; margin-top:4px;
  }
  .aip-load-btn:hover { filter:brightness(1.1); transform:translateY(-1px); }
  .aip-size { font-size:.64rem; color:rgba(255,255,255,.18); }

  /* Chat */
  .aip-chat {
    flex:1; overflow-y:auto; padding:12px 13px;
    display:flex; flex-direction:column; gap:10px;
    scrollbar-width:thin; scrollbar-color:rgba(255,255,255,.07) transparent;
  }
  .aip-msg { display:flex; gap:8px; animation:msgIn .2s ease both; }
  .aip-msg.user { flex-direction:row-reverse; }
  .aip-avatar {
    width:26px; height:26px; border-radius:50%; flex-shrink:0;
    display:flex; align-items:center; justify-content:center;
    font-size:.72rem; margin-top:2px;
  }
  .aip-msg.bot  .aip-avatar { background:linear-gradient(135deg,#004d1a,#008c2e); color:#ffd700; }
  .aip-msg.user .aip-avatar { background:rgba(255,215,0,.12); color:#ffd700; border:1px solid rgba(255,215,0,.2); }
  .aip-bubble {
    max-width:84%; padding:9px 13px; font-size:.82rem; line-height:1.58;
    font-family:'DM Sans',sans-serif;
  }
  .aip-msg.bot  .aip-bubble { background:rgba(255,255,255,.06); color:rgba(255,255,255,.88); border-radius:4px 14px 14px 14px; }
  .aip-msg.user .aip-bubble { background:rgba(255,215,0,.11); color:#ffd700; border:1px solid rgba(255,215,0,.14); border-radius:14px 4px 14px 14px; }
  .aip-bubble strong { color:#fff; font-weight:600; }
  .aip-bubble em { color:rgba(255,255,255,.6); font-style:normal; }

  .aip-paper-card {
    display:flex; align-items:center; gap:8px; margin-top:6px;
    background:rgba(255,255,255,.05); border:1px solid rgba(255,255,255,.1);
    border-radius:10px; padding:8px 10px; cursor:pointer; transition:all .15s;
    text-decoration:none;
  }
  .aip-paper-card:hover { background:rgba(255,215,0,.08); border-color:rgba(255,215,0,.25); }
  .aip-paper-icon { font-size:1.1rem; flex-shrink:0; }
  .aip-paper-info { flex:1; min-width:0; }
  .aip-paper-title { font-size:.77rem; font-weight:600; color:#fff; font-family:'Syne',sans-serif; white-space:nowrap; overflow:hidden; text-overflow:ellipsis; }
  .aip-paper-meta  { font-size:.67rem; color:rgba(255,255,255,.38); margin-top:1px; }
  .aip-paper-arrow { color:rgba(255,215,0,.45); font-size:.8rem; flex-shrink:0; }

  .aip-typing { display:flex; gap:4px; align-items:center; padding:6px 2px; }
  .aip-typing span { width:6px; height:6px; background:rgba(255,255,255,.28); border-radius:50%; animation:typeDot 1.2s ease-in-out infinite; }
  .aip-typing span:nth-child(2) { animation-delay:.2s; }
  .aip-typing span:nth-child(3) { animation-delay:.4s; }

  /* Quick prompts */
  .aip-quick {
    display:flex; gap:5px; flex-wrap:wrap;
    padding:0 12px 8px; flex-shrink:0;
  }
  .aip-qp {
    padding:4px 10px; background:rgba(255,255,255,.05);
    border:1px solid rgba(255,255,255,.09); border-radius:20px;
    color:rgba(255,255,255,.45); font-size:.69rem; cursor:pointer;
    transition:all .15s; font-family:'DM Sans',sans-serif; white-space:nowrap;
  }
  .aip-qp:hover { background:rgba(255,215,0,.1); border-color:rgba(255,215,0,.25); color:#ffd700; }

  /* Input */
  .aip-input-wrap { padding:9px 12px 12px; border-top:1px solid rgba(255,255,255,.07); flex-shrink:0; }
  .aip-input-row {
    display:flex; align-items:flex-end; gap:8px;
    background:rgba(255,255,255,.06); border:1.5px solid rgba(255,255,255,.1);
    border-radius:14px; padding:8px 8px 8px 13px; transition:border-color .15s;
  }
  .aip-input-row:focus-within { border-color:rgba(255,215,0,.32); }
  .aip-input-row textarea {
    flex:1; background:none; border:none; outline:none; color:#fff;
    font-family:'DM Sans',sans-serif; font-size:.84rem;
    resize:none; min-height:20px; max-height:90px; line-height:1.4; padding:2px 0;
  }
  .aip-input-row textarea::placeholder { color:rgba(255,255,255,.25); }
  .aip-send {
    width:32px; height:32px; border-radius:10px; background:#ffd700; color:#004d1a;
    border:none; cursor:pointer; display:flex; align-items:center; justify-content:center;
    font-size:.88rem; flex-shrink:0; transition:all .15s;
  }
  .aip-send:hover:not(:disabled) { background:#ffe033; transform:scale(1.06); }
  .aip-send:disabled { opacity:.35; cursor:not-allowed; }

  @keyframes aiBtnPulse { 0%,100%{box-shadow:0 4px 20px rgba(0,77,26,.45),0 0 0 0 rgba(255,215,0,.35)} 50%{box-shadow:0 4px 20px rgba(0,77,26,.45),0 0 0 8px rgba(255,215,0,0)} }
  @keyframes dotSpin { 0%,100%{transform:scale(1);opacity:1} 50%{transform:scale(1.4);opacity:.5} }
  @keyframes progSpin { 0%{transform:translateX(-100%)} 100%{transform:translateX(350%)} }
  @keyframes msgIn { from{opacity:0;transform:translateY(5px)} to{opacity:1;transform:translateY(0)} }
  @keyframes typeDot { 0%,60%,100%{transform:translateY(0)} 30%{transform:translateY(-5px)} }
`;

function injectUI() {
  const s = document.createElement('style');
  s.textContent = styles;
  document.head.appendChild(s);

  document.body.insertAdjacentHTML('beforeend', `
    <button id="cxcAIBtn" class="pulsing">
      <span class="dot"></span>
      <span id="aiBtnLabel">Study Assistant</span>
    </button>
    <div id="cxcAIPanel" role="dialog">
      <div class="aip-header">
        <div class="aip-title">
          <span class="aip-name">🧠 CXC Assistant</span>
          <span class="aip-badge offline" id="aiBadge">AI</span>
        </div>
        <div class="aip-actions">
          <button class="aip-icon-btn" id="aiClearBtn" title="Clear chat">🗑</button>
          <button class="aip-icon-btn" id="aiCloseBtn">✕</button>
        </div>
      </div>
      <div class="aip-progress"><div class="aip-progress-fill" id="aiProg"></div></div>
      <div class="aip-status" id="aiStat">Powered by local AI · no internet needed after loading</div>

      <div class="aip-load" id="aiLoadScreen">
        <div class="icon">📚</div>
        <h3>CXC Study Assistant</h3>
        <p>Chat about topics, get study tips, and find <strong>past papers</strong>. Powered by local AI — runs in your browser.</p>
        <button class="aip-load-btn" id="aiLoadBtn">⬇ Activate Assistant</button>
        <p class="aip-size">~23MB · downloads once · cached forever</p>
      </div>

      <div id="aiChatWrap" style="display:none;flex:1;overflow:hidden;flex-direction:column;">
        <div class="aip-chat" id="aiChat"></div>
        <div class="aip-quick" id="aiQuick"></div>
        <div class="aip-input-wrap">
          <div class="aip-input-row">
            <textarea id="aiInput" placeholder="Ask anything about CXC…" rows="1"></textarea>
            <button class="aip-send" id="aiSend">➤</button>
          </div>
        </div>
      </div>
    </div>
  `);
}

// ─── ASSISTANT ────────────────────────────────────────────
class CXCAssistant {
  constructor() {
    injectUI();
    this.btn        = document.getElementById('cxcAIBtn');
    this.panel      = document.getElementById('cxcAIPanel');
    this.badge      = document.getElementById('aiBadge');
    this.statEl     = document.getElementById('aiStat');
    this.progEl     = document.getElementById('aiProg');
    this.btnLabel   = document.getElementById('aiBtnLabel');
    this.chatEl     = document.getElementById('aiChat');
    this.inputEl    = document.getElementById('aiInput');
    this.sendBtn    = document.getElementById('aiSend');
    this.chatWrap   = document.getElementById('aiChatWrap');
    this.loadScreen = document.getElementById('aiLoadScreen');
    this.quickEl    = document.getElementById('aiQuick');
    this.isOpen     = false;
    this.isReady    = false;
    this.isThinking = false;
    this.history    = [];
    this.Brain      = null;

    this.QUICK = [
      'Find Maths papers 📐', 'Help me study Biology 🧬',
      'Explain photosynthesis', 'CSEC English A topics',
      'How to pass CSEC?', 'Chemistry past papers'
    ];

    this.SYSTEM = `You are a friendly CXC study assistant for Caribbean students preparing for CSEC and CAPE exams. You help them:
- Find relevant past papers (recommend from the paper list provided)
- Understand topics (biology, chemistry, maths, history, English etc.)
- Give exam tips and study strategies
- Answer subject questions concisely

When papers are relevant, reference them from the [PAPERS] context provided. Keep replies short and conversational — 2-4 sentences max unless explaining a concept. Use light emoji. Be encouraging. Speak like a knowledgeable Caribbean tutor, not a robot.`;

    this.btn.addEventListener('click', () => this.toggle());
    document.getElementById('aiCloseBtn').addEventListener('click', () => this.close());
    document.getElementById('aiClearBtn').addEventListener('click', () => this.clearChat());
    document.getElementById('aiLoadBtn').addEventListener('click', () => this.activate());
    document.addEventListener('keydown', e => { if (e.key === 'Escape' && this.isOpen) this.close(); });
    this.sendBtn.addEventListener('click', () => this.send());
    this.inputEl.addEventListener('keydown', e => {
      if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); this.send(); }
    });
    this.inputEl.addEventListener('input', () => {
      this.inputEl.style.height = 'auto';
      this.inputEl.style.height = Math.min(this.inputEl.scrollHeight, 90) + 'px';
    });
  }

  toggle() { this.isOpen ? this.close() : this.open(); }

  open() {
    this.isOpen = true;
    this.panel.classList.add('open');
    this.btn.classList.remove('pulsing');
    if (this.isReady) setTimeout(() => this.inputEl.focus(), 260);
  }

  close() { this.isOpen = false; this.panel.classList.remove('open'); }

  // ── Activate ───────────────────────────────────────────
  async activate() {
    this.loadScreen.style.display = 'none';
    this.chatWrap.style.cssText = 'display:flex;flex:1;overflow:hidden;flex-direction:column;';
    this.btn.classList.add('loading');
    this.btnLabel.textContent = 'Loading…';
    this.setStat('Loading AI model…', 'dl');
    this.setProg(0, true);

    this.addMsg('bot', `Hey! 👋 Loading up — just a moment…`);

    try {
      const { Brain } = await import('./brain.js');
      this.Brain = Brain;

      await Brain.load(({ status, pct }) => {
        if (status === 'downloading') {
          this.setStat(`Downloading model… ${pct}%`, 'dl');
          this.setProg(pct * 0.8);
        }
      });

      const papers = window.__cxcPapers || [];
      this.setStat(`Indexing ${papers.length} papers…`, 'dl');
      await Brain.index(papers, ({ indexed, total }) => {
        this.setProg(80 + Math.round((indexed / total) * 20));
      });

      this.isReady = true;
      this.btn.classList.remove('loading');
      this.btn.classList.add('ready');
      this.btnLabel.textContent = 'Study Assistant';
      this.badge.textContent = '✓ READY';
      this.badge.className = 'aip-badge online';
      this.setProg(100);
      setTimeout(() => this.setProg(0), 600);
      this.setStat(`${papers.length} papers indexed · ask me anything`, 'ok');

      // Replace loading message
      this.chatEl.innerHTML = '';
      this.addMsg('bot', `I'm ready! 🎉 I can help you find past papers, explain topics, and give study tips. What subject are you studying?`);
      this.renderQuick();
      this.inputEl.focus();

    } catch (err) {
      console.error(err);
      this.setStat('Failed to load. Check your connection.', 'err');
      this.btn.classList.remove('loading');
      this.addMsg('bot', `Sorry, I couldn't load. Try refreshing the page. 😔`);
    }
  }

  // ── Send message ───────────────────────────────────────
  async send() {
    const text = this.inputEl.value.trim();
    if (!text || this.isThinking || !this.isReady) return;

    this.inputEl.value = '';
    this.inputEl.style.height = 'auto';
    this.addMsg('user', text);
    this.clearQuick();
    this.setThinking(true);

    try {
      // Semantic search for relevant papers
      const paperResults = await this.Brain.search(text, 5);
      const paperContext = paperResults.length
        ? `[PAPERS]\n${paperResults.map(r => `- ${r.paper.title} (${r.paper.subject_name}, ${r.paper.level}, ${r.paper.year})`).join('\n')}\n[/PAPERS]`
        : '';

      // Build messages for Claude API
      const userContent = paperContext ? `${paperContext}\n\nStudent: ${text}` : text;
      this.history.push({ role: 'user', content: userContent });

      // Keep history to last 10 turns to save tokens
      const trimmedHistory = this.history.slice(-10);

      const response = await fetch('https://api.anthropic.com/v1/messages', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          model: 'claude-sonnet-4-20250514',
          max_tokens: 400,
          system: this.SYSTEM,
          messages: trimmedHistory
        })
      });

      const data = await response.json();
      const reply = data.content?.[0]?.text || 'Sorry, I had trouble with that. Try again?';

      this.history.push({ role: 'assistant', content: reply });
      this.removeTyping();
      this.addMsg('bot', reply, paperResults.slice(0, 3));

    } catch (err) {
      console.error(err);
      this.removeTyping();
      this.addMsg('bot', `Hmm, something went wrong. Check your connection and try again. 🔌`);
    }

    this.setThinking(false);
    this.renderQuick();
  }

  // ── Add message to chat ────────────────────────────────
  addMsg(role, text, papers = []) {
    const avatar = role === 'bot' ? '🧠' : '👤';
    const div = document.createElement('div');
    div.className = `aip-msg ${role}`;

    // Convert **bold** and newlines in text
    const formatted = text
      .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
      .replace(/\n/g, '<br>');

    const paperCards = papers.map(r => {
      const isFolder = r.paper.file_url?.includes('drive.google.com/drive/folders');
      return `<a href="${r.paper.file_url || '#'}" target="_blank" rel="noopener" class="aip-paper-card">
        <span class="aip-paper-icon">${r.paper.emoji || '📄'}</span>
        <div class="aip-paper-info">
          <div class="aip-paper-title">${esc(r.paper.title)}</div>
          <div class="aip-paper-meta">${r.paper.subject_name} · ${r.paper.level} · ${isFolder ? 'Multiple years' : r.paper.year}</div>
        </div>
        <span class="aip-paper-arrow">→</span>
      </a>`;
    }).join('');

    div.innerHTML = `
      <div class="aip-avatar">${avatar}</div>
      <div class="aip-bubble">${formatted}${paperCards}</div>`;
    this.chatEl.appendChild(div);
    this.scrollBottom();
  }

  setThinking(on) {
    this.isThinking = on;
    this.sendBtn.disabled = on;
    this.inputEl.disabled = on;
    if (on) {
      const d = document.createElement('div');
      d.className = 'aip-msg bot'; d.id = 'aiTyping';
      d.innerHTML = `<div class="aip-avatar">🧠</div><div class="aip-bubble"><div class="aip-typing"><span></span><span></span><span></span></div></div>`;
      this.chatEl.appendChild(d);
      this.scrollBottom();
    }
  }

  removeTyping() {
    document.getElementById('aiTyping')?.remove();
  }

  clearChat() {
    this.history = [];
    this.chatEl.innerHTML = '';
    this.addMsg('bot', `Chat cleared! What would you like to study? 📚`);
    this.renderQuick();
  }

  renderQuick() {
    this.quickEl.innerHTML = this.QUICK.map(q =>
      `<button class="aip-qp">${q}</button>`
    ).join('');
    this.quickEl.querySelectorAll('.aip-qp').forEach(btn => {
      btn.addEventListener('click', () => {
        this.inputEl.value = btn.textContent.replace(/[\p{Emoji}]/gu, '').trim();
        this.send();
      });
    });
  }

  clearQuick() { this.quickEl.innerHTML = ''; }

  scrollBottom() {
    requestAnimationFrame(() => {
      this.chatEl.scrollTop = this.chatEl.scrollHeight;
    });
  }

  setStat(msg, cls = '') {
    this.statEl.textContent = msg;
    this.statEl.className = `aip-status ${cls}`;
  }

  setProg(pct, spin = false) {
    if (spin) { this.progEl.classList.add('spin'); }
    else { this.progEl.classList.remove('spin'); this.progEl.style.width = pct + '%'; }
  }
}

function esc(s) {
  return String(s||'').replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;');
}

if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', () => new CXCAssistant());
} else {
  new CXCAssistant();
}
