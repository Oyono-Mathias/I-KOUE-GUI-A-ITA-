import fs from 'fs';

let css = fs.readFileSync('src/index.css', 'utf8');

// Replace any previous FORCE TAB NAV TO BOTTOM block if it exists
css = css.replace(/\/\* --- FORCE TAB NAV TO BOTTOM --- \*\/[\s\S]*?(?=\/\*|$)/, '');

// Append the final polished version for bottom navigation
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
  box-shadow: 0 -4px 12px rgba(0,0,0,0.08);
  background: var(--color-blanc-pur) !important;
  z-index: 1000 !important;
  padding-bottom: env(safe-area-inset-bottom) !important;
  
  /* Ensure it looks like a proper app tab bar */
  display: flex !important;
  flex-direction: row !important;
  justify-content: flex-start !important; /* Allow scroll if many items */
  overflow-x: auto !important;
  scrollbar-width: none !important;
  -webkit-overflow-scrolling: touch !important;
}

div[class$="-dashboard-container"] {
  padding-bottom: 85px !important; /* Space for the bottom nav */
}

/* Ensure active state has a top border instead of bottom border since it's at the bottom */
.tab-btn {
  border-bottom: none !important;
  border-top: 3px solid transparent !important;
}
.tab-btn.active {
  border-top-color: var(--color-or-solaire) !important;
  border-bottom-color: transparent !important;
}
`;

fs.writeFileSync('src/index.css', css);
