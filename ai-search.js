/* =========================================================
   CXC PAPERS — ai-search.js v4
   Full local study assistant:
   - Conversational chat with memory
   - PDF upload + question answering (PDF.js)
   - Practice question generator per subject
   - Semantic paper search (Transformers.js)
   - Zero API calls
   ========================================================= */

// ─── PRACTICE QUESTION BANKS ─────────────────────────────
const PRACTICE = {
  'mathematics': [
    { q: 'Solve: 2x² + 5x - 3 = 0', a: 'Using the quadratic formula or factoring: (2x - 1)(x + 3) = 0, so x = ½ or x = -3' },
    { q: 'A car travels 120 km in 1.5 hours. What is its average speed?', a: 'Speed = Distance ÷ Time = 120 ÷ 1.5 = **80 km/h**' },
    { q: 'Find the gradient of the line passing through (2, 3) and (6, 11).', a: 'Gradient = (11-3)/(6-2) = 8/4 = **2**' },
    { q: 'Expand and simplify: (3x + 2)(x - 4)', a: '3x² - 12x + 2x - 8 = **3x² - 10x - 8**' },
    { q: 'A circle has radius 7 cm. Find its area. (Use π = 3.14)', a: 'Area = πr² = 3.14 × 7² = 3.14 × 49 = **153.86 cm²**' },
    { q: 'If f(x) = 3x - 1, find f(4).', a: 'f(4) = 3(4) - 1 = 12 - 1 = **11**' },
    { q: 'Factorise completely: 6x² - 9x', a: '**3x(2x - 3)**' },
    { q: 'The angles of a triangle are in the ratio 2:3:4. Find each angle.', a: 'Total parts = 9. Each part = 180/9 = 20°. Angles: **40°, 60°, 80°**' },
    { q: 'Calculate the simple interest on $5000 at 8% per annum for 3 years.', a: 'SI = PRT/100 = 5000 × 8 × 3 / 100 = **$1200**' },
    { q: 'Express 0.000045 in standard form.', a: '**4.5 × 10⁻⁵**' },
  ],
  'biology': [
    { q: 'What is the function of the mitochondria?', a: 'The mitochondria is the **site of aerobic respiration** — it produces ATP (energy) for the cell. Often called the "powerhouse of the cell."' },
    { q: 'State the word equation for photosynthesis.', a: 'Carbon dioxide + Water → **Glucose + Oxygen** (in the presence of light and chlorophyll)' },
    { q: 'What is the difference between mitosis and meiosis?', a: '**Mitosis** produces 2 identical diploid cells (for growth/repair). **Meiosis** produces 4 genetically unique haploid cells (for sexual reproduction/gametes).' },
    { q: 'Name the four bases found in DNA.', a: '**Adenine (A), Thymine (T), Guanine (G), Cytosine (C)**. A pairs with T, G pairs with C.' },
    { q: 'What is osmosis?', a: 'The movement of water molecules from a region of **high water concentration** to a region of **low water concentration** through a semi-permeable membrane.' },
    { q: 'List THREE functions of the human skeleton.', a: '1. **Support** — gives the body shape\n2. **Protection** — e.g. skull protects brain\n3. **Movement** — with muscles and joints\n(Also: blood cell production, mineral storage)' },
    { q: 'What is the role of insulin in the body?', a: 'Insulin is a hormone produced by the **pancreas** that **lowers blood glucose levels** by stimulating cells to absorb glucose.' },
    { q: 'Describe the process of diffusion.', a: 'The movement of particles from a region of **high concentration** to a region of **low concentration** down a concentration gradient — no energy required (passive process).' },
  ],
  'chemistry': [
    { q: 'What is the difference between an atom and an ion?', a: 'An **atom** is electrically neutral (equal protons and electrons). An **ion** is a charged particle formed when an atom gains or loses electrons.' },
    { q: 'Balance this equation: H₂ + O₂ → H₂O', a: '**2H₂ + O₂ → 2H₂O**' },
    { q: 'What type of bonding exists in sodium chloride (NaCl)?', a: '**Ionic bonding** — electrons are transferred from sodium (Na) to chlorine (Cl), forming Na⁺ and Cl⁻ ions held by electrostatic attraction.' },
    { q: 'State the pH range for acids, neutral, and alkalis.', a: 'Acids: **pH 0–6** | Neutral: **pH 7** | Alkalis: **pH 8–14**' },
    { q: 'What happens at the cathode during electrolysis?', a: '**Reduction** occurs at the cathode — positive ions (cations) gain electrons. e.g. Cu²⁺ + 2e⁻ → Cu' },
    { q: 'Name the products when an acid reacts with a metal carbonate.', a: '**Salt + Water + Carbon dioxide**\ne.g. HCl + CaCO₃ → CaCl₂ + H₂O + CO₂' },
    { q: 'What is the difference between an alkane and an alkene?', a: '**Alkanes** have only single C-C bonds (saturated). **Alkenes** have at least one C=C double bond (unsaturated). Alkenes decolourise bromine water; alkanes do not.' },
  ],
  'physics': [
    { q: 'State Newton\'s Second Law of Motion.', a: 'The acceleration of an object is **directly proportional to the net force** acting on it and **inversely proportional to its mass**. F = ma' },
    { q: 'A resistor has voltage 12V and current 3A. Calculate its resistance.', a: 'Using Ohm\'s Law: R = V/I = 12/3 = **4 Ω**' },
    { q: 'What is the difference between speed and velocity?', a: '**Speed** is a scalar — just magnitude (e.g. 60 km/h). **Velocity** is a vector — magnitude AND direction (e.g. 60 km/h north).' },
    { q: 'Calculate the kinetic energy of a 2 kg object moving at 10 m/s.', a: 'KE = ½mv² = ½ × 2 × 10² = ½ × 2 × 100 = **100 J**' },
    { q: 'What is the relationship between frequency and wavelength?', a: 'Wave speed = frequency × wavelength → **v = fλ**. They are inversely proportional (higher frequency = shorter wavelength) at constant wave speed.' },
    { q: 'State the law of conservation of energy.', a: 'Energy cannot be **created or destroyed** — it can only be **converted from one form to another**. The total energy in a closed system remains constant.' },
    { q: 'A lamp transfers 60 J of energy in 10 seconds. What is its power?', a: 'Power = Energy/Time = 60/10 = **6 W**' },
  ],
  'english a': [
    { q: 'What is the difference between a simile and a metaphor?', a: 'A **simile** compares using "like" or "as" (e.g. "brave as a lion"). A **metaphor** says something IS something else (e.g. "He is a lion in battle").' },
    { q: 'What should a good summary include?', a: 'A good summary should: use your **own words**, include only **main ideas** (not examples), be shorter than the original, maintain the original meaning, and have no personal opinions.' },
    { q: 'What is the purpose of a topic sentence?', a: 'A topic sentence **introduces the main idea** of a paragraph. It tells the reader what the paragraph is about and is usually the first sentence.' },
    { q: 'Name THREE techniques used in persuasive writing.', a: '1. **Rhetorical questions** — engage the reader\n2. **Repetition** — emphasise key points\n3. **Statistics/facts** — build credibility\n(Also: emotive language, rule of three, direct address)' },
    { q: 'What is the difference between formal and informal register?', a: '**Formal register** uses standard English, complete sentences, no slang — used in essays, reports, letters to officials. **Informal register** uses colloquial language, contractions, slang — used with friends, casual writing.' },
  ],
  'principles of accounts': [
    { q: 'State the accounting equation.', a: '**Assets = Liabilities + Capital** (also written as Capital = Assets - Liabilities)' },
    { q: 'What is the difference between a debtor and a creditor?', a: 'A **debtor** owes money TO the business. A **creditor** is owed money BY the business.' },
    { q: 'On which side of a T-account do assets increase?', a: 'Assets increase on the **DEBIT (left) side** and decrease on the credit side.' },
    { q: 'What is depreciation?', a: 'The reduction in the value of a fixed asset over time due to **wear and tear, obsolescence, or passage of time**.' },
    { q: 'What is the difference between capital expenditure and revenue expenditure?', a: '**Capital expenditure** — spending on fixed assets (long-term benefit, e.g. buying machinery). **Revenue expenditure** — day-to-day running costs (e.g. rent, wages, electricity).' },
  ],
  'caribbean history': [
    { q: 'When did Jamaica gain independence, and from whom?', a: 'Jamaica gained independence from **Britain** on **August 6, 1962**.' },
    { q: 'What was the West Indies Federation and why did it fail?', a: 'The West Indies Federation (1958-1962) was an attempt to unite British Caribbean territories as one nation. It failed mainly because **Jamaica voted to leave** in a 1961 referendum, followed by Trinidad & Tobago.' },
    { q: 'What was the Middle Passage?', a: 'The **Middle Passage** was the sea journey of enslaved Africans across the Atlantic Ocean to the Americas — the middle leg of the triangular trade. Conditions were brutal with high mortality rates.' },
    { q: 'Name TWO forms of resistance by enslaved people in the Caribbean.', a: '1. **Marronage** — escaping slavery and forming free communities (e.g. Jamaican Maroons)\n2. **Revolts/Rebellions** — e.g. Sam Sharpe Rebellion (Jamaica, 1831), Bussa\'s Rebellion (Barbados, 1816)' },
    { q: 'Who was Marcus Garvey and what was his significance?', a: '**Marcus Mosiah Garvey** (1887-1940) was a Jamaican political activist who founded the **Universal Negro Improvement Association (UNIA)** and championed Black nationalism and the "Back to Africa" movement.' },
  ],
};

