import fs from 'fs';
let css = fs.readFileSync('src/index.css', 'utf8');

// Remove the media query that was forcing top: 56px
css = css.replace(/@media \(max-width: 600px\) \{[\s\S]*?\/\* Mobile All[\s\S]*?top: 56px !important;\s*\}\s*\}/, '/* Removed top 56px rule */');

// Improve the FORCE TAB NAV TO BOTTOM block to override anything
css = css.replace(/\/\* --- FORCE TAB NAV TO BOTTOM --- \*\/[\s\S]*?(?=\/\*|$)/, `
/* --- FORCE TAB NAV TO BOTTOM --- */
.tab-nav,
.president-dashboard-container .tab-nav,
.vp-dashboard-container .tab-nav,
.sec-dashboard-container .tab-nav,
.tres-dashboard-container .tab-nav,
.cons-dashboard-container .tab-nav {
  position: fixed !important;
  bottom: 0 !important;
  top: auto !important;
  left: 0 !important;
  right: 0 !important;
  width: 100% !important;
  border-top: 1px solid var(--color-bordure) !important;
  border-bottom: none !important;
  box-shadow: 0 -4px 12px rgba(0,0,0,0.08) !important;
  background: var(--color-blanc-pur) !important;
  z-index: 1000 !important;
  padding-bottom: env(safe-area-inset-bottom) !important;
  
  display: flex !important;
  flex-direction: row !important;
  justify-content: flex-start !important;
  overflow-x: auto !important;
  scrollbar-width: none !important;
  -webkit-overflow-scrolling: touch !important;
}

div[class$="-dashboard-container"] {
  padding-bottom: 85px !important;
}
`);

fs.writeFileSync('src/index.css', css);
