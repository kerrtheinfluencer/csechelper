/* =========================================================
   CXC PAPERS — ai-search.js v4
   Full local study assistant — Zero API calls
   ========================================================= */

import { Brain } from './brain.js';

// Same Supabase project app.js uses — duplicated here because this module is
// lazy-loaded independently. window.supabase (the library) is already on the
// page by the time this loads, since it's a top-level <script> in index.html.
const NEWSLETTER_SUPABASE_URL = 'https://eavcrtoekpmcwdpdeuvg.supabase.co';
const NEWSLETTER_SUPABASE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImVhdmNydG9la3BtY3dkcGRldXZnIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzQ1NjIxMzQsImV4cCI6MjA5MDEzODEzNH0.ScLaG4vDgjVN43dFxp88IkJ4ysOmtVyuLNl0ypnzxqk';
