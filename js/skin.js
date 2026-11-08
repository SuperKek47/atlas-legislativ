/* Atlasul legislativ — stilul „Legalia”: iconițe, monede, dosare-cufăr și siglă în stil luminos, plat, cu gradient fin.
   Se aplică doar dacă Setări → Stil aplicație = Legalia; „Clasic” păstrează desenele anterioare (nimic nu e șters). */
'use strict';
(() => {
const lav = () => !(A.S && A.S.settings && A.S.settings.skin === 'classic');
const R = A.arena, E = A.eco, ICO = R.ICO;
const G = (id, a, b) => `<linearGradient id="${id}" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="${a}"/><stop offset="1" stop-color="${b}"/></linearGradient>`;
const svg = (defs, body) => `<svg viewBox="0 0 24 24"><defs>${defs}</defs>${body}</svg>`;
const RIM = 'stroke="rgba(255,255,255,.75)" stroke-width="1" stroke-linejoin="round"';
const NEW = {
  lei: svg(G('gl1', '#FFE9A8', '#F0AE33'), '<circle cx="12" cy="12" r="10.2" fill="url(#gl1)"/><circle cx="12" cy="12" r="7.6" fill="none" stroke="rgba(255,255,255,.7)" stroke-width="1.1"/><text x="12" y="16" font-size="10.5" text-anchor="middle" fill="#9A5F00" font-family="Inter,Arial" font-weight="800">L</text>'),
  xp: svg(G('gx1', '#B79CFF', '#5B2CF0'), `<path d="M12 2.2l3 6.4 7 .8-5.2 4.8 1.4 6.9L12 17.5 5.8 21.1l1.4-6.9L2 9.4l7-.8z" fill="url(#gx1)" ${RIM}/>`),
  gr: svg(G('gg1', '#9CC0FF', '#4A5FF0'), `<path d="M12 2l9 10-9 10-9-10z" fill="url(#gg1)" ${RIM}/><path d="M3 12h18M12 2v20" stroke="rgba(255,255,255,.35)" stroke-width=".8"/>`),
  sp: svg(G('gs1', '#FFB4E6', '#D941A8'), `<path d="M12 2l2.6 7.4L22 12l-7.4 2.6L12 22l-2.6-7.4L2 12l7.4-2.6z" fill="url(#gs1)" ${RIM}/>`),
  en: svg(G('ge1', '#FFE08A', '#F59E1B'), `<path d="M13.2 2L4.5 13.6h6.3L9.8 22l9.7-12.4h-6.4z" fill="url(#ge1)" ${RIM}/>`),
  card: svg(G('gc1', '#9BE8C0', '#2E9E73'), '<rect x="4.5" y="3" width="15" height="18" rx="3.5" fill="url(#gc1)"/><circle cx="12" cy="10" r="3" fill="#fff"/><path d="M7.5 17.5c1.2-3 7.8-3 9 0" stroke="#fff" stroke-width="1.6" fill="none" stroke-linecap="round"/>'),
  client: svg(G('gk1', '#FFC9A3', '#F29A5A') + G('gk2', '#9A78FF', '#5B2CF0'), '<circle cx="12" cy="8" r="4.6" fill="url(#gk1)"/><path d="M3.8 21c1.2-5.6 15.2-5.6 16.4 0z" fill="url(#gk2)"/>'),
  buff: svg(G('gb1', '#FF9CAA', '#E0475F'), `<path d="M12 2c1 4 6 6 6 11a6 6 0 0 1-12 0c0-3 2-4 2-7 1 2 2 3 3 3 0-3 0-5 1-7z" fill="url(#gb1)" ${RIM}/>`),
  nitro: svg(G('gn1', '#B79CFF', '#5B2CF0'), '<rect x="6.5" y="4.5" width="11" height="17" rx="3.4" fill="url(#gn1)"/><rect x="9" y="1.8" width="6" height="3.4" rx="1.4" fill="#CFC3F5"/><path d="M12.6 8.2l-2.4 4.6h3.2L11.4 18" stroke="#fff" stroke-width="1.6" fill="none" stroke-linecap="round" stroke-linejoin="round"/>'),
  paint: svg(G('gp1', '#C9B4FF', '#7A4BFF'), `<path d="M4 18c0-4 4-4 4-8s4-7 8-6 5 6 2 9-6 1-8 4-6 5-6 1z" fill="url(#gp1)" ${RIM}/><circle cx="14" cy="8" r="1.6" fill="#fff"/>`),
  medal: svg(G('gm1', '#FFE9A8', '#F0AE33'), '<path d="M7 2h4l1 6H6zM17 2h-4l-1 6h6z" fill="#8F6BFF"/><circle cx="12" cy="15" r="6.8" fill="url(#gm1)"/><path d="M12 11.5l1.1 2.3 2.5.3-1.8 1.7.5 2.5-2.3-1.2-2.3 1.2.5-2.5-1.8-1.7 2.5-.3z" fill="#fff" opacity=".9"/>'),
  mystery: svg(G('gy1', '#C9B4FF', '#7A4BFF'), '<rect x="3.5" y="6" width="17" height="13" rx="3.4" fill="url(#gy1)"/><path d="M3.8 9.5l8.2 4.8 8.2-4.8" fill="none" stroke="rgba(255,255,255,.7)" stroke-width="1.3"/><circle cx="12" cy="14.6" r="2.4" fill="#FF8FB0"/>'),
};
const OLD = {}; for (const k of Object.keys(NEW)) OLD[k] = ICO[k];
const apply = () => { for (const k of Object.keys(NEW)) ICO[k] = lav() ? NEW[k] : OLD[k]; };

/* dosarele-cufăr: cutie rotunjită, bandă metalică și etichetă */
const mix = (h, t, a) => { const p = x => [1, 3, 5].map(i => parseInt(x.slice(i, i + 2), 16)), c = p(h), d = p(t); return '#' + c.map((v, i) => Math.round(v + (d[i] - v) * a).toString(16).padStart(2, '0')).join(''); };
const COL = { simplu: '#C79A6B', argint: '#A8B4C9', aur: '#F0B84A', magic: '#7B4BE8', decan: '#F0633E' };
const OLDCOL = {}; for (const k of Object.keys(COL)) OLDCOL[k] = E.CHESTS[k].color;
const OLDCHEST = E.chestSVG; let cid = 0;
const chestLav = (type, open) => {
  const c = E.CHESTS[type].color, a = mix(c, '#ffffff', .38), b = mix(c, '#2B0F8F', .32), d = mix(c, '#2B0F8F', .5), n = ++cid;
  return `<svg viewBox="0 0 150 124" class="${open ? 'open' : ''}"><defs>
    <linearGradient id="cb${n}" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="${a}"/><stop offset=".55" stop-color="${c}"/><stop offset="1" stop-color="${b}"/></linearGradient>
    <linearGradient id="cl${n}" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="${mix(c, '#ffffff', .55)}"/><stop offset="1" stop-color="${mix(c, '#ffffff', .1)}"/></linearGradient>
    <linearGradient id="cm${n}" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#FFFFFF"/><stop offset="1" stop-color="#D9CDF7"/></linearGradient></defs>
    <ellipse cx="75" cy="113" rx="52" ry="6" fill="rgba(60,30,150,.22)"/>
    <g><rect x="20" y="52" width="110" height="58" rx="12" fill="url(#cb${n})"/>
    <rect x="20" y="52" width="110" height="9" rx="4" fill="${d}" opacity=".18"/>
    <rect x="64" y="52" width="22" height="58" fill="url(#cm${n})" opacity=".9"/>
    <rect x="68" y="66" width="14" height="18" rx="5" fill="${d}"/><circle cx="75" cy="74" r="2.6" fill="#fff"/>
    <g class="chest-lid"><path d="M22 54 Q22 20 52 18 L98 18 Q128 20 128 54 Z" fill="url(#cl${n})"/>
      <path d="M22 54 Q22 20 52 18 L98 18 Q128 20 128 54" fill="none" stroke="rgba(255,255,255,.6)" stroke-width="1.4"/>
      <rect x="64" y="18" width="22" height="36" fill="url(#cm${n})" opacity=".9"/>
      <rect x="45" y="30" width="60" height="13" rx="6.5" fill="#fff" opacity=".92"/><text x="75" y="39.8" font-size="8.2" text-anchor="middle" font-family="Inter,system-ui,sans-serif" font-weight="800" letter-spacing="1.4" fill="#4B3AA8">DOSAR</text></g></g></svg>`;
};
const applyChest = () => { for (const k of Object.keys(COL)) E.CHESTS[k].color = lav() ? COL[k] : OLDCOL[k]; E.chestSVG = lav() ? chestLav : OLDCHEST; };

/* sigla: pătrat rotunjit violet, balanță albă, fără detalii */
const OLDLOGO = A.brand.logo; let lid = 0;
const logoLav = (opt = {}) => {
  const n = ++lid, k = opt.maskable ? .74 : 1, t = (256 * (1 - k)).toFixed(1);
  const glyph = `<g transform="translate(${t} ${t}) scale(${k})" fill="none" stroke="#fff" stroke-linecap="round" stroke-linejoin="round">
    <path d="M256 128v246" stroke-width="22"/><path d="M178 386h156" stroke-width="22"/><path d="M142 168q114-40 228 0" stroke-width="20"/>
    <circle cx="256" cy="120" r="19" fill="#fff" stroke="none"/>
    <path d="M142 168l-52 108M142 168l52 108M370 168l-52 108M370 168l52 108" stroke-width="9"/>
    <path d="M78 276q64 62 128 0zM306 276q64 62 128 0z" fill="#fff" stroke-width="10"/></g>`;
  if (opt.bare) return `<svg viewBox="0 0 512 512" xmlns="http://www.w3.org/2000/svg" class="brand-logo">${glyph}</svg>`;
  return `<svg viewBox="0 0 512 512" xmlns="http://www.w3.org/2000/svg" class="brand-logo"><defs>
    <clipPath id="lc${n}"><rect width="512" height="512" rx="${opt.square ? 0 : 118}"/></clipPath>
    <linearGradient id="lb${n}" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="#8F6BFF"/><stop offset=".55" stop-color="#5B2CF0"/><stop offset="1" stop-color="#3A12BE"/></linearGradient>
    <linearGradient id="lg${n}" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#fff" stop-opacity=".34"/><stop offset="1" stop-color="#fff" stop-opacity="0"/></linearGradient></defs>
    <g clip-path="url(#lc${n})"><rect width="512" height="512" fill="url(#lb${n})"/><ellipse cx="256" cy="-30" rx="360" ry="250" fill="url(#lg${n})"/></g>${glyph}</svg>`;
};
const applyLogo = () => { A.brand.logo = lav() ? logoLav : OLDLOGO; };

A.skin = { apply: () => { apply(); applyChest(); applyLogo(); } };
A.skin.apply();
})();