// ─── INTENT DETECTION ─────────────────────────────────────
const KB = {
  photosynthesis: `**Photosynthesis** converts light energy into chemical energy 🌱\n\n**Equation:** 6CO₂ + 6H₂O + light energy → C₆H₁₂O₆ + 6O₂\n\nTwo stages:\n• **Light-dependent reactions** (thylakoid membrane) — light splits water, produces ATP\n• **Calvin cycle / Light-independent** (stroma) — CO₂ fixed into glucose\n\nFactors affecting rate: light intensity, CO₂ concentration, temperature, water availability.`,
  mitosis: `**Mitosis** = cell division → 2 identical daughter cells 🔬\n\nStages (**PMAT**):\n• **Prophase** — chromosomes condense\n• **Metaphase** — chromosomes line up at centre\n• **Anaphase** — chromatids pulled to poles\n• **Telophase** — two nuclei form\n\nResult: 2 diploid cells. Used for growth, repair, asexual reproduction.`,
  meiosis: `**Meiosis** = cell division → 4 unique haploid cells 🧬\n\n• Two rounds of division (Meiosis I and II)\n• **Crossing over** in Prophase I creates genetic variation\n• Result: gametes (sperm/eggs) with half the chromosome number\n• Key difference from mitosis: produces genetically DIFFERENT cells`,
  quadratic: `**Quadratic equations** → ax² + bx + c = 0 📐\n\n**Three methods:**\n1. **Factoring** — fastest when possible\n2. **Quadratic formula:** x = (-b ± √(b²-4ac)) / 2a\n3. **Completing the square**\n\nTip: Check discriminant (b²-4ac). If negative → no real roots. If zero → one root. If positive → two roots.`,
  pythagoras: `**Pythagoras Theorem:** a² + b² = c² 📐\n\nc = hypotenuse (longest side, opposite right angle)\n\nUses:\n• Find missing sides in right triangles\n• Check if a triangle is right-angled\n• Distance between two coordinate points: d = √[(x₂-x₁)² + (y₂-y₁)²]`,
  slavery: `**Slavery in the Caribbean** 🏛️\n\n**Key facts:**\n• Transatlantic Slave Trade: 16th–19th century\n• Middle Passage: brutal Atlantic crossing\n• Plantation economy: sugar, tobacco, cotton\n• Abolition of slave trade: **1807** (Britain)\n• Emancipation: **1834**, apprenticeship ended **1838**\n\n**Resistance:** Maroons, Sam Sharpe Rebellion (Jamaica 1831), Bussa's Rebellion (Barbados 1816)\n\n**Causes of abolition:** Economic (capitalism), moral (Wilberforce/abolitionists), enslaved resistance`,
  independence: `**Caribbean Independence** 🇯🇲\n\n• **Jamaica:** August 6, **1962**\n• **Trinidad & Tobago:** August 31, 1962\n• **Barbados:** November 30, 1966\n• **Guyana:** May 26, 1966\n• **West Indies Federation:** 1958–1962 (failed)\n\n**Key figures:** Norman Manley, Alexander Bustamante (JA), Eric Williams (T&T)`,
  englisha: `**CSEC English A breakdown** ✍️\n\n**Paper 1** (MCQ): Comprehension, grammar, vocabulary\n**Paper 2:**\n• Section A — Summary writing (40 marks) — use YOUR OWN WORDS\n• Section B — Essay writing (30 marks) — plan before writing\n• Section C — Creative/persuasive writing\n\n**Top tips:** Vary sentence structure, proofread for punctuation, plan essays for 2 mins before writing.`,
  accounts: `**CSEC Principles of Accounts** 📊\n\n**Core concepts:**\n• Accounting equation: **Assets = Liabilities + Capital**\n• Double entry: every transaction hits 2 accounts\n• Trial Balance → Income Statement → Balance Sheet\n• Depreciation: Straight-line method most common\n\n**Common mistakes:** Forgetting to balance T-accounts, mixing debit/credit sides.`,
  chemistry_basics: `**CSEC Chemistry key topics** 🧪\n\n• Atomic structure: protons, neutrons, electrons\n• Bonding: ionic, covalent, metallic\n• Acids & Bases: pH scale, neutralisation\n• Electrolysis: cathode (reduction), anode (oxidation)\n• Organic: alkanes, alkenes, alcohols\n• Rates: temperature, concentration, surface area, catalyst\n\n**Always balance equations** — heavily marked!`,
  physics_basics: `**CSEC Physics key topics** ⚛️\n\n• **Mechanics:** F=ma, momentum, energy\n• **Waves:** v=fλ, transverse vs longitudinal\n• **Electricity:** V=IR, P=IV, series/parallel\n• **Thermal:** conduction, convection, radiation\n• **Light:** reflection, refraction, lenses\n\n**Key formulas:** v=fλ, V=IR, P=IV, KE=½mv², GPE=mgh`,
  passcsec: `**How to pass CSEC** 🏆\n\n1. **Past papers are everything** — do 5+ years per subject\n2. **Know the mark scheme** — understand what examiners want\n3. **Time management** — don't spend too long on one question\n4. **Show ALL working** in Maths — partial marks available\n5. **Learn definitions word-for-word** in Science\n6. **Plan essays** before writing (2-minute outline)\n7. **Practise under timed conditions** — simulate the real exam`,
  studytips: `**CSEC Study Tips** 📝\n\n• **Spaced repetition** — review material at increasing intervals\n• **Active recall** — close notes and write what you remember\n• **Pomodoro** — 25 min study, 5 min break\n• **Past papers > textbooks** in final months\n• **Teach others** — fastest way to truly understand\n• **Sleep** — brain consolidates memory overnight\n• **Exercise** — even 20 min walk improves focus`,
};

