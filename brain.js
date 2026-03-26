/* =========================================================
   CXC PAPERS — brain.js
   Local Neural Search Engine using Transformers.js
   Model: Xenova/all-MiniLM-L6-v2 (~23MB, cached in browser)
   No API. No server. 100% client-side.
   ========================================================= */

import { pipeline, env } from 'https://cdn.jsdelivr.net/npm/@xenova/transformers@2.17.2/dist/transformers.min.js';

// Use CDN for model weights — cached by browser after first load
env.allowLocalModels = false;
env.useBrowserCache  = true;

// ─── STATE ───────────────────────────────────────────────
let embedder       = null;
let paperEmbeds    = [];   // { id, embedding, paper }
let isReady        = false;
let isLoading      = false;

// ─── PUBLIC API ──────────────────────────────────────────
export const Brain = {

  // Load the model (call on button click)
  async load(onProgress) {
    if (isReady || isLoading) return;
    isLoading = true;

    try {
      embedder = await pipeline('feature-extraction', 'Xenova/all-MiniLM-L6-v2', {
        progress_callback: (p) => {
          if (p.status === 'downloading') {
            const pct = p.total ? Math.round((p.loaded / p.total) * 100) : 0;
            onProgress?.({ status: 'downloading', pct, file: p.file });
          } else if (p.status === 'ready') {
            onProgress?.({ status: 'ready' });
          }
        }
      });
      isReady  = true;
      isLoading = false;
      onProgress?.({ status: 'done' });
    } catch (err) {
      isLoading = false;
      console.error('Brain load error:', err);
      throw err;
    }
  },

  // Index an array of paper objects from Supabase
  // Each paper should have: { id, title, subject_name, year, level }
  async index(papers, onProgress) {
    if (!isReady) throw new Error('Model not loaded');
    paperEmbeds = [];

    for (let i = 0; i < papers.length; i++) {
      const p = papers[i];
      const text = buildPaperText(p);
      const output = await embedder(text, { pooling: 'mean', normalize: true });
      paperEmbeds.push({ id: p.id, embedding: Array.from(output.data), paper: p });
      onProgress?.({ indexed: i + 1, total: papers.length });
    }
  },

  // Semantic search — returns top-k papers sorted by similarity
  async search(query, topK = 8) {
    if (!isReady) throw new Error('Model not loaded');
    if (!paperEmbeds.length) return [];

    const output = await embedder(query, { pooling: 'mean', normalize: true });
    const queryVec = Array.from(output.data);

    const scored = paperEmbeds.map(item => ({
      paper: item.paper,
      score: cosineSim(queryVec, item.embedding)
    }));

    return scored
      .sort((a, b) => b.score - a.score)
      .slice(0, topK)
      .filter(r => r.score > 0.15);   // Minimum relevance threshold
  },

  get ready() { return isReady; },
  get loading() { return isLoading; }
};

// ─── HELPERS ──────────────────────────────────────────────
function buildPaperText(p) {
  // Rich text representation for better embeddings
  return [
    p.title,
    p.subject_name,
    p.level,
    `year ${p.year}`,
    p.is_mark_scheme ? 'mark scheme answers solutions' : 'question paper exam',
    p.paper_number ? `paper ${p.paper_number}` : ''
  ].filter(Boolean).join(' ');
}

function cosineSim(a, b) {
  let dot = 0, normA = 0, normB = 0;
  for (let i = 0; i < a.length; i++) {
    dot   += a[i] * b[i];
    normA += a[i] * a[i];
    normB += b[i] * b[i];
  }
  return dot / (Math.sqrt(normA) * Math.sqrt(normB));
}
