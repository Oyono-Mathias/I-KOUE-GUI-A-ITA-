import fs from 'fs';

let css = fs.readFileSync('src/index.css', 'utf8');

css = css.replace(/\.bottom-nav \{\s*display: none !important;\s*\}/, '/* .bottom-nav removed */');

// Add styles to push tab-nav to the bottom
css += `
/* --- FORCE TAB NAV TO BOTTOM --- */
.tab-nav {
  position: fixed !important;
  bottom: 0 !important;
  top: auto !important;
  left: 0;
  right: 0;
  width: 100%;
  border-top: 1px solid var(--color-bordure);
  border-bottom: none !important;
  box-shadow: 0 -2px 10px rgba(0,0,0,0.05);
  background: var(--color-blanc-pur) !important;
  z-index: 1000 !important;
  padding-bottom: env(safe-area-inset-bottom) !important;
}

div[class$="-dashboard-container"] {
  padding-bottom: 80px !important; /* Space for the bottom nav */
}
`;

fs.writeFileSync('src/index.css', css);