function detectIntent(text) {
  const t = text.toLowerCase();
  if (/^(hi|hello|hey|yo|wah gwaan|good morning|good afternoon|good evening)/.test(t)) return 'greeting';
  if (/\b(practice|quiz|test me|question|drill|exercise)\b/.test(t)) return 'practice';
  if (/\b(explain|what is|what are|how does|describe|define|tell me about)\b/.test(t) && /\b(paper|question|this|it)\b/.test(t) && window.__pdfText) return 'explain_paper';
  if (/\b(find|get|show|need|want|looking for|give me|download|where)\b.*\b(paper|past paper|exam)\b/.test(t) || /\bpast papers?\b/.test(t)) return 'find_papers';
  if (/photosynthes/.test(t)) return 'topic:photosynthesis';
  if (/\bmitosis\b/.test(t)) return 'topic:mitosis';
  if (/\bmeiosis\b/.test(t)) return 'topic:meiosis';
  if (/quadratic/.test(t)) return 'topic:quadratic';
  if (/pythagoras/.test(t)) return 'topic:pythagoras';
  if (/slavery|enslav|abolit|plantation|middle passage/.test(t)) return 'topic:slavery';
  if (/independen|federation|bustamante|manley/.test(t)) return 'topic:independence';
  if (/english\s*a.*\b(topic|help|paper|tip|exam)\b/.test(t)) return 'topic:englisha';
  if (/\b(poa|principles of accounts)\b/.test(t)) return 'topic:accounts';
  if (/chemistry.*\b(topic|help|tip|explain|key)\b/.test(t)) return 'topic:chemistry_basics';
  if (/physics.*\b(topic|help|tip|explain|key)\b/.test(t)) return 'topic:physics_basics';
  if (/how.*(pass|ace|do well)|study tips?/.test(t)) return 'topic:passcsec';
  if (/what subjects?|what.*available/.test(t)) return 'list_subjects';
  if (/\b(thanks?|thank you|thx)\b/.test(t)) return 'thanks';
  if (window.__pdfText && /\b(what|how|explain|describe|who|when|where|why|which|calculate|find|state|define|list)\b/.test(t)) return 'ask_paper';
  return 'search';
}

