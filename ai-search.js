/* =========================================================
   CXC PAPERS — ai-search.js v3
   Fully local conversational assistant
   No API key needed — runs 100% in the browser
   Uses Transformers.js for semantic search + intent detection
   ========================================================= */

const styles = `
  #cxcAIBtn {
    position:fixed; bottom:28px; right:24px; z-index:300;
    display:flex; align-items:center; gap:8px; padding:12px 20px;
    background:linear-gradient(135deg,#004d1a 0%,#008c2e 100%);
    color:#ffd700; border:none; border-radius:50px;
    font-family:'Syne',sans-serif; font-size:.88rem; font-weight:700;
    cursor:pointer; box-shadow:0 4px 20px rgba(0,77,26,.45);
    transition:all .2s cubic-bezier(.4,0,.2,1); letter-spacing:.3px;
  }
  #cxcAIBtn:hover { transform:translateY(-2px); box-shadow:0 8px 28px rgba(0,77,26,.55); }
  #cxcAIBtn.pulsing { animation:aiBtnPulse 2s infinite; }
  #cxcAIBtn .dot { width:8px; height:8px; background:#ffd700; border-radius:50%; flex-shrink:0; }
  #cxcAIBtn.loading .dot { animation:dotSpin .8s linear infinite; background:rgba(255,215,0,.5); }
  #cxcAIBtn.ready   .dot { background:#00ff7f; box-shadow:0 0 6px #00ff7f; }

  #cxcAIPanel {
    position:fixed; bottom:90px; right:24px; z-index:299;
    width:min(400px,calc(100vw - 32px));
    background:#0d0d0d; border-radius:20px;
    border:1px solid rgba(255,215,0,.18);
    box-shadow:0 24px 64px rgba(0,0,0,.7);
    display:flex; flex-direction:column; overflow:hidden;
    transform:translateY(16px) scale(.97); opacity:0; pointer-events:none;
    transition:all .25s cubic-bezier(.4,0,.2,1);
    height:min(560px,72vh);
  }
  #cxcAIPanel.open { transform:translateY(0) scale(1); opacity:1; pointer-events:all; }

  .aip-header {
    padding:13px 15px 11px; border-bottom:1px solid rgba(255,255,255,.07);
    display:flex; align-items:center; justify-content:space-between; flex-shrink:0;
  }
  .aip-title { display:flex; align-items:center; gap:8px; }
  .aip-name { font-family:'Syne',sans-serif; font-size:.9rem; font-weight:800; color:#fff; }
  .aip-badge {
    font-size:.58rem; font-weight:700; letter-spacing:1.5px; text-transform:uppercase;
    padding:2px 7px; border-radius:10px; border:1px solid;
    color:#ffd700; background:rgba(255,215,0,.1); border-color:rgba(255,215,0,.2);
  }
  .aip-badge.on { color:#00ff7f; background:rgba(0,255,127,.1); border-color:rgba(0,255,127,.2); }
  .aip-actions { display:flex; gap:5px; }
  .aip-icon-btn {
    width:28px; height:28px; border-radius:50%; background:rgba(255,255,255,.07);
    color:rgba(255,255,255,.4); display:flex; align-items:center; justify-content:center;
    font-size:.8rem; cursor:pointer; transition:all .15s; border:none; font-family:inherit;
  }
  .aip-icon-btn:hover { background:rgba(255,255,255,.13); color:#fff; }

  .aip-prog { height:2px; background:rgba(255,255,255,.05); flex-shrink:0; overflow:hidden; }
  .aip-prog-fill { height:100%; background:linear-gradient(90deg,#ffd700,#00ff7f); width:0%; transition:width .3s; }
  .aip-prog-fill.spin { width:40%; animation:progSpin 1.2s ease-in-out infinite; }

  .aip-stat { padding:4px 14px; font-size:.67rem; color:rgba(255,255,255,.3); font-family:'DM Sans',sans-serif; flex-shrink:0; }
  .aip-stat.dl  { color:#ffd700; }
  .aip-stat.ok  { color:rgba(0,255,127,.6); }
  .aip-stat.err { color:#ff6b6b; }

  .aip-load {
    flex:1; display:flex; flex-direction:column; align-items:center;
    justify-content:center; padding:28px 22px; text-align:center; gap:10px;
  }
  .aip-load .li { font-size:2.4rem; }
  .aip-load h3 { font-family:'Syne',sans-serif; font-size:1rem; font-weight:800; color:#fff; }
  .aip-load p  { font-size:.78rem; color:rgba(255,255,255,.38); line-height:1.6; max-width:270px; }
  .aip-load p strong { color:#ffd700; }
  .aip-load-btn {
    padding:11px 28px; background:linear-gradient(135deg,#004d1a,#008c2e);
    color:#ffd700; border:none; border-radius:12px;
    font-family:'Syne',sans-serif; font-size:.88rem; font-weight:700;
    cursor:pointer; transition:all .15s; margin-top:4px;
  }
  .aip-load-btn:hover { filter:brightness(1.1); transform:translateY(-1px); }
  .aip-size { font-size:.64rem; color:rgba(255,255,255,.18); }

  .aip-chat {
    flex:1; overflow-y:auto; padding:12px 13px;
    display:flex; flex-direction:column; gap:10px;
    scrollbar-width:thin; scrollbar-color:rgba(255,255,255,.07) transparent;
  }
  .aip-msg { display:flex; gap:8px; animation:msgIn .2s ease both; }
  .aip-msg.user { flex-direction:row-reverse; }
  .aip-av {
    width:26px; height:26px; border-radius:50%; flex-shrink:0;
    display:flex; align-items:center; justify-content:center;
    font-size:.72rem; margin-top:2px;
  }
  .aip-msg.bot  .aip-av { background:linear-gradient(135deg,#004d1a,#008c2e); color:#ffd700; }
  .aip-msg.user .aip-av { background:rgba(255,215,0,.12); color:#ffd700; border:1px solid rgba(255,215,0,.2); }
  .aip-bub {
    max-width:84%; padding:9px 13px; font-size:.82rem; line-height:1.58;
    font-family:'DM Sans',sans-serif;
  }
  .aip-msg.bot  .aip-bub { background:rgba(255,255,255,.06); color:rgba(255,255,255,.88); border-radius:4px 14px 14px 14px; }
  .aip-msg.user .aip-bub { background:rgba(255,215,0,.11); color:#ffd700; border:1px solid rgba(255,215,0,.14); border-radius:14px 4px 14px 14px; }
  .aip-bub strong { color:#fff; font-weight:600; }

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

  .aip-quick { display:flex; gap:5px; flex-wrap:wrap; padding:0 12px 8px; flex-shrink:0; }
  .aip-qp {
    padding:4px 10px; background:rgba(255,255,255,.05);
    border:1px solid rgba(255,255,255,.09); border-radius:20px;
    color:rgba(255,255,255,.45); font-size:.69rem; cursor:pointer;
    transition:all .15s; font-family:'DM Sans',sans-serif; white-space:nowrap;
  }
  .aip-qp:hover { background:rgba(255,215,0,.1); border-color:rgba(255,215,0,.25); color:#ffd700; }

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
    <button id="cxcAIBtn" class="pulsing"><span class="dot"></span><span id="aiBtnLabel">Study Assistant</span></button>
    <div id="cxcAIPanel" role="dialog">
      <div class="aip-header">
        <div class="aip-title">
          <span class="aip-name">🧠 CXC Assistant</span>
          <span class="aip-badge" id="aiBadge">AI</span>
        </div>
        <div class="aip-actions">
          <button class="aip-icon-btn" id="aiClearBtn" title="Clear chat">🗑</button>
          <button class="aip-icon-btn" id="aiCloseBtn">✕</button>
        </div>
      </div>
      <div class="aip-prog"><div class="aip-prog-fill" id="aiProg"></div></div>
      <div class="aip-stat" id="aiStat">Local AI · runs entirely in your browser</div>
      <div class="aip-load" id="aiLoadScreen">
        <div class="li">📚</div>
        <h3>CXC Study Assistant</h3>
        <p>Chat about topics, get study tips, and find <strong>past papers</strong> — all running locally in your browser.</p>
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

// ─── KNOWLEDGE BASE ───────────────────────────────────────
const KB = {
  photosynthesis: `**Photosynthesis** is how plants make food using sunlight 🌱\n\nThe equation: **6CO₂ + 6H₂O + light → C₆H₁₂O₆ + 6O₂**\n\nKey points:\n• Happens in the **chloroplasts** (contains chlorophyll)\n• Two stages: **Light reactions** (in thylakoid) and **Calvin cycle** (in stroma)\n• Chlorophyll absorbs red and blue light, reflects green\n\nFor CSEC, know the word equation, the stages, and factors affecting the rate (light intensity, CO₂ concentration, temperature).`,

  mitosis: `**Mitosis** = cell division that produces 2 identical daughter cells 🔬\n\nStages: **PMAT** — Prophase, Metaphase, Anaphase, Telophase\n\n• Used for growth, repair, asexual reproduction\n• Result: 2 cells with same chromosome number as parent (diploid)\n• Different from **meiosis** which produces 4 cells with half the chromosomes (used in sexual reproduction)`,

  meiosis: `**Meiosis** produces 4 genetically unique cells with half the chromosome number 🧬\n\n• Used to make **gametes** (sperm + eggs)\n• Two divisions: Meiosis I and Meiosis II\n• Key feature: **crossing over** in Prophase I — creates genetic variation\n• Result: haploid cells (half the chromosomes)`,

  quadratic: `**Quadratic equations** have the form **ax² + bx + c = 0** 📐\n\nThree ways to solve:\n1. **Factoring** — split into two brackets\n2. **Quadratic formula**: x = (-b ± √(b²-4ac)) / 2a\n3. **Completing the square**\n\nFor CSEC Paper 2, factoring is fastest when it works. Always check: can it be factored? If b²-4ac is negative, no real roots.`,

  pythagoras: `**Pythagoras Theorem**: In a right triangle, **a² + b² = c²** 📐\n\nwhere c is the **hypotenuse** (longest side, opposite the right angle).\n\nUsed for:\n• Finding missing sides in right triangles\n• Proving if a triangle is right-angled\n• Distance between two points on a graph\n\nTip: Always identify the hypotenuse first!`,

  slavery: `**Slavery in the Caribbean** is a major CSEC History topic 🏛️\n\nKey facts:\n• **Transatlantic Slave Trade**: 16th–19th century, millions enslaved from West Africa\n• **Middle Passage**: brutal journey across Atlantic\n• **Plantation system**: sugar, tobacco, cotton — backbone of Caribbean economy\n• **Abolition**: British abolished slave trade 1807, emancipation 1834 (apprenticeship ended 1838)\n• **Resistance**: Maroons, Sam Sharpe Rebellion (Jamaica 1831), Bussa's Rebellion (Barbados 1816)\n\nFor CSEC, know causes of abolition: economic (Capitalism), moral (Wilberforce), and enslaved people's resistance.`,

  independence: `**Caribbean Independence** — key dates for CSEC History 🇯🇲\n\n• **Jamaica**: August 6, **1962**\n• **Trinidad & Tobago**: August 31, 1962\n• **Barbados**: November 30, 1966\n• **Guyana**: May 26, 1966\n• **The West Indies Federation**: 1958–1962 (failed — Jamaica voted to leave)\n\nKey figures: Norman Manley, Alexander Bustamante (Jamaica), Eric Williams (T&T), Grantley Adams (Barbados)`,

  englisha: `**CSEC English A** — Paper breakdown ✍️\n\n**Paper 1** (MCQ): Reading comprehension, grammar, vocabulary\n**Paper 2**: \n• Section A — Summary writing (40 marks)\n• Section B — Essay writing (choose 1 from ~4 options, 30 marks)\n• Section C — Short story/creative writing OR persuasive writing\n\n**Top tips:**\n• Summary: don't copy sentences — paraphrase in your own words\n• Essays: plan before you write (5-min outline)\n• Use varied sentence structure and vocabulary\n• Proofread for punctuation and spelling`,

  accounts: `**Principles of Accounts (POA)** — CSEC key topics 📊\n\n• **Accounting equation**: Assets = Liabilities + Capital\n• **Double entry**: every transaction affects 2 accounts\n• **Journal entries** → Ledger → Trial Balance → Final Accounts\n• **Final accounts**: Income Statement + Balance Sheet\n• **Cash flow**: Cash Book, Petty Cash Book\n• **Depreciation**: Straight line method most common in CSEC\n\nCommon mistakes: forgetting to balance T-accounts, mixing up debit/credit rules.`,

  chemistry_basics: `**CSEC Chemistry** key topics 🧪\n\n• **Atomic structure**: protons, neutrons, electrons; atomic number vs mass number\n• **Bonding**: ionic (metal + non-metal), covalent (non-metals), metallic\n• **Acids & Bases**: pH scale, neutralisation reactions\n• **Electrolysis**: cathode (reduction), anode (oxidation)\n• **Organic chemistry**: alkanes, alkenes, alcohols, carboxylic acids\n• **Rates of reaction**: temperature, concentration, surface area, catalyst\n\nAlways balance equations — examiners mark this heavily!`,

  physics_basics: `**CSEC Physics** key topics ⚛️\n\n• **Mechanics**: speed, velocity, acceleration, Newton's laws, momentum\n• **Waves**: transverse vs longitudinal, frequency, wavelength, wave speed\n• **Electricity**: Ohm's law (V=IR), series/parallel circuits, power (P=IV)\n• **Thermal physics**: heat transfer (conduction, convection, radiation)\n• **Light**: reflection, refraction, lenses, total internal reflection\n\nFormulas to memorise: v=fλ, V=IR, P=IV, KE=½mv², GPE=mgh`,

  passcsec: `**How to pass CSEC** 🏆\n\n1. **Past papers are everything** — do at least 5 years for each subject\n2. **Know the mark scheme** — understand what examiners want\n3. **Time management** — in the exam, don't spend too long on one question\n4. **Start with what you know** — build confidence, come back to hard ones\n5. **For essays/long answers**: plan first (2 min), write, check\n6. **Maths**: show ALL working — you get marks even if the final answer is wrong\n7. **Science**: learn definitions word-for-word, examiners are strict\n8. **Practice under timed conditions** — simulate the real exam`,

  studytips: `**General CSEC study tips** 📝\n\n• **Spaced repetition**: study a topic, review it 1 day later, then 1 week later\n• **Active recall**: close your notes and try to write everything you remember\n• **Pomodoro**: 25 min focused study, 5 min break\n• **Form study groups** — teaching others is the fastest way to learn\n• **Past papers > reading textbooks** — especially in final months before exams\n• **Sleep matters** — your brain consolidates memory during sleep\n• **Exercise** — even a 20 min walk improves focus`,
};

