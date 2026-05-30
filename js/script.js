// =============================================
// Yasui Tax Accounting Office — site script
// =============================================

(function () {
  "use strict";

  document.addEventListener("DOMContentLoaded", function () {
    initHamburger();
    initSmoothScroll();
    initPageTop();
    initScrollReveal();
    initHeroTitleChars();
    initSectionHeadingChars();
    initServiceItemSlotText();
  });

  // ---------------------------------------------
  // Service items: wrap each char of __name / __en into a "slot mask"
  // with an invisible clone below. On :hover of the parent .service-item,
  // the original slides up + out, the clone slides up + in (slot-machine feel).
  // ---------------------------------------------
  function initServiceItemSlotText() {
    var targets = document.querySelectorAll(".service-item__name, .service-item__en");
    Array.prototype.forEach.call(targets, function (el) {
      var text = el.textContent;
      if (!text) return;
      el.textContent = "";
      var charIdx = 0;
      Array.from(text).forEach(function (ch) {
        var display = ch === " " ? " " : ch;
        var mask = document.createElement("span");
        mask.className = "slot-mask";
        mask.style.setProperty("--i", charIdx);

        var orig = document.createElement("span");
        orig.className = "slot-orig";
        orig.textContent = display;

        var clone = document.createElement("span");
        clone.className = "slot-clone";
        clone.setAttribute("aria-hidden", "true");
        clone.textContent = display;

        mask.appendChild(orig);
        mask.appendChild(clone);
        el.appendChild(mask);
        charIdx++;
      });
    });
  }

  // ---------------------------------------------
  // Section headings (.{section}__heading): split EN + JP text into
  // <span class="heading-char"> spans for per-character mask reveal.
  // EN line animates first, JP line follows. Triggered when .is-visible
  // is added by initScrollReveal on each section's <h2>.
  // ---------------------------------------------
  function initSectionHeadingChars() {
    var CHAR_STEP = 0.05;
    var BASE_DELAY_EN = 0;
    var BASE_DELAY_JP = 0.8; // JP starts after EN line is mostly revealed

    var headings = document.querySelectorAll('[class*="__heading-en"]');
    Array.prototype.forEach.call(headings, function (en) {
      var heading = en.parentElement; // .{section}__heading
      if (!heading) return;
      var jp = heading.querySelector('[class*="__heading-jp"]');
      splitChars(en, BASE_DELAY_EN);
      if (jp) splitChars(jp, BASE_DELAY_JP);
    });

    function splitChars(root, baseDelay) {
      var charIdx = 0;
      walk(root);

      function walk(node) {
        // Snapshot children — we'll mutate the tree as we go
        var kids = Array.prototype.slice.call(node.childNodes);
        kids.forEach(function (c) {
          if (c.nodeType === 3) {
            // Text node — wrap each non-whitespace char
            var text = c.textContent;
            if (!text) return;
            var frag = document.createDocumentFragment();
            Array.from(text).forEach(function (ch) {
              if (/\s/.test(ch)) {
                frag.appendChild(document.createTextNode(ch));
              } else {
                var span = document.createElement("span");
                span.className = "heading-char";
                span.textContent = ch;
                span.style.animationDelay =
                  (baseDelay + charIdx * CHAR_STEP).toFixed(2) + "s";
                charIdx++;
                frag.appendChild(span);
              }
            });
            c.parentNode.replaceChild(frag, c);
          } else if (c.nodeType === 1) {
            walk(c);
          }
        });
      }
    }
  }

  // ---------------------------------------------
  // Hero title: split each line into individual <span> chars
  // so CSS can stagger reveal per character.
  // ---------------------------------------------
  function initHeroTitleChars() {
    var texts = document.querySelectorAll(".hero__title-text");
    if (!texts.length) return;

    // Per-line base delay (1st line starts sooner, 2nd line waits)
    var BASE_DELAY = 0.3;       // seconds before the very first char animates
    var LINE_GAP = 0.35;        // extra delay added per line after the first
    var CHAR_STEP = 0.06;       // delay added per character within a line

    Array.prototype.forEach.call(texts, function (el, lineIdx) {
      var chars = Array.from(el.textContent);
      el.textContent = "";
      chars.forEach(function (ch, charIdx) {
        var span = document.createElement("span");
        span.className = "hero__title-char";
        span.textContent = ch === " " ? " " : ch;
        var delay = BASE_DELAY + lineIdx * LINE_GAP + charIdx * CHAR_STEP;
        span.style.animationDelay = delay.toFixed(2) + "s";
        el.appendChild(span);
      });
    });
  }

  // ---------------------------------------------
  // Hamburger drawer (SP)
  // ---------------------------------------------
  function initHamburger() {
    var btn = document.getElementById("hamburger");
    var nav = document.getElementById("site-nav");
    if (!btn || !nav) return;

    btn.addEventListener("click", function () {
      var opened = nav.classList.toggle("is-open");
      btn.classList.toggle("is-active", opened);
      btn.setAttribute("aria-expanded", opened ? "true" : "false");
      btn.setAttribute("aria-label", opened ? "メニューを閉じる" : "メニューを開く");
      document.body.style.overflow = opened ? "hidden" : "";
    });

    // Close drawer when a nav link is clicked
    nav.addEventListener("click", function (e) {
      var link = e.target.closest("a");
      if (link && nav.classList.contains("is-open")) {
        closeDrawer();
      }
    });

    // Close on Escape
    document.addEventListener("keydown", function (e) {
      if (e.key === "Escape" && nav.classList.contains("is-open")) {
        closeDrawer();
        btn.focus();
      }
    });

    function closeDrawer() {
      nav.classList.remove("is-open");
      btn.classList.remove("is-active");
      btn.setAttribute("aria-expanded", "false");
      btn.setAttribute("aria-label", "メニューを開く");
      document.body.style.overflow = "";
    }
  }

  // ---------------------------------------------
  // Smooth scroll for in-page anchor links
  // Accounts for the fixed header height.
  // ---------------------------------------------
  function initSmoothScroll() {
    var headerEl = document.querySelector(".site-header");
    var prefersReduced =
      window.matchMedia &&
      window.matchMedia("(prefers-reduced-motion: reduce)").matches;

    document.addEventListener("click", function (e) {
      var link = e.target.closest('a[href^="#"]');
      if (!link) return;
      // Skip PAGE TOP links — initPageTop handles those and would conflict here
      // (target = fixed header makes getBoundingClientRect math go wrong)
      if (link.classList.contains("page-top")) return;

      var href = link.getAttribute("href");
      if (!href || href === "#" || href === "#!") return;

      var target = document.querySelector(href);
      if (!target) return;

      e.preventDefault();

      var headerH = headerEl ? headerEl.getBoundingClientRect().height : 0;
      var top =
        target.getBoundingClientRect().top +
        window.pageYOffset -
        headerH -
        8;

      window.scrollTo({
        top: top,
        behavior: prefersReduced ? "auto" : "smooth",
      });
    });
  }

  // ---------------------------------------------
  // PAGE TOP button
  // Footer button scrolls to top; also auto-shows
  // a floating chevron after the user scrolls past
  // one viewport (mirrors Figma's behaviour).
  // ---------------------------------------------
  function initPageTop() {
    var prefersReduced =
      window.matchMedia &&
      window.matchMedia("(prefers-reduced-motion: reduce)").matches;

    function scrollTop(e) {
      if (e && e.preventDefault) e.preventDefault();
      window.scrollTo({
        top: 0,
        behavior: prefersReduced ? "auto" : "smooth",
      });
    }

    // Embedded PAGE TOP in footer
    var btn = document.querySelector(".page-top");
    if (btn) btn.addEventListener("click", scrollTop);

    // Floating PAGE TOP — appears after scrolling past one viewport,
    // hides over the footer, and inverts color when over dark sections.
    var floatBtn = document.getElementById("pageTopFloat");
    if (!floatBtn) return;

    floatBtn.addEventListener("click", scrollTop);

    var footer = document.querySelector(".site-footer");
    // Selectors of sections with dark background — over these, button text turns white
    var darkSections = document.querySelectorAll(".hero, .cta, .site-footer");

    function onScroll() {
      var scrolled = window.pageYOffset || document.documentElement.scrollTop;
      var vh = window.innerHeight;

      // Visible after first viewport
      var shouldShow = scrolled > vh * 0.6;
      floatBtn.classList.toggle("is-visible", shouldShow);

      // Hide when near footer (avoid overlap with embedded PAGE TOP)
      if (footer) {
        var rect = footer.getBoundingClientRect();
        var nearFooter = rect.top < vh - 80;
        floatBtn.classList.toggle("is-near-footer", nearFooter);
      }

      // Color: white when button center sits over any dark section
      var btnCenterY = vh - 80; // approx button vertical center from top
      var onDark = false;
      Array.prototype.forEach.call(darkSections, function (sec) {
        var r = sec.getBoundingClientRect();
        if (r.top <= btnCenterY && r.bottom >= btnCenterY) onDark = true;
      });
      floatBtn.classList.toggle("is-on-dark", onDark);
    }

    window.addEventListener("scroll", onScroll, { passive: true });
    onScroll();
  }

  // ---------------------------------------------
  // Scroll-triggered fade/slide-in
  // Adds .is-visible to [data-reveal] elements
  // when they enter the viewport.
  // ---------------------------------------------
  function initScrollReveal() {
    var items = document.querySelectorAll("[data-reveal]");
    if (!items.length) return;

    var prefersReduced =
      window.matchMedia &&
      window.matchMedia("(prefers-reduced-motion: reduce)").matches;

    if (prefersReduced || !("IntersectionObserver" in window)) {
      items.forEach(function (el) {
        el.classList.add("is-visible");
      });
      return;
    }

    var io = new IntersectionObserver(
      function (entries) {
        entries.forEach(function (entry) {
          if (entry.isIntersecting) {
            entry.target.classList.add("is-visible");
            io.unobserve(entry.target);
          }
        });
      },
      { threshold: 0.15, rootMargin: "0px 0px -10% 0px" }
    );

    items.forEach(function (el) {
      io.observe(el);
    });
  }
})();