function extractSubject(text) {
  const t = text.toLowerCase();
  const map = {
    'mathematics': ['math','maths','mathematics'],
    'english a': ['english a','english'],
    'biology': ['biology','bio'],
    'chemistry': ['chemistry','chem'],
    'physics': ['physics'],
    'principles of accounts': ['accounts','poa','principles of accounts'],
    'caribbean history': ['history','caribbean history'],
    'geography': ['geography'],
    'information technology': ['it','information technology'],
    'spanish': ['spanish'],
    'social studies': ['social studies'],
    'human & social biology': ['hsb','human and social biology'],
    'principles of business': ['pob','principles of business','business'],
    'integrated science': ['integrated science'],
    'additional mathematics': ['add math','additional math'],
  };
  for (const [subject, kws] of Object.entries(map)) {
    if (kws.some(k => t.includes(k))) return subject;
  }
  return null;
}

// ─── PDF TEXT EXTRACTION ──────────────────────────────────
async function extractPDFText(file) {
  const pdfjsLib = await import('https://cdn.jsdelivr.net/npm/pdfjs-dist@3.11.174/build/pdf.min.mjs');
  pdfjsLib.GlobalWorkerOptions.workerSrc = 'https://cdn.jsdelivr.net/npm/pdfjs-dist@3.11.174/build/pdf.worker.min.mjs';
  const arrayBuffer = await file.arrayBuffer();
  const pdf = await pdfjsLib.getDocument({ data: arrayBuffer }).promise;
  let text = '';
  const maxPages = Math.min(pdf.numPages, 12); // limit to 12 pages
  for (let i = 1; i <= maxPages; i++) {
    const page = await pdf.getPage(i);
    const content = await page.getTextContent();
    text += content.items.map(item => item.str).join(' ') + '\n';
  }
  return text.trim();
}

// Answer a question using extracted PDF text
function answerFromPDF(question, pdfText) {
  const q = question.toLowerCase();
  // Find most relevant chunk (simple sliding window)
  const sentences = pdfText.split(/[.!?\n]+/).filter(s => s.trim().length > 20);
  const words = q.split(/\s+/).filter(w => w.length > 3);
  
  // Score each sentence by keyword overlap
  const scored = sentences.map(s => ({
    text: s.trim(),
    score: words.filter(w => s.toLowerCase().includes(w)).length
  })).filter(s => s.score > 0).sort((a, b) => b.score - a.score);

  if (scored.length === 0) {
    return `I couldn't find a direct answer to that in the uploaded paper. Try rephrasing your question or asking about a specific topic mentioned in the paper.`;
  }

  const topChunks = scored.slice(0, 3).map(s => s.text).join(' ... ');
  return `Based on the uploaded paper:\n\n"${topChunks.slice(0, 400)}${topChunks.length > 400 ? '…' : ''}"\n\n*This is extracted directly from the paper. Ask me to explain any part in more detail!*`;
}

