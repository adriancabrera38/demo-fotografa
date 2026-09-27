(function () {
  "use strict";

  var data = window.__BRAND__ || {};
  var $ = function (sel, scope) { return (scope || document).querySelector(sel); };
  var $$ = function (sel, scope) { return Array.prototype.slice.call((scope || document).querySelectorAll(sel)); };
  var reduced = matchMedia("(prefers-reduced-motion: reduce)").matches;
  var fineHover = matchMedia("(hover: hover) and (pointer: fine)").matches;
  var body = document.body;

  function safe(fn, name) { try { fn(); } catch (e) { console.warn("[" + name + "]", e); } }
  function onScroll(fn) {
    var t = false;
    window.addEventListener("scroll", function () { if (!t) { t = true; requestAnimationFrame(function () { t = false; fn(); }); } }, { passive: true });
    fn();
  }
  function pad(n) { return String(n).padStart(2, "0"); }
  function eur(n) { return String(Math.round(n)).replace(/\B(?=(\d{3})+(?!\d))/g, ".") + " €"; }

  /* 1. Nav + menú ------------------------------------------------ */
  function initNav() {
    var nav = $("[data-nav]");
    if (nav) onScroll(function () { nav.classList.toggle("is-scrolled", scrollY > 30); });
    var b = $(".burger"), m = $("#menu");
    if (!b || !m) return;
    function set(open) {
      b.setAttribute("aria-expanded", String(open));
      b.setAttribute("aria-label", open ? "Cerrar menú" : "Abrir menú");
      m.classList.toggle("is-open", open);
      m.setAttribute("aria-hidden", String(!open));
      document.documentElement.style.overflow = open ? "hidden" : "";
    }
    b.addEventListener("click", function () { set(b.getAttribute("aria-expanded") !== "true"); });
    document.addEventListener("keydown", function (e) { if (e.key === "Escape") set(false); });
  }

  /* 2. Cursor "Ver" sobre las fotos (solo ratón) ---------------- */
  function initCursor() {
    var c = $(".cursor");
    if (!c || !fineHover) return;
    var ring = $(".ring", c), x = 0, y = 0, rx = 0, ry = 0, first = false, raf = null;
    function loop() {
      rx += (x - rx) * 0.2; ry += (y - ry) * 0.2;
      c.style.transform = "translate3d(" + rx.toFixed(1) + "px," + ry.toFixed(1) + "px,0)";
      raf = Math.abs(x - rx) + Math.abs(y - ry) > 0.2 ? requestAnimationFrame(loop) : null;
    }
    window.addEventListener("mousemove", function (e) {
      x = e.clientX; y = e.clientY;
      if (!first) { first = true; rx = x; ry = y; c.classList.add("is-ready"); }
      if (!raf) raf = requestAnimationFrame(loop);
    }, { passive: true });
    document.addEventListener("mouseover", function (e) {
      var v = e.target.closest("[data-cursor='view']");
      var l = !v && e.target.closest("a, button");
      c.classList.toggle("is-view", !!v);
      c.classList.toggle("is-link", !!l);
    });
    document.addEventListener("mouseleave", function () { c.classList.remove("is-ready"); first = false; });
    void ring;
  }

  /* 3. Firma: portada con fotos que se alternan ------------------ */
  function initSlideshow() {
    var root = $("[data-slideshow]");
    if (!root) return;
    var slides = $$(".slide", root), dots = $$(".dots button"), counter = $("[data-count]"), exif = $("[data-slide-exif]"), title = $("[data-slide-title]");
    var i = 0, timer = null, DUR = 6000;
    function go(n) {
      slides[i].classList.remove("is-active");
      dots.forEach(function (d, k) { d.classList.toggle("is-done", k < n); d.classList.remove("is-active"); });
      i = (n + slides.length) % slides.length;
      if (i === 0) dots.forEach(function (d) { d.classList.remove("is-done"); });
      slides[i].classList.add("is-active");
      void dots[i].offsetWidth; // reinicia la animación de la barra
      dots[i].classList.add("is-active");
      if (counter) counter.innerHTML = "<b>" + pad(i + 1) + "</b> / " + pad(slides.length);
      if (exif) exif.textContent = slides[i].getAttribute("data-exif") || "";
      if (title) title.textContent = slides[i].getAttribute("data-title") || "";
      clearTimeout(timer);
      timer = setTimeout(function () { go(i + 1); }, DUR);
    }
    dots.forEach(function (d, k) { d.addEventListener("click", function () { go(k); }); });
    document.addEventListener("visibilitychange", function () {
      if (document.hidden) clearTimeout(timer); else timer = setTimeout(function () { go(i + 1); }, DUR);
    });
    go(0);
  }

  /* 4. Reveals --------------------------------------------------- */
  function initReveals() {
    var items = $$("[data-reveal]");
    if (!items.length) return;
    if (!("IntersectionObserver" in window)) { items.forEach(function (el) { el.classList.add("is-revealed"); }); return; }
    var io = new IntersectionObserver(function (entries) {
      entries.forEach(function (e) { if (e.isIntersecting) { e.target.classList.add("is-revealed"); io.unobserve(e.target); } });
    }, { threshold: 0.01, rootMargin: "0px 0px -5% 0px" });
    items.forEach(function (el) { io.observe(el); });
    setTimeout(function () {
      $$("[data-reveal]:not(.is-revealed)").forEach(function (el) { if (el.getBoundingClientRect().top < innerHeight) el.classList.add("is-revealed"); });
    }, 6000);
  }

  /* 5. Testimonios ---------------------------------------------- */
  function initQuotes() {
    var root = $("[data-quotes]");
    if (!root) return;
    var items = $$(".q-item", root), dots = $$(".quote-nav button", root), i = 0, t;
    function show(n) {
      i = (n + items.length) % items.length;
      items.forEach(function (q, k) { q.classList.toggle("is-active", k === i); });
      dots.forEach(function (d, k) { d.setAttribute("aria-current", String(k === i)); });
      clearTimeout(t); t = setTimeout(function () { show(i + 1); }, 8000);
    }
    dots.forEach(function (d, k) { d.addEventListener("click", function () { show(k); }); });
    show(0);
  }

  /* 6. Portafolio: filtros + visor a pantalla completa ---------- */
  function initPortfolio() {
    var grid = $("[data-works]");
    if (!grid) return;
    var works = $$(".work", grid), btns = $$(".filters button");
    var current = "todo";
    function visible() { return works.filter(function (w) { return !w.hidden; }); }
    function filter(cat) {
      current = cat;
      btns.forEach(function (b) { b.setAttribute("aria-pressed", String(b.dataset.filter === cat)); });
      var n = 0;
      works.forEach(function (w) {
        var show = cat === "todo" || w.dataset.cat === cat;
        w.hidden = !show;
        w.classList.remove("is-entering");
        if (show) { void w.offsetWidth; w.style.setProperty("--d", Math.min(n, 12) * 40 + "ms"); w.classList.add("is-entering"); n++; }
      });
      if (history.replaceState) history.replaceState(null, "", cat === "todo" ? location.pathname : "#" + cat);
    }
    btns.forEach(function (b) { b.addEventListener("click", function () { filter(b.dataset.filter); }); });
    function fromHash() {
      var h = location.hash.replace("#", "");
      if (h && h !== current && btns.some(function (b) { return b.dataset.filter === h; })) filter(h);
    }
    fromHash();
    window.addEventListener("hashchange", fromHash);

    // Visor
    var lb = $("[data-lightbox]"), img = $(".lb-stage img", lb);
    var lbTitle = $("[data-lb-title]", lb), lbExif = $("[data-lb-exif]", lb), lbCount = $("[data-lb-count]", lb), lbCat = $("[data-lb-cat]", lb);
    var idx = 0, list = [], lastFocus = null;
    function render() {
      var w = list[idx], im = $("img", w);
      img.classList.add("is-swapping");
      setTimeout(function () {
        img.src = im.currentSrc || im.src; img.alt = im.alt;
        img.classList.remove("is-swapping");
      }, 180);
      lbTitle.textContent = w.dataset.title;
      lbExif.textContent = w.dataset.exif;
      lbCat.textContent = w.dataset.catLabel;
      lbCount.textContent = pad(idx + 1) + " / " + pad(list.length);
      // precarga la siguiente
      var nx = list[(idx + 1) % list.length]; if (nx) { var p = new Image(); p.src = $("img", nx).src; }
    }
    function open(w) {
      list = visible(); idx = Math.max(0, list.indexOf(w));
      lastFocus = document.activeElement;
      lb.classList.add("is-open"); lb.setAttribute("aria-hidden", "false");
      document.documentElement.style.overflow = "hidden";
      render();
      $(".lb-close", lb).focus();
    }
    function close() {
      lb.classList.remove("is-open"); lb.setAttribute("aria-hidden", "true");
      document.documentElement.style.overflow = "";
      if (lastFocus) lastFocus.focus();
    }
    function step(d) { idx = (idx + d + list.length) % list.length; render(); }
    works.forEach(function (w) { w.addEventListener("click", function () { open(w); }); });
    $(".lb-close", lb).addEventListener("click", close);
    $(".lb-prev", lb).addEventListener("click", function () { step(-1); });
    $(".lb-next", lb).addEventListener("click", function () { step(1); });
    lb.addEventListener("click", function (e) { if (e.target === lb || e.target.classList.contains("lb-stage")) close(); });
    document.addEventListener("keydown", function (e) {
      if (!lb.classList.contains("is-open")) return;
      if (e.key === "Escape") close();
      else if (e.key === "ArrowRight") step(1);
      else if (e.key === "ArrowLeft") step(-1);
      else if (e.key === "Tab") { // mantiene el foco dentro del visor
        var f = $$("button", lb), first = f[0], last = f[f.length - 1];
        if (e.shiftKey && document.activeElement === first) { e.preventDefault(); last.focus(); }
        else if (!e.shiftKey && document.activeElement === last) { e.preventDefault(); first.focus(); }
      }
    });
    var sx = null;
    var stage = $(".lb-stage", lb);
    stage.addEventListener("touchstart", function (e) { sx = e.touches[0].clientX; }, { passive: true });
    stage.addEventListener("touchend", function (e) {
      if (sx === null) return;
      var dx = e.changedTouches[0].clientX - sx; sx = null;
      if (Math.abs(dx) > 50) step(dx < 0 ? 1 : -1);
    });
  }

  /* 7. Presupuesto orientativo en el formulario ----------------- */
  function initQuote() {
    var form = $("[data-quote-form]");
    if (!form || !data.quote) return;
    var out = $("[data-estimate]"), note = $("[data-estimate-note]");
    var q = /tipo=([a-z]+)/.exec(location.search);
    if (q) { var r = form.querySelector('input[name="tipo"][value="' + q[1] + '"]'); if (r) r.checked = true; }
    function update() {
      var t = (form.querySelector('input[name="tipo"]:checked') || {}).value;
      var s = data.quote[t];
      if (!s) { out.textContent = "—"; note.textContent = "Elige un tipo de sesión para ver un precio orientativo."; return; }
      var hours = +(form.elements.horas && form.elements.horas.value) || 0;
      var total = s.base + hours * s.perHour;
      $$('input[name="extra"]:checked', form).forEach(function (x) { total += data.extras[x.value] || 0; });
      out.textContent = "desde " + eur(total);
      note.textContent = s.label + " · " + s.unit + (hours && s.perHour ? " + " + hours + " h extra" : "") + ". IVA no incluido.";
      var hf = $("[data-hours-field]", form);
      if (hf) hf.hidden = !s.perHour;
    }
    form.addEventListener("change", update);
    form.addEventListener("input", update);
    update();
  }

  /* 8. Formulario (demo) ---------------------------------------- */
  function initForms() {
    $$("[data-demo-form]").forEach(function (form) {
      if (form.dataset.bound) return;
      form.dataset.bound = "1";
      var success = form.parentElement.querySelector("[data-success]");
      form.addEventListener("submit", function (e) {
        e.preventDefault();
        var ok = true;
        $$("[required]", form).forEach(function (el) {
          var v = el.value.trim(), msg = "";
          if (!v) msg = "Campo obligatorio";
          else if (el.type === "email" && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v)) msg = "Email no válido";
          var w = el.closest(".field"); w.classList.toggle("is-invalid", !!msg); $(".err", w).textContent = msg;
          if (msg) ok = false;
        });
        if (!form.querySelector('input[name="tipo"]:checked')) { ok = false; var te = $("[data-tipo-err]", form); if (te) te.textContent = "Elige un tipo de sesión"; }
        if (!ok) { var bad = $(".is-invalid input", form); if (bad) bad.focus(); return; }
        var b = $("button[type=submit]", form); b.disabled = true; b.firstChild.nodeValue = "Enviando… ";
        setTimeout(function () {
          form.hidden = true;
          var n = $("[data-name]", success); if (n) n.textContent = form.elements.nombre.value.trim().split(" ")[0];
          var est = $("[data-success-est]", success); var e = $("[data-estimate]"); if (est && e) est.textContent = e.textContent;
          success.classList.add("is-visible");
          success.setAttribute("tabindex", "-1"); success.focus({ preventScroll: true });
          window.scrollTo({ top: success.getBoundingClientRect().top + scrollY - 150, behavior: reduced ? "auto" : "smooth" });
        }, 900);
      });
    });
  }

  /* Arranque ---------------------------------------------------- */
  function boot() {
    safe(initNav, "initNav");
    safe(initCursor, "initCursor");
    safe(initSlideshow, "initSlideshow");
    safe(initReveals, "initReveals");
    safe(initQuotes, "initQuotes");
    safe(initPortfolio, "initPortfolio");
    safe(initQuote, "initQuote");
    safe(initForms, "initForms");
    if (window.gsap && window.ScrollTrigger) { try { gsap.registerPlugin(ScrollTrigger); } catch (_) {} }
    window.__KB_OK = true;
    requestAnimationFrame(function () { requestAnimationFrame(function () { body.classList.add("is-loaded"); }); });
  }
  if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", boot);
  else boot();
})();