// ─── INTENT DETECTION ─────────────────────────────────────
function detectIntent(text) {
  const t = text.toLowerCase();

  // Greetings
  if (/^(hi|hello|hey|yo|wah gwaan|whaddup|good morning|good afternoon|good evening)/.test(t))
    return 'greeting';

  // Paper search
  if (/\b(find|get|show|need|want|looking for|give me|where|download|access)\b/.test(t) && /\b(paper|past paper|exam|test|question)\b/.test(t))
    return 'find_papers';
  if (/\bpast papers?\b/.test(t)) return 'find_papers';
  if (/\bpapers?\b/.test(t) && /\b(maths?|mathematics|english|biology|chemistry|physics|accounts|history|geography|spanish|french|IT|integrated|social|business|economics)\b/.test(t))
    return 'find_papers';

  // Topic explanations
  if (/photosynthes/.test(t)) return 'topic:photosynthesis';
  if (/\bmitosis\b/.test(t)) return 'topic:mitosis';
  if (/\bmeiosis\b/.test(t)) return 'topic:meiosis';
  if (/quadratic/.test(t)) return 'topic:quadratic';
  if (/pythagoras|pythagorean/.test(t)) return 'topic:pythagoras';
  if (/slavery|enslav|abolit|plantation|middle passage/.test(t)) return 'topic:slavery';
  if (/independen|federation|bustamante|manley|eric williams/.test(t)) return 'topic:independence';
  if (/english\s*a\b/.test(t) && /\b(topic|syllabus|paper|help|study|tip|exam)\b/.test(t)) return 'topic:englisha';
  if (/\b(poa|principles of accounts|accounting)\b/.test(t) && /\b(topic|help|tip|explain|study)\b/.test(t)) return 'topic:accounts';
  if (/\bchemistry\b/.test(t) && /\b(topic|help|tip|explain|study|key)\b/.test(t)) return 'topic:chemistry_basics';
  if (/\bphysics\b/.test(t) && /\b(topic|help|tip|explain|study|key)\b/.test(t)) return 'topic:physics_basics';

  // How to pass / study tips
  if (/how.*(pass|ace|do well|get grade)|tips?.*csec|study tips?|how.*study/.test(t)) return 'topic:passcsec';
  if (/study tips?|how.*study|best way.*study/.test(t)) return 'topic:studytips';

  // What subjects / what's available
  if (/what subjects?|what.*available|what.*site|what.*have/.test(t)) return 'list_subjects';

  // Thanks
  if (/\b(thanks?|thank you|thx|ty|appreciate)\b/.test(t)) return 'thanks';

  // Default: semantic search
  return 'search';
}

