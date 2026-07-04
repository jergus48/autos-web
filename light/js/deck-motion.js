// swiftrix — deck motion layer
// Scroll-reveal, nav-on-scroll, scroll progress bar. Hides elements only from JS,
// so with JS disabled everything stays fully visible. Respects reduced-motion.
(function () {
  var reduce = window.matchMedia && window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  var LIGHT = location.pathname.indexOf("/light") === 0;   // the original light build
  var IS_LT = location.pathname.indexOf("/lt") !== -1;     // works for /lt/ and /light/lt/

  // ---- scroll progress bar ----
  function progressBar() {
    var bar = document.createElement("div");
    bar.id = "deck-progress";
    document.body.appendChild(bar);
    function upd() {
      var st = document.documentElement.scrollTop || document.body.scrollTop;
      var h = document.documentElement.scrollHeight - document.documentElement.clientHeight;
      bar.style.width = (h > 0 ? (st / h) * 100 : 0) + "%";
    }
    window.addEventListener("scroll", upd, { passive: true });
    window.addEventListener("resize", upd);
    upd();
  }

  // ---- nav shrink / blur on scroll ----
  function navScroll() {
    var nav = document.querySelector(".vex-nav");
    if (!nav) return;
    function upd() {
      var y = window.scrollY || document.documentElement.scrollTop;
      nav.classList.toggle("scrolled", y > 24);
    }
    window.addEventListener("scroll", upd, { passive: true });
    upd();
  }

  // ---- deck-style lime marker: wrap a keyword inside `root` with .deck-hl ----
  function markWord(root, words) {
    if (!root || root.querySelector(".deck-hl")) return false;
    var walker = document.createTreeWalker(root, NodeFilter.SHOW_TEXT, null);
    var node;
    while ((node = walker.nextNode())) {
      for (var i = 0; i < words.length; i++) {
        var idx = node.nodeValue.toLowerCase().indexOf(words[i]);
        if (idx === -1) continue;
        var word = node.nodeValue.substr(idx, words[i].length);
        var after = node.splitText(idx);
        after.nodeValue = after.nodeValue.slice(word.length);
        var span = document.createElement("span");
        span.className = "deck-hl";
        span.textContent = word;
        after.parentNode.insertBefore(span, after);
        return true;
      }
    }
    return false;
  }

  function heroHighlight() {
    markWord(document.querySelector("h1"), ["workflows", "procesus", "procesą", "darbus"]);
  }

  // ---- kill the blurry glow blobs inside cards (the "mud") ----
  function killBlur() {
    var SCOPES = '[data-swiftrix-name="Process Card"],[data-swiftrix-name="Card"],' +
      '[data-swiftrix-name="Why Us Card"],[data-swiftrix-name="Comparison"],' +
      '[data-swiftrix-name="Testimonial"]';
    document.querySelectorAll(SCOPES).forEach(function (scope) {
      [].forEach.call(scope.querySelectorAll("*"), function (el) {
        var m = (getComputedStyle(el).filter || "").match(/blur\((\d+(?:\.\d+)?)px\)/);
        if (m && parseFloat(m[1]) >= 3) el.style.display = "none";
      });
    });
  }

  // ---- process cards: "Step 01" pills -> deck-mono "/ 01" ----
  function deckSteps() {
    document.querySelectorAll('[data-swiftrix-name="Process Card"] p').forEach(function (p) {
      var t = p.textContent.trim();
      var m = t.match(/\b0?(\d{1,2})\b/);   // "Step 01" or "01 žingsnis"
      if (m && t.length < 14 && !p.classList.contains("deck-step")) {
        p.classList.add("deck-step");
        p.textContent = "/ 0" + (+m[1]);
      }
    });
  }

  // ---- comparison: restyle the V/S badge (dark + lime ring + mono) ----
  function vsBadge() {
    var vc = document.querySelector('[data-swiftrix-name="Versus Container"]');
    if (!vc) return;
    [].forEach.call(vc.querySelectorAll("div"), function (d) {
      var bg = getComputedStyle(d).backgroundColor;
      var n = (bg.match(/\d+/g) || []).map(Number);
      if (n.length >= 3 && n[0] > 180 && n[1] > 180 && n[2] > 180) {
        d.style.background = "#0f1013";
        d.style.border = "1px solid rgba(176, 229, 98, .5)";
      }
    });
    var p = vc.querySelector("p");
    if (p) p.classList.add("deck-step");
  }

  // ---- "We are not an agency": eyebrow + lime marker ----
  function aboutCard() {
    var sec = document.querySelector('[data-swiftrix-name="Testimonial"]');
    if (!sec || sec.querySelector(".deck-eyebrow")) return;
    var h = sec.querySelector("h2, h3");
    if (!h) return;
    var eb = document.createElement("div");
    eb.className = "deck-eyebrow";
    eb.textContent = IS_LT ? "/ APIE MUS" : "/ ABOUT US";
    h.parentNode.insertBefore(eb, h);
    markWord(h, ["agency", "agentūra", "agentūros"]);
  }

  // ---- benefits: split the run-together "Title Description..." paragraphs ----
  function benefitTitles() {
    document.querySelectorAll('[data-swiftrix-name="Benefits Card"] [data-swiftrix-name="Heading"] p')
      .forEach(function (p) {
        if (p.querySelector(".deck-bt")) return;
        var node = p.firstChild;
        while (node && node.nodeType !== 3) node = node.nextSibling;
        if (!node) return;
        var text = node.nodeValue.replace(/^\s+/, "");
        var m = text.match(/^(\S+\s+\S+)\s+([\s\S]+)$/);   // first two words = title
        if (!m) return;
        node.nodeValue = " " + m[2];
        var strong = document.createElement("span");
        strong.className = "deck-bt";
        strong.textContent = m[1].replace(/[.:]$/, "");
        p.insertBefore(strong, node);
      });
  }

  // ---- reformat the messy Framer stat dome into a clean stat grid ----
  var STAT_ICONS = [
    '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="9"/><path d="M12 7v5l3 2"/></svg>',       // clock
    '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M12 3 3 8l9 5 9-5-9-5Z"/><path d="M3 13l9 5 9-5"/></svg>',      // layers
    '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M12 20s-7-4.4-7-10a4 4 0 0 1 7-2.3A4 4 0 0 1 19 10c0 5.6-7 10-7 10Z"/></svg>', // heart
    '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M13 2 4 14h6l-1 8 9-12h-6l1-8Z"/></svg>'                       // bolt
  ];

  function reformatStats() {
    if (document.querySelector('.vex-stats')) return;
    var cells = [].slice.call(document.querySelectorAll('[data-swiftrix-name="Why Us Card 2"]'));
    if (cells.length < 3) return;
    function common(nodes) { var a = nodes[0]; while (a && !nodes.every(function (n) { return a.contains(n); })) a = a.parentElement; return a; }
    var grid = common(cells);
    var block = grid && grid.parentElement;              // dome + badge + grid
    if (!block || !block.parentElement) return;

    var data = cells.map(function (c) {
      var leaves = [].slice.call(c.querySelectorAll('*')).filter(function (e) { return !e.children.length && e.textContent.trim(); });
      var sized = leaves.map(function (e) { return { t: e.textContent.trim(), s: parseFloat(getComputedStyle(e).fontSize) || 0 }; })
                        .sort(function (a, b) { return b.s - a.s; });
      var num = sized.length ? sized[0].t : '';
      var label = '';
      for (var i = 1; i < sized.length; i++) { if (/[A-Za-zÀ-ſ]/.test(sized[i].t) && sized[i].t !== num) { label = sized[i].t; break; } }
      return { num: num, label: label };
    });

    var wrap = document.createElement('div');
    wrap.className = 'vex-stats';
    data.forEach(function (d, i) {
      var card = document.createElement('div');
      card.className = 'vex-stat';
      card.setAttribute('data-swiftrix-name', 'Card');   // reuse reveal + count-up hooks
      card.innerHTML =
        '<div class="vex-stat-ic">' + STAT_ICONS[i % STAT_ICONS.length] + '</div>' +
        '<div class="vex-stat-num">' + d.num + '</div>' +
        '<div class="vex-stat-lbl">' + d.label + '</div>';
      wrap.appendChild(card);
    });
    block.parentElement.replaceChild(wrap, block);
  }

  // ---- scroll reveal (typed entrance animations) ----
  var revealNodes = [];
  var counters = [];

  // element name -> reveal flavour
  var TYPE = {
    "Why Us Card": "pop", "Process Card": "pop", "Benefits Card": "pop",
    "Card": "pop", "Why Us Card 2": "pop",
    "Section Badge 1": "badge",
    "Heading": "up", "Big Closed": "up"
  };

  function hideTargets() {
    if (reduce) return;
    var SEL = Object.keys(TYPE)
      .map(function (n) { return '[data-swiftrix-name="' + n + '"]'; }).join(",");

    var nodes = Array.prototype.slice.call(document.querySelectorAll(SEL));
    // avoid nested double-reveal: drop a node if an ancestor is also a target
    nodes = nodes.filter(function (el) {
      return !nodes.some(function (o) { return o !== el && o.contains(el); });
    });

    var groups = new Map();
    nodes.forEach(function (el) {
      var type = TYPE[el.getAttribute("data-swiftrix-name")] || "up";
      el.classList.add("deck-reveal", "deck-" + type);
      var p = el.parentElement;                    // stagger siblings
      var i = groups.get(p) || 0; groups.set(p, i + 1);
      el.style.transitionDelay = Math.min(i * 95, 420) + "ms";
    });
    revealNodes = nodes;

    // stat counters: big numeric leaves like "5+", "99%", "150"
    counters = Array.prototype.slice
      .call(document.querySelectorAll("h1,h2,h3,p,span,div"))
      .filter(function (el) {
        if (el.children.length) return false;
        var m = (el.textContent || "").trim().match(/^(\d{1,4})([+%]?)$/);
        if (!m) return false;
        return parseFloat(getComputedStyle(el).fontSize) >= 26;
      })
      .map(function (el) {
        var m = el.textContent.trim().match(/^(\d{1,4})([+%]?)$/);
        return { el: el, target: +m[1], suffix: m[2], done: false };
      });
  }

  function runCount(c) {
    c.done = true;
    var dur = 1200, t0 = performance.now();
    function step(t) {
      var p = Math.min((t - t0) / dur, 1);
      var eased = 1 - Math.pow(1 - p, 3);           // ease-out cubic
      c.el.textContent = Math.round(eased * c.target) + c.suffix;
      if (p < 1) requestAnimationFrame(step);
    }
    requestAnimationFrame(step);
  }

  // rAF-throttled scroll check on LIVE geometry. Unlike an IntersectionObserver
  // this self-corrects if Framer is still settling layout at load.
  function revealCheck() {
    var trigger = window.innerHeight * 0.88;
    if (revealNodes.length) {
      revealNodes = revealNodes.filter(function (el) {
        if (el.getBoundingClientRect().top < trigger) {
          el.classList.add("deck-in");
          return false;
        }
        return true;
      });
    }
    if (counters.length) {
      counters.forEach(function (c) {
        if (!c.done && c.el.getBoundingClientRect().top < trigger) runCount(c);
      });
    }
  }

  var ticking = false;
  function onScroll() {
    if (ticking) return;
    ticking = true;
    requestAnimationFrame(function () { revealCheck(); ticking = false; });
  }

  function startReveals() {
    window.addEventListener("scroll", onScroll, { passive: true });
    window.addEventListener("resize", onScroll);
    // settle passes: run a few times after load so Framer geometry stabilizes
    [120, 400, 900].forEach(function (t) { setTimeout(revealCheck, t); });
  }

  // failsafe: never leave content hidden
  function failsafe() {
    setTimeout(function () {
      revealNodes.forEach(function (el) { el.classList.add("deck-in"); });
      revealNodes = [];
      counters.forEach(function (c) { if (!c.done) { c.el.textContent = c.target + c.suffix; c.done = true; } });
    }, 4000);
  }

  function whenLoaded(fn) {
    if (document.readyState === "complete") requestAnimationFrame(fn);
    else window.addEventListener("load", function () { requestAnimationFrame(fn); });
  }

  function start() {
    progressBar();
    navScroll();
    heroHighlight(); // marker on the hero keyword
    benefitTitles(); // split benefit title from description
    reformatStats(); // swap the Framer stat dome for a clean grid (before reveal wiring)
    deckSteps();     // "Step 01" -> mono "/ 01"
    aboutCard();     // eyebrow + marker on the about card
    if (!LIGHT) {    // dark-only cleanups (the light build keeps its own decor)
      killBlur();    // remove muddy blur blobs inside cards
      vsBadge();     // dark + lime V/S badge
    }
    hideTargets();   // hide before first paint (no flash)
    // Reveal once fully loaded so on-screen items fade in and the rest wait for scroll.
    whenLoaded(function () { startReveals(); failsafe(); });
  }

  if (document.readyState === "loading")
    document.addEventListener("DOMContentLoaded", start);
  else start();
})();
