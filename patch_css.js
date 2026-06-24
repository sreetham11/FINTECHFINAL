const fs = require('fs');
let css = fs.readFileSync('src/app/globals.css', 'utf8');

const marker = '/* ===========================\n   WHITE TEXT TREATMENT FOR RED/DARK MOMENT CARDS\n   =========================== */';

if (css.includes(marker)) {
  css = css.substring(0, css.indexOf(marker));
}

const newCss = `
/* ===========================
   WHITE TEXT TREATMENT FOR COLORED CARDS
   =========================== */

/* Background overrides */
.card-red {
  background: var(--nets-red) !important;
}
html.dark .card-red {
  background: #8B0000 !important;
}
.card-blue {
  background: var(--nets-blue) !important;
}
html.dark .card-blue {
  background: #001B5E !important;
}
.card-dark {
  background: var(--ink-black) !important;
}
html.dark .card-dark {
  background: #000000 !important;
}

/* Base text color with !important inheritance */
.card-red, .card-blue, .card-dark,
html.dark .moment-card {
  color: #FFFFFF !important;
}

.card-red *, .card-blue *, .card-dark * {
  color: #FFFFFF !important;
}

/* Merchant names */
.card-red .moment-merchant, .card-red .merchant-name,
.card-blue .moment-merchant, .card-blue .merchant-name,
.card-dark .moment-merchant, .card-dark .merchant-name,
html.dark .moment-card .moment-merchant {
  color: #FFFFFF !important;
  font-weight: 700 !important;
}

/* Timestamps */
.card-red .moment-timestamp, .card-red .timestamp {
  color: #FFCCCC !important;
}

/* AI One Liners & Dividers */
.card-red .moment-memory-line, .card-red .ai-oneliner, .card-red .divider {
  border-top-color: rgba(255, 255, 255, 0.3) !important;
  border-color: rgba(255, 255, 255, 0.3) !important;
  color: #FFEEEE !important;
}

html.dark .card-red .moment-memory-line, html.dark .card-red .ai-oneliner, html.dark .card-red .divider {
  border-top-color: rgba(255, 255, 255, 0.2) !important;
  border-color: rgba(255, 255, 255, 0.2) !important;
  color: rgba(255, 255, 255, 0.7) !important;
}

.card-blue .moment-memory-line, .card-dark .moment-memory-line,
.card-blue .ai-oneliner, .card-dark .ai-oneliner {
  border-top-color: rgba(255, 255, 255, 0.3) !important;
  color: rgba(255, 255, 255, 0.9) !important;
}

/* Tags and Badges */
.card-red .stamp-tag, .card-blue .stamp-tag, .card-dark .stamp-tag,
.card-red .stamp-tag-outline, .card-blue .stamp-tag-outline, .card-dark .stamp-tag-outline,
.card-red .friend-tag, .card-blue .friend-tag, .card-dark .friend-tag {
  color: #FFFFFF !important;
  border-color: #FFFFFF !important;
}

/* Ensure background of yellow split tags or similar aren't ruined by * selector, but user asked for all text white */
.card-red .stamp-tag-yellow, .card-blue .stamp-tag-yellow, .card-dark .stamp-tag-yellow {
  background: var(--dirty-yellow) !important;
  color: var(--ink-black) !important;
  border-color: var(--ink-black) !important;
}

.card-red .friend-avatar-badge, .card-blue .friend-avatar-badge, .card-dark .friend-avatar-badge {
  background: transparent !important;
  color: #FFFFFF !important;
  border: 1.5px solid #FFFFFF !important;
}
`;

fs.writeFileSync('src/app/globals.css', css + newCss);
console.log('CSS Updated');