// Extract subject name from query
function extractSubject(text) {
  const t = text.toLowerCase();
  const map = {
    'mathematics': ['math', 'maths', 'mathematics'],
    'english a': ['english a', 'english'],
    'biology': ['biology', 'bio'],
    'chemistry': ['chemistry', 'chem'],
    'physics': ['physics', 'phys'],
    'principles of accounts': ['accounts', 'poa', 'principles of accounts'],
    'caribbean history': ['history', 'caribbean history'],
    'geography': ['geography', 'geo'],
    'information technology': ['it', 'information technology', 'ict'],
    'spanish': ['spanish'],
    'french': ['french'],
    'social studies': ['social studies', 'social'],
    'human & social biology': ['hsb', 'human and social biology', 'human social biology'],
    'principles of business': ['pob', 'principles of business', 'business'],
    'integrated science': ['integrated science', 'int science'],
    'additional mathematics': ['add math', 'additional math', 'additional mathematics'],
    'economics': ['economics', 'econ'],
  };
  for (const [subject, keywords] of Object.entries(map)) {
    if (keywords.some(k => t.includes(k))) return subject;
  }
  return null;
}

// ─── RESPONSE GENERATOR ───────────────────────────────────
function generateResponse(intent, text, papers, context) {
  const subject = extractSubject(text);

  switch (intent) {
    case 'greeting':
      return {
        text: `Hey! 👋 Welcome to CXC Papers. I'm your study assistant — I can:\n\n• Find **past papers** for any CSEC/CAPE subject\n• Explain **topics** like photosynthesis, quadratics, Caribbean history\n• Give you **study tips** and exam strategies\n\nWhat are you studying for?`,
        papers: []
      };

    case 'thanks':
      return {
        text: `You're welcome! 😊 Good luck with your studies — you've got this! 💪\n\nAsk me anything else whenever you need.`,
        papers: []
      };

    case 'list_subjects':
      const subjects = (window.__cxcPapers || []).map(p => p.subject_name).filter((v, i, a) => a.indexOf(v) === i).sort();
      return {
        text: `We have papers for **${subjects.length} subjects**:\n\n${subjects.map(s => `• ${s}`).join('\n')}\n\nJust ask me to find papers for any of these!`,
        papers: []
      };

    case 'find_papers':
      if (papers.length === 0) {
        return {
          text: subject
            ? `I searched for **${subject}** papers but didn't find an exact match. Try browsing the subjects grid on the main page — click any subject card to see all its papers. 📂`
            : `I didn't find papers matching that. Try being more specific — e.g. "find Biology past papers" or browse the subjects on the main page.`,
          papers: []
        };
      }
      const subjectLabel = subject ? `**${subject.charAt(0).toUpperCase() + subject.slice(1)}**` : 'your search';
      return {
        text: `Here are the best matches for ${subjectLabel} 👇`,
        papers: papers.slice(0, 4)
      };

    default:
      // Topic knowledge
      if (intent.startsWith('topic:')) {
        const key = intent.replace('topic:', '');
        const response = KB[key];
        if (response) {
          return { text: response, papers: papers.slice(0, 2) };
        }
      }

      // Generic search result
      if (papers.length > 0) {
        const topSubject = papers[0].paper.subject_name;
        return {
          text: `I found some papers related to your question — here are the best matches 📄`,
          papers: papers.slice(0, 4)
        };
      }

      return {
        text: `I'm not sure about that one. Try asking me to:\n• **Find papers** — "find CSEC Maths papers"\n• **Explain a topic** — "explain photosynthesis"\n• **Study help** — "how do I pass CSEC?"\n\nOr browse all subjects on the main page! 📚`,
        papers: []
      };
  }
}

