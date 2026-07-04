// Light/Dark switch — flips between the current (dark) build at "/" and the
// original (light) build at "/light/". Self-contained: injects its own styles.
(function () {
  var isLight = location.pathname.indexOf("/light") === 0;

  function target() {
    var p = location.pathname;
    if (isLight) { p = p.replace(/^\/light/, ""); if (!p) p = "/"; }
    else { p = "/light" + p; }
    return p + location.search + location.hash;
  }

  var css = [
    ".dts-switch{position:fixed;top:22px;right:24px;z-index:100000;",
    "border:0;padding:0;cursor:pointer;background:transparent;-webkit-tap-highlight-color:transparent;}",
    ".dts-track{position:relative;display:flex;align-items:center;gap:6px;",
    "width:70px;height:34px;border-radius:100px;padding:0 8px;box-sizing:border-box;",
    "justify-content:space-between;transition:background .3s ease,border-color .3s ease,box-shadow .3s ease;}",
    ".dts-ic{width:16px;height:16px;display:grid;place-items:center;position:relative;z-index:2;transition:color .3s ease,opacity .3s ease;}",
    ".dts-ic svg{width:16px;height:16px;display:block;}",
    ".dts-knob{position:absolute;top:4px;left:4px;width:26px;height:26px;border-radius:50%;z-index:1;",
    "transition:transform .32s cubic-bezier(.34,1.56,.64,1),background .3s ease;}",
    // dark build styling
    ".dts-switch.is-dark .dts-track{background:rgba(18,18,21,.85);border:1px solid rgba(176,229,98,.35);",
    "box-shadow:0 6px 20px -8px rgba(0,0,0,.6),0 0 18px -8px rgba(176,229,98,.4);",
    "-webkit-backdrop-filter:blur(10px);backdrop-filter:blur(10px);}",
    ".dts-switch.is-dark .dts-knob{transform:translateX(36px);background:linear-gradient(135deg,#c5f07a,#a0d64a);}",
    ".dts-switch.is-dark .dts-sun{color:#6b6b6b;}.dts-switch.is-dark .dts-moon{color:#0a0a0c;}",
    // light build styling
    ".dts-switch.is-light .dts-track{background:rgba(255,255,255,.9);border:1px solid rgba(124,58,237,.28);",
    "box-shadow:0 8px 24px -10px rgba(80,60,140,.35);-webkit-backdrop-filter:blur(10px);backdrop-filter:blur(10px);}",
    ".dts-switch.is-light .dts-knob{transform:translateX(0);background:linear-gradient(135deg,#a855f7,#7c3aed);}",
    ".dts-switch.is-light .dts-sun{color:#fff;}.dts-switch.is-light .dts-moon{color:#b8b3c4;}",
    ".dts-switch:hover .dts-track{filter:brightness(1.05);}",
    ".dts-switch:active .dts-knob{width:30px;}",
    "@media(max-width:860px){.dts-switch{top:auto;bottom:20px;right:18px;}}"
  ].join("");

  var st = document.createElement("style");
  st.textContent = css;
  document.head.appendChild(st);

  var SUN = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><circle cx="12" cy="12" r="4"/><path d="M12 2v2M12 20v2M4.9 4.9l1.4 1.4M17.7 17.7l1.4 1.4M2 12h2M20 12h2M4.9 19.1l1.4-1.4M17.7 6.3l1.4-1.4"/></svg>';
  var MOON = '<svg viewBox="0 0 24 24" fill="currentColor"><path d="M21 12.8A9 9 0 1 1 11.2 3a7 7 0 0 0 9.8 9.8z"/></svg>';

  var btn = document.createElement("button");
  btn.className = "dts-switch " + (isLight ? "is-light" : "is-dark");
  btn.type = "button";
  btn.setAttribute("aria-label", isLight ? "Switch to dark mode" : "Switch to light mode");
  btn.title = isLight ? "Switch to dark mode" : "Switch to light mode";
  btn.innerHTML = '<span class="dts-track"><span class="dts-ic dts-sun">' + SUN +
    '</span><span class="dts-ic dts-moon">' + MOON + '</span><span class="dts-knob"></span></span>';
  btn.addEventListener("click", function () {
    try { localStorage.setItem("swiftrix-theme", isLight ? "dark" : "light"); } catch (e) {}
    location.href = target();
  });

  function mount() { (document.body || document.documentElement).appendChild(btn); }
  if (document.body) mount();
  else document.addEventListener("DOMContentLoaded", mount);
})();
