// swiftrix static fixes: working FAQ accordion.
// swiftrix normally injects the answers via its runtime (absent in this static export),
// so we supply the answers and a robust expand/collapse that ignores swiftrix's clipping.
(function () {
  var ANSWERS = {
    "do i have to pay upfront for your services?":
      "We ask for a 30–50% upfront payment to start the work, with the balance due on delivery. Live automations are then kept running under a monthly upkeep fee that covers monitoring, maintenance, and support.",
    "will swiftrix work for small teams and startups?":
      "Absolutely. Small teams often see the biggest gains, because manual work eats a larger share of their day. Every build is tailored to your size, budget, and tools.",
    "which tools and platforms do you integrate with?":
      "Virtually anything with an API — CRMs, spreadsheets, email, Slack, databases, payment systems, and custom internal tools. If it has an interface, we can usually automate it.",
    "do you handle process optimization or just builds?":
      "Both. We start by mapping and diagnosing your workflows to remove waste, then build the automations. Ongoing optimization is part of every engagement.",
    "can i cancel anytime if i'm not satisfied?":
      "Yes. There are no long lock-in contracts. If we're not delivering value you're free to stop — though most teams choose to stay.",
    "what makes swiftrix different from other providers?":
      "We're engineers, not a generic agency. Every automation is custom-built for your stack, monitored continuously, and backed by our uptime guarantee.",
    "do you build the automations or just advise on strategy?":
      "We build. Strategy is included, but you walk away with working, production-ready automations — not just a deck of recommendations.",

    // Lithuanian (/lt)
    "ar reikia mokėti iš anksto už jūsų paslaugas?":
      "Prašome 30–50 % išankstinio mokėjimo darbui pradėti, o likusią sumą sumokate po pristatymo. Veikiančios automatizacijos toliau prižiūrimos už mėnesinį priežiūros mokestį, apimantį stebėseną, priežiūrą ir palaikymą.",
    "ar swiftrix tinka mažoms komandoms ir startuoliams?":
      "Žinoma. Mažos komandos dažnai gauna didžiausią naudą, nes rankinis darbas joms atima daugiausia laiko. Kiekvieną sprendimą pritaikome pagal jūsų dydį, biudžetą ir įrankius.",
    "su kokiais įrankiais ir platformomis integruojatės?":
      "Praktiškai su bet kuo, kas turi API — CRM, skaičiuoklėmis, el. paštu, Slack, duomenų bazėmis, mokėjimų sistemomis ir individualiais vidiniais įrankiais. Jei tai turi sąsają, dažniausiai galime automatizuoti.",
    "ar užsiimate procesų optimizavimu, ar tik kūrimu?":
      "Abiem. Pradedame nuo jūsų procesų analizės ir diagnostikos, kad pašalintume nuostolius, tada kuriame automatizacijas. Nuolatinis optimizavimas yra kiekvieno projekto dalis.",
    "ar galiu bet kada atsisakyti, jei nebūsiu patenkintas?":
      "Taip. Jokių ilgalaikių įsipareigojimų. Jei neteikiame vertės, galite nutraukti — nors dauguma komandų nusprendžia likti.",
    "kuo swiftrix skiriasi nuo kitų tiekėjų?":
      "Esame inžinieriai, o ne įprasta agentūra. Kiekviena automatizacija kuriama individualiai jūsų sistemoms, nuolat stebima ir užtikrinta mūsų veikimo garantija.",
    "ar kuriate automatizacijas, ar tik konsultuojate dėl strategijos?":
      "Mes kuriame. Strategija įskaičiuota, bet jūs gaunate veikiančias, paruoštas naudoti automatizacijas — ne tik rekomendacijų skaidres."
  };

  function norm(s) {
    return (s || "").replace(/\s+/g, " ").trim().toLowerCase().replace(/[’]/g, "'");
  }

  function init() {
    var questions = document.querySelectorAll('[data-swiftrix-name="Question"]');
    questions.forEach(function (q) {
      var head = q.querySelector("h3, p");
      if (!head) return;
      var answer = ANSWERS[norm(head.textContent)];
      if (!answer) return;

      // outer card to attach the answer to (so it is not clipped by inner containers)
      var card = q.closest('[data-swiftrix-name="Big Closed"]') || q.parentNode;

      // remove fixed-height / clipping from the chain between question and card
      var el = q;
      while (el && el !== card.parentNode) {
        el.style.overflow = "visible";
        el.style.height = "auto";
        el.style.maxHeight = "none";
        el = el.parentNode;
      }
      card.style.overflow = "visible";
      card.style.height = "auto";

      var panel = document.createElement("div");
      panel.className = "vex-answer";
      var p = document.createElement("p");
      p.textContent = answer;
      panel.appendChild(p);
      card.appendChild(panel);

      q.style.cursor = "pointer";
      var icon = q.querySelector('[data-swiftrix-name="Plus Icon"]');

      q.addEventListener("click", function (ev) {
        ev.preventDefault();
        ev.stopPropagation();
        var open = panel.classList.toggle("open");
        panel.style.maxHeight = open ? panel.scrollHeight + 48 + "px" : "0px";
        if (icon) icon.style.transform = open ? "rotate(45deg)" : "rotate(0deg)";
      });
    });
  }

  function initNav() {
    var burger = document.getElementById("vexBurger");
    var links = document.getElementById("vexLinks");
    if (!burger || !links) return;
    burger.addEventListener("click", function (e) {
      e.stopPropagation();
      var open = links.classList.toggle("open");
      burger.classList.toggle("open", open);
      burger.setAttribute("aria-expanded", open ? "true" : "false");
    });
    // close when a link is tapped
    links.querySelectorAll("a").forEach(function (a) {
      a.addEventListener("click", function () {
        links.classList.remove("open");
        burger.classList.remove("open");
        burger.setAttribute("aria-expanded", "false");
      });
    });
    // close when tapping outside
    document.addEventListener("click", function (e) {
      if (!links.contains(e.target) && !burger.contains(e.target)) {
        links.classList.remove("open");
        burger.classList.remove("open");
        burger.setAttribute("aria-expanded", "false");
      }
    });
  }

  // Collapse baked-in line-break artifacts in text (swiftrix export + CRLF leave
  // newlines inside text that `white-space: pre-wrap` renders as broken wrapping).
  // Only runs of whitespace that CONTAIN a newline are collapsed, so intentional
  // multi-space spacing (e.g. the hero pill) is preserved. Runs at load, so it
  // self-heals regardless of what the HTML source contains.
  function normalizeText() {
    var containers = document.querySelectorAll(
      '[data-swiftrix-component-type="RichTextContainer"], .swiftrix-text'
    );
    containers.forEach(function (el) {
      var walker = document.createTreeWalker(el, NodeFilter.SHOW_TEXT, null);
      var nodes = [], n;
      while ((n = walker.nextNode())) nodes.push(n);
      nodes.forEach(function (t) {
        if (/[\r\n]/.test(t.nodeValue)) {
          t.nodeValue = t.nodeValue.replace(/[ \t]*[\r\n]+[ \t]*/g, " ");
        }
      });
    });
  }

  function reveal() { document.documentElement.classList.add("vex-ready"); }

  function start() {
    normalizeText(); init(); initNav();
    // Reveal only after text is normalized and fonts are ready, so the ugly
    // pre-normalization / fallback-font frame never shows. Timeout is a safety net.
    if (document.fonts && document.fonts.ready) {
      document.fonts.ready.then(reveal);
      setTimeout(reveal, 1500);
    } else {
      reveal();
    }
  }

  if (document.readyState === "loading")
    document.addEventListener("DOMContentLoaded", start);
  else start();
})();