// ─── MAIN CLASS ───────────────────────────────────────────
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
    this.Brain      = null;
    this.lastTopic  = null;
    this.lastSubject = null;

    this.QUICK = [
      'Find Maths papers 📐', 'Help with Biology 🧬',
      'Explain photosynthesis', 'How to pass CSEC? 🏆',
      'CSEC English A tips', 'Chemistry past papers'
    ];

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

  async activate() {
    this.loadScreen.style.display = 'none';
    this.chatWrap.style.cssText = 'display:flex;flex:1;overflow:hidden;flex-direction:column;';
    this.btn.classList.add('loading');
    this.btnLabel.textContent = 'Loading…';
    this.setStat('Loading AI model…', 'dl');
    this.setProg(0, true);
    this.addMsg('bot', `Loading up — just a moment! ⏳`);

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
      this.badge.classList.add('on');
      this.setProg(100);
      setTimeout(() => this.setProg(0), 600);
      this.setStat(`${papers.length} papers indexed · ask me anything`, 'ok');

      this.chatEl.innerHTML = '';
      this.addMsg('bot', `Ready! 🎉 I can find past papers, explain CSEC topics, and give study tips.\n\nWhat subject are you studying?`);
      this.renderQuick();
      this.inputEl.focus();

    } catch (err) {
      console.error(err);
      this.setStat('Failed to load. Try refreshing.', 'err');
      this.btn.classList.remove('loading');
      this.addMsg('bot', `Couldn't load the AI model. Please refresh the page and try again. 😔`);
    }
  }

  async send() {
    const text = this.inputEl.value.trim();
    if (!text || this.isThinking || !this.isReady) return;

    this.inputEl.value = '';
    this.inputEl.style.height = 'auto';
    this.addMsg('user', text);
    this.clearQuick();
    this.setThinking(true);

    // Resolve pronoun references from context
    let searchQuery = text;
    if (/\b(it|this|that|the subject|the topic|those|them)\b/i.test(text) && this.lastSubject) {
      searchQuery = text.replace(/\b(it|this|that|the subject|the topic)\b/gi, this.lastSubject);
    }

    const intent = detectIntent(text);
    const subject = extractSubject(text) || this.lastSubject;
    if (subject) this.lastSubject = subject;
    if (intent.startsWith('topic:')) this.lastTopic = intent.replace('topic:', '');

    // Semantic search
    const rawResults = await this.Brain.search(searchQuery, 6);

    // Small delay for natural feel
    await new Promise(r => setTimeout(r, 380));

    const { text: replyText, papers } = generateResponse(intent, text, rawResults, {
      lastTopic: this.lastTopic,
      lastSubject: this.lastSubject
    });

    this.removeTyping();
    this.addMsg('bot', replyText, papers);
    this.setThinking(false);
    this.renderQuick();
  }

  addMsg(role, text, papers = []) {
    const div = document.createElement('div');
    div.className = `aip-msg ${role}`;
    const formatted = text
      .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
      .replace(/\n/g, '<br>');

    const cards = papers.map(r => {
      const p = r.paper || r;
      const isFolder = (p.file_url || '').includes('drive.google.com/drive/folders');
      return `<a href="${p.file_url||'#'}" target="_blank" rel="noopener" class="aip-paper-card">
        <span class="aip-paper-icon">${p.emoji||'📄'}</span>
        <div class="aip-paper-info">
          <div class="aip-paper-title">${esc(p.title)}</div>
          <div class="aip-paper-meta">${p.subject_name||''} · ${p.level||''} · ${isFolder?'Multiple years':p.year||''}</div>
        </div>
        <span class="aip-paper-arrow">→</span>
      </a>`;
    }).join('');

    div.innerHTML = `<div class="aip-av">${role==='bot'?'🧠':'👤'}</div><div class="aip-bub">${formatted}${cards}</div>`;
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
      d.innerHTML = `<div class="aip-av">🧠</div><div class="aip-bub"><div class="aip-typing"><span></span><span></span><span></span></div></div>`;
      this.chatEl.appendChild(d);
      this.scrollBottom();
    }
  }

  removeTyping() { document.getElementById('aiTyping')?.remove(); }

  clearChat() {
    this.chatEl.innerHTML = '';
    this.lastTopic = null; this.lastSubject = null;
    this.addMsg('bot', `Chat cleared! What would you like to study? 📚`);
    this.renderQuick();
  }

  renderQuick() {
    this.quickEl.innerHTML = this.QUICK.map(q => `<button class="aip-qp">${q}</button>`).join('');
    this.quickEl.querySelectorAll('.aip-qp').forEach(btn => {
      btn.addEventListener('click', () => {
        this.inputEl.value = btn.textContent.replace(/[\u{1F300}-\u{1FFFF}]/gu,'').trim();
        this.send();
      });
    });
  }

  clearQuick() { this.quickEl.innerHTML = ''; }
  scrollBottom() { requestAnimationFrame(() => { this.chatEl.scrollTop = this.chatEl.scrollHeight; }); }
  setStat(msg, cls='') { this.statEl.textContent = msg; this.statEl.className = `aip-stat ${cls}`; }
  setProg(pct, spin=false) {
    if (spin) { this.progEl.classList.add('spin'); }
    else { this.progEl.classList.remove('spin'); this.progEl.style.width = pct+'%'; }
  }
}

function esc(s) { return String(s||'').replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;'); }

if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', () => new CXCAssistant());
} else {
  new CXCAssistant();
}