// ─── STYLES ───────────────────────────────────────────────
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
  #cxcAIBtn:hover { transform:translateY(-2px); }
  #cxcAIBtn.pulsing { animation:aiBtnPulse 2s infinite; }
  #cxcAIBtn .dot { width:8px;height:8px;background:#ffd700;border-radius:50%;flex-shrink:0; }
  #cxcAIBtn.loading .dot { animation:dotSpin .8s linear infinite;background:rgba(255,215,0,.5); }
  #cxcAIBtn.ready   .dot { background:#00ff7f;box-shadow:0 0 6px #00ff7f; }

  #cxcAIPanel {
    position:fixed; bottom:90px; right:24px; z-index:299;
    width:min(420px,calc(100vw - 32px));
    background:#0d0d0d; border-radius:20px;
    border:1px solid rgba(255,215,0,.18);
    box-shadow:0 24px 64px rgba(0,0,0,.7);
    display:flex; flex-direction:column; overflow:hidden;
    transform:translateY(16px) scale(.97); opacity:0; pointer-events:none;
    transition:all .25s cubic-bezier(.4,0,.2,1);
    height:min(580px,75vh);
  }
  #cxcAIPanel.open { transform:translateY(0) scale(1);opacity:1;pointer-events:all; }

  .aip-header { padding:13px 15px 11px;border-bottom:1px solid rgba(255,255,255,.07);display:flex;align-items:center;justify-content:space-between;flex-shrink:0; }
  .aip-title  { display:flex;align-items:center;gap:8px; }
  .aip-name   { font-family:'Syne',sans-serif;font-size:.9rem;font-weight:800;color:#fff; }
  .aip-badge  { font-size:.58rem;font-weight:700;letter-spacing:1.5px;text-transform:uppercase;padding:2px 7px;border-radius:10px;border:1px solid;color:#ffd700;background:rgba(255,215,0,.1);border-color:rgba(255,215,0,.2); }
  .aip-badge.on { color:#00ff7f;background:rgba(0,255,127,.1);border-color:rgba(0,255,127,.2); }
  .aip-actions { display:flex;gap:5px; }
  .aip-icon-btn { width:28px;height:28px;border-radius:50%;background:rgba(255,255,255,.07);color:rgba(255,255,255,.4);display:flex;align-items:center;justify-content:center;font-size:.8rem;cursor:pointer;transition:all .15s;border:none;font-family:inherit; }
  .aip-icon-btn:hover { background:rgba(255,255,255,.13);color:#fff; }

  .aip-prog { height:2px;background:rgba(255,255,255,.05);flex-shrink:0;overflow:hidden; }
  .aip-prog-fill { height:100%;background:linear-gradient(90deg,#ffd700,#00ff7f);width:0%;transition:width .3s; }
  .aip-prog-fill.spin { width:40%;animation:progSpin 1.2s ease-in-out infinite; }

  .aip-stat { padding:4px 14px;font-size:.67rem;color:rgba(255,255,255,.3);font-family:'DM Sans',sans-serif;flex-shrink:0; }
  .aip-stat.dl  { color:#ffd700; }
  .aip-stat.ok  { color:rgba(0,255,127,.6); }
  .aip-stat.err { color:#ff6b6b; }

  /* PDF bar */
  .aip-pdf-bar {
    display:flex;align-items:center;gap:8px;padding:7px 14px;
    background:rgba(255,215,0,.08);border-bottom:1px solid rgba(255,215,0,.15);
    flex-shrink:0;
  }
  .aip-pdf-name { font-size:.72rem;color:#ffd700;font-family:'DM Sans',sans-serif;flex:1;white-space:nowrap;overflow:hidden;text-overflow:ellipsis; }
  .aip-pdf-clear { font-size:.7rem;color:rgba(255,255,255,.4);cursor:pointer;flex-shrink:0;background:none;border:none;font-family:inherit; }
  .aip-pdf-clear:hover { color:#ff6b6b; }

  .aip-load { flex:1;display:flex;flex-direction:column;align-items:center;justify-content:center;padding:28px 22px;text-align:center;gap:10px; }
  .aip-load .li { font-size:2.4rem; }
  .aip-load h3 { font-family:'Syne',sans-serif;font-size:1rem;font-weight:800;color:#fff; }
  .aip-load p  { font-size:.78rem;color:rgba(255,255,255,.38);line-height:1.6;max-width:270px; }
  .aip-load p strong { color:#ffd700; }
  .aip-load-btn { padding:11px 28px;background:linear-gradient(135deg,#004d1a,#008c2e);color:#ffd700;border:none;border-radius:12px;font-family:'Syne',sans-serif;font-size:.88rem;font-weight:700;cursor:pointer;transition:all .15s;margin-top:4px; }
  .aip-load-btn:hover { filter:brightness(1.1);transform:translateY(-1px); }
  .aip-size { font-size:.64rem;color:rgba(255,255,255,.18); }

  .aip-chat { flex:1;overflow-y:auto;padding:12px 13px;display:flex;flex-direction:column;gap:10px;scrollbar-width:thin;scrollbar-color:rgba(255,255,255,.07) transparent; }
  .aip-msg  { display:flex;gap:8px;animation:msgIn .2s ease both; }
  .aip-msg.user { flex-direction:row-reverse; }
  .aip-av   { width:26px;height:26px;border-radius:50%;flex-shrink:0;display:flex;align-items:center;justify-content:center;font-size:.72rem;margin-top:2px; }
  .aip-msg.bot  .aip-av { background:linear-gradient(135deg,#004d1a,#008c2e);color:#ffd700; }
  .aip-msg.user .aip-av { background:rgba(255,215,0,.12);color:#ffd700;border:1px solid rgba(255,215,0,.2); }
  .aip-bub { max-width:86%;padding:9px 13px;font-size:.82rem;line-height:1.58;font-family:'DM Sans',sans-serif; }
  .aip-msg.bot  .aip-bub { background:rgba(255,255,255,.06);color:rgba(255,255,255,.88);border-radius:4px 14px 14px 14px; }
  .aip-msg.user .aip-bub { background:rgba(255,215,0,.11);color:#ffd700;border:1px solid rgba(255,215,0,.14);border-radius:14px 4px 14px 14px; }
  .aip-bub strong { color:#fff;font-weight:600; }
  .aip-bub em { color:rgba(255,255,255,.5);font-style:italic;font-size:.75rem; }

  /* Practice card */
  .aip-practice-card { background:rgba(255,255,255,.05);border:1px solid rgba(255,255,255,.1);border-radius:12px;padding:12px 14px;margin-top:6px; }
  .aip-practice-q { font-size:.83rem;color:#fff;font-weight:600;margin-bottom:8px;font-family:'Syne',sans-serif; }
  .aip-practice-reveal { padding:6px 14px;background:rgba(255,215,0,.15);border:1px solid rgba(255,215,0,.25);border-radius:20px;color:#ffd700;font-size:.72rem;font-weight:700;cursor:pointer;transition:all .15s;font-family:'Syne',sans-serif;border-style:solid; }
  .aip-practice-reveal:hover { background:rgba(255,215,0,.25); }
  .aip-practice-a { display:none;margin-top:8px;padding-top:8px;border-top:1px solid rgba(255,255,255,.08);font-size:.79rem;color:rgba(255,255,255,.78);line-height:1.55; }
  .aip-practice-a.show { display:block; }

  .aip-paper-card { display:flex;align-items:center;gap:8px;margin-top:6px;background:rgba(255,255,255,.05);border:1px solid rgba(255,255,255,.1);border-radius:10px;padding:8px 10px;text-decoration:none;transition:all .15s; }
  .aip-paper-card:hover { background:rgba(255,215,0,.08);border-color:rgba(255,215,0,.25); }
  .aip-paper-icon { font-size:1.1rem;flex-shrink:0; }
  .aip-paper-info { flex:1;min-width:0; }
  .aip-paper-title { font-size:.77rem;font-weight:600;color:#fff;font-family:'Syne',sans-serif;white-space:nowrap;overflow:hidden;text-overflow:ellipsis; }
  .aip-paper-meta  { font-size:.67rem;color:rgba(255,255,255,.38);margin-top:1px; }
  .aip-paper-arrow { color:rgba(255,215,0,.45);font-size:.8rem;flex-shrink:0; }

  .aip-typing { display:flex;gap:4px;align-items:center;padding:6px 2px; }
  .aip-typing span { width:6px;height:6px;background:rgba(255,255,255,.28);border-radius:50%;animation:typeDot 1.2s ease-in-out infinite; }
  .aip-typing span:nth-child(2) { animation-delay:.2s; }
  .aip-typing span:nth-child(3) { animation-delay:.4s; }

  .aip-quick { display:flex;gap:5px;flex-wrap:wrap;padding:0 12px 8px;flex-shrink:0; }
  .aip-qp { padding:4px 10px;background:rgba(255,255,255,.05);border:1px solid rgba(255,255,255,.09);border-radius:20px;color:rgba(255,255,255,.45);font-size:.69rem;cursor:pointer;transition:all .15s;font-family:'DM Sans',sans-serif;white-space:nowrap; }
  .aip-qp:hover { background:rgba(255,215,0,.1);border-color:rgba(255,215,0,.25);color:#ffd700; }

  .aip-input-wrap { padding:9px 12px 12px;border-top:1px solid rgba(255,255,255,.07);flex-shrink:0; }
  .aip-input-row { display:flex;align-items:flex-end;gap:6px;background:rgba(255,255,255,.06);border:1.5px solid rgba(255,255,255,.1);border-radius:14px;padding:6px 6px 6px 12px;transition:border-color .15s; }
  .aip-input-row:focus-within { border-color:rgba(255,215,0,.32); }
  .aip-input-row textarea { flex:1;background:none;border:none;outline:none;color:#fff;font-family:'DM Sans',sans-serif;font-size:.84rem;resize:none;min-height:20px;max-height:90px;line-height:1.4;padding:4px 0; }
  .aip-input-row textarea::placeholder { color:rgba(255,255,255,.25); }
  .aip-upload-btn { width:30px;height:30px;border-radius:8px;background:rgba(255,255,255,.08);color:rgba(255,255,255,.5);border:none;cursor:pointer;display:flex;align-items:center;justify-content:center;font-size:.9rem;flex-shrink:0;transition:all .15s; }
  .aip-upload-btn:hover { background:rgba(255,215,0,.15);color:#ffd700; }
  .aip-send { width:30px;height:30px;border-radius:8px;background:#ffd700;color:#004d1a;border:none;cursor:pointer;display:flex;align-items:center;justify-content:center;font-size:.85rem;flex-shrink:0;transition:all .15s; }
  .aip-send:hover:not(:disabled) { background:#ffe033;transform:scale(1.06); }
  .aip-send:disabled { opacity:.35;cursor:not-allowed; }
  #aipFileInput { display:none; }

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
    <input type="file" id="aipFileInput" accept=".pdf">
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
      <div id="aiPdfBar" style="display:none" class="aip-pdf-bar">
        <span>📄</span>
        <span class="aip-pdf-name" id="aiPdfName"></span>
        <button class="aip-pdf-clear" id="aiPdfClear">✕ Remove</button>
      </div>
      <div class="aip-load" id="aiLoadScreen">
        <div class="li">📚</div>
        <h3>CXC Study Assistant</h3>
        <p>Chat about topics, get practice questions, upload a <strong>past paper PDF</strong> to ask questions about it, and find papers — all running locally.</p>
        <button class="aip-load-btn" id="aiLoadBtn">⬇ Activate Assistant</button>
        <p class="aip-size">~23MB · downloads once · cached forever</p>
      </div>
      <div id="aiChatWrap" style="display:none;flex:1;overflow:hidden;flex-direction:column;">
        <div class="aip-chat" id="aiChat"></div>
        <div class="aip-quick" id="aiQuick"></div>
        <div class="aip-input-wrap">
          <div class="aip-input-row">
            <textarea id="aiInput" placeholder="Ask anything, or upload a PDF 📄" rows="1"></textarea>
            <button class="aip-upload-btn" id="aiUploadBtn" title="Upload a past paper PDF">📎</button>
            <button class="aip-send" id="aiSend">➤</button>
          </div>
        </div>
      </div>
    </div>
  `);
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
    this.pdfBar     = document.getElementById('aiPdfBar');
    this.pdfName    = document.getElementById('aiPdfName');
    this.fileInput  = document.getElementById('aipFileInput');
    this.isOpen = false; this.isReady = false; this.isThinking = false;
    this.Brain = null; this.lastSubject = null; this.practiceIdx = {};

    this.QUICK = ['Find Maths papers 📐','Practice Biology questions 🧬','Explain photosynthesis','How to pass CSEC? 🏆','Upload a paper PDF 📎','Chemistry practice quiz'];

    this.btn.addEventListener('click', () => this.toggle());
    document.getElementById('aiCloseBtn').addEventListener('click', () => this.close());
    document.getElementById('aiClearBtn').addEventListener('click', () => this.clearChat());
    document.getElementById('aiLoadBtn').addEventListener('click', () => this.activate());
    document.getElementById('aiUploadBtn').addEventListener('click', () => this.fileInput.click());
    document.getElementById('aiPdfClear').addEventListener('click', () => this.clearPDF());
    this.fileInput.addEventListener('change', (e) => this.handleFileUpload(e));
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
  open()  { this.isOpen=true; this.panel.classList.add('open'); this.btn.classList.remove('pulsing'); if(this.isReady) setTimeout(()=>this.inputEl.focus(),260); }
  close() { this.isOpen=false; this.panel.classList.remove('open'); }

  async activate() {
    this.loadScreen.style.display = 'none';
    this.chatWrap.style.cssText = 'display:flex;flex:1;overflow:hidden;flex-direction:column;';
    this.btn.classList.add('loading');
    this.btnLabel.textContent = 'Loading…';
    this.setStat('Loading AI model…','dl');
    this.setProg(0,true);
    this.addMsg('bot','Loading up — just a moment! ⏳');
    try {
      const { Brain } = await import('./brain.js');
      this.Brain = Brain;
      await Brain.load(({ status, pct }) => {
        if (status==='downloading') { this.setStat(`Downloading model… ${pct}%`,'dl'); this.setProg(pct*.8); }
      });
      const papers = window.__cxcPapers || [];
      this.setStat(`Indexing ${papers.length} papers…`,'dl');
      await Brain.index(papers, ({ indexed, total }) => { this.setProg(80+Math.round((indexed/total)*20)); });
      this.isReady=true;
      this.btn.classList.remove('loading'); this.btn.classList.add('ready');
      this.btnLabel.textContent='Study Assistant';
      this.badge.textContent='✓ READY'; this.badge.classList.add('on');
      this.setProg(100); setTimeout(()=>this.setProg(0),600);
      this.setStat(`${papers.length} papers indexed · ask me anything`,'ok');
      this.chatEl.innerHTML='';
      this.addMsg('bot',`Ready! 🎉 I can:\n\n• Find **past papers** for any subject\n• Give you **practice questions** with answers\n• **Answer questions** about an uploaded paper PDF 📎\n• Explain any **CSEC topic**\n\nWhat are you studying?`);
      this.renderQuick();
      this.inputEl.focus();
    } catch(err) {
      console.error(err);
      this.setStat('Failed to load. Try refreshing.','err');
      this.btn.classList.remove('loading');
      this.addMsg('bot','Couldn\'t load the AI model. Please refresh the page. 😔');
    }
  }

  // ── PDF Upload ─────────────────────────────────────────
  async handleFileUpload(e) {
    const file = e.target.files[0];
    if (!file || !file.name.endsWith('.pdf')) return;
    this.fileInput.value = '';
    this.addMsg('user', `📎 Uploaded: ${file.name}`);
    this.setThinking(true);
    try {
      this.addMsg('bot', `Reading **${file.name}**... ⏳`);
      const text = await extractPDFText(file);
      window.__pdfText = text;
      window.__pdfName = file.name;
      this.pdfName.textContent = file.name;
      this.pdfBar.style.display = 'flex';
      this.removeTyping();
      this.addMsg('bot', `✅ Paper loaded! I've read **${file.name}** (${Math.round(text.length/1000)}k characters).\n\nYou can now ask me questions about this paper — for example:\n• *"What topics are covered?"*\n• *"Explain question 3"*\n• *"What is asked about triangles?"*`);
    } catch(err) {
      console.error(err);
      this.removeTyping();
      this.addMsg('bot','Sorry, I couldn\'t read that PDF. Make sure it\'s a text-based PDF (not a scanned image). 😔');
    }
    this.setThinking(false);
    this.renderQuick();
  }

  clearPDF() {
    window.__pdfText = null; window.__pdfName = null;
    this.pdfBar.style.display = 'none';
    this.addMsg('bot','Paper removed. I\'m back to general mode. 📚');
  }

  // ── Send ───────────────────────────────────────────────
  async send() {
    const text = this.inputEl.value.trim();
    if (!text || this.isThinking || !this.isReady) return;
    this.inputEl.value=''; this.inputEl.style.height='auto';
    this.addMsg('user', text);
    this.clearQuick();
    this.setThinking(true);

    // Resolve subject context
    const subject = extractSubject(text) || this.lastSubject;
    if (extractSubject(text)) this.lastSubject = extractSubject(text);

    const intent = detectIntent(text);

    // Small delay for natural feel
    await new Promise(r => setTimeout(r, 300));

    let replyText = '';
    let papers = [];
    let practiceData = null;

    switch(intent) {
      case 'greeting':
        replyText = `Hey! 👋 I'm your CXC Study Assistant.\n\nI can find **past papers**, generate **practice questions**, explain **topics**, and even answer questions about an uploaded **paper PDF**.\n\nWhat subject are you studying?`;
        break;

      case 'thanks':
        replyText = `You're welcome! 😊 Good luck with your studies — you've got this! 💪`;
        break;

      case 'list_subjects':
        const subs = [...new Set((window.__cxcPapers||[]).map(p=>p.subject_name))].sort();
        replyText = `We have **${subs.length} subjects**:\n\n${subs.map(s=>`• ${s}`).join('\n')}\n\nAsk me to find papers or generate practice questions for any of these!`;
        break;

      case 'practice': {
        const subKey = subject?.toLowerCase() || 'mathematics';
        const bank = PRACTICE[subKey] || PRACTICE['mathematics'];
        const idx = (this.practiceIdx[subKey] || 0) % bank.length;
        this.practiceIdx[subKey] = idx + 1;
        practiceData = bank[idx];
        replyText = subject
          ? `Here's a **${subject}** practice question for you:`
          : `Here's a practice question for you:`;
        break;
      }

      case 'ask_paper':
      case 'explain_paper':
        if (window.__pdfText) {
          replyText = answerFromPDF(text, window.__pdfText);
        } else {
          replyText = `No paper is uploaded yet. Click the **📎** button to upload a past paper PDF, then ask questions about it!`;
        }
        break;

      case 'find_papers': {
        const results = await this.Brain.search(text, 5);
        papers = results;
        replyText = papers.length
          ? `Here are the best matches${subject ? ` for **${subject}**` : ''} 👇`
          : `I didn't find an exact match. Try browsing the subjects grid on the main page, or be more specific (e.g. "find Biology past papers").`;
        break;
      }

      default:
        if (intent.startsWith('topic:')) {
          const key = intent.replace('topic:','');
          replyText = KB[key] || `I don't have detailed notes on that topic yet. Try asking me to find past papers on it or generate practice questions!`;
          if (this.Brain) {
            const results = await this.Brain.search(text, 2);
            papers = results;
          }
        } else {
          // Semantic search fallback
          if (this.Brain) {
            const results = await this.Brain.search(text, 5);
            papers = results;
          }
          replyText = papers.length
            ? `Here's what I found related to your question:`
            : `I can help with:\n• **Finding papers** — "find CSEC Chemistry papers"\n• **Practice questions** — "quiz me on Biology"\n• **Topic explanations** — "explain photosynthesis"\n• **Paper Q&A** — upload a PDF then ask questions\n\nWhat would you like?`;
        }
    }

    this.removeTyping();
    this.addMsg('bot', replyText, papers, practiceData);
    this.setThinking(false);
    this.renderQuick();
  }

  // ── Render message ─────────────────────────────────────
  addMsg(role, text, papers=[], practice=null) {
    const div = document.createElement('div');
    div.className = `aip-msg ${role}`;
    const formatted = text
      .replace(/\*\*(.*?)\*\*/g,'<strong>$1</strong>')
      .replace(/\*(.*?)\*/g,'<em>$1</em>')
      .replace(/\n/g,'<br>');

    const cards = (papers||[]).map(r => {
      const p = r.paper||r;
      const isFolder = (p.file_url||'').includes('drive.google.com/drive/folders');
      return `<a href="${p.file_url||'#'}" target="_blank" rel="noopener" class="aip-paper-card">
        <span class="aip-paper-icon">${p.emoji||'📄'}</span>
        <div class="aip-paper-info">
          <div class="aip-paper-title">${esc(p.title)}</div>
          <div class="aip-paper-meta">${p.subject_name||''} · ${p.level||''} · ${isFolder?'Multiple years':p.year||''}</div>
        </div>
        <span class="aip-paper-arrow">→</span>
      </a>`;
    }).join('');

    const practiceCard = practice ? `
      <div class="aip-practice-card">
        <div class="aip-practice-q">${esc(practice.q)}</div>
        <button class="aip-practice-reveal" onclick="this.nextElementSibling.classList.add('show');this.style.display='none'">Show Answer ▾</button>
        <div class="aip-practice-a">${practice.a.replace(/\*\*(.*?)\*\*/g,'<strong>$1</strong>').replace(/\n/g,'<br>')}</div>
      </div>` : '';

    div.innerHTML = `<div class="aip-av">${role==='bot'?'🧠':'👤'}</div><div class="aip-bub">${formatted}${cards}${practiceCard}</div>`;
    this.chatEl.appendChild(div);
    this.scrollBottom();
  }

  setThinking(on) {
    this.isThinking=on; this.sendBtn.disabled=on; this.inputEl.disabled=on;
    if(on) {
      const d=document.createElement('div');
      d.className='aip-msg bot'; d.id='aiTyping';
      d.innerHTML=`<div class="aip-av">🧠</div><div class="aip-bub"><div class="aip-typing"><span></span><span></span><span></span></div></div>`;
      this.chatEl.appendChild(d); this.scrollBottom();
    }
  }
  removeTyping() { document.getElementById('aiTyping')?.remove(); }

  clearChat() {
    this.chatEl.innerHTML=''; this.lastSubject=null;
    this.addMsg('bot','Chat cleared! What would you like to study? 📚');
    this.renderQuick();
  }

  renderQuick() {
    this.quickEl.innerHTML = this.QUICK.map(q=>`<button class="aip-qp">${q}</button>`).join('');
    this.quickEl.querySelectorAll('.aip-qp').forEach(btn => {
      btn.addEventListener('click', () => {
        if (btn.textContent.includes('📎')) { this.fileInput.click(); return; }
        this.inputEl.value = btn.textContent.replace(/[\u{1F300}-\u{1FFFF}\u{2600}-\u{26FF}\u{2700}-\u{27BF}📎📐🧬🏆]/gu,'').trim();
        this.send();
      });
    });
  }

  clearQuick() { this.quickEl.innerHTML=''; }
  scrollBottom() { requestAnimationFrame(()=>{ this.chatEl.scrollTop=this.chatEl.scrollHeight; }); }
  setStat(msg,cls='') { this.statEl.textContent=msg; this.statEl.className=`aip-stat ${cls}`; }
  setProg(pct,spin=false) {
    if(spin){this.progEl.classList.add('spin');}
    else{this.progEl.classList.remove('spin');this.progEl.style.width=pct+'%';}
  }
}

function esc(s){return String(s||'').replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;');}

if(document.readyState==='loading'){
  document.addEventListener('DOMContentLoaded',()=>new CXCAssistant());
} else { new CXCAssistant(); }
