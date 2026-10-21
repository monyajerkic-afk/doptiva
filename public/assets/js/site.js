(function () {
  'use strict';
  var root = document.documentElement;
  var lang = root.lang === 'en' ? 'en' : 'sl';
  var T = {
    sl: {
      menuOpen: 'Odpri meni', menuClose: 'Zapri meni',
      copied: 'Kopirano', copy: 'Kopiraj',
      sending: 'Pošiljam …',
      ok: 'Hvala. Povpraševanje je poslano. Odgovorimo v dveh delovnih dneh na e-naslov, ki ste ga vpisali.',
      invalid: 'Preverite označena polja: potrebni so ime, veljaven e-naslov, kratek opis in strinjanje z obdelavo podatkov.',
      fail: 'Povpraševanja ni bilo mogoče poslati. Pišite nam neposredno na ',
      preview: 'To je predogled, zato se obrazec ne pošlje. Na objavljeni strani bo povpraševanje prišlo na ',
      slide: 'Fotografija'
    },
    en: {
      menuOpen: 'Open menu', menuClose: 'Close menu',
      copied: 'Copied', copy: 'Copy',
      sending: 'Sending …',
      ok: 'Thank you. Your enquiry has been sent. We reply within two working days to the address you entered.',
      invalid: 'Please check the highlighted fields: name, a valid email, a short description and consent are required.',
      fail: 'The enquiry could not be sent. Please email us directly at ',
      preview: 'This is a preview, so the form is not sent. On the live site your enquiry will reach ',
      slide: 'Photo'
    }
  }[lang];

  // glava ob drsenju
  var header = document.querySelector('.site-header');
  if (header) {
    var onScroll = function () { header.classList.toggle('is-scrolled', window.scrollY > 8); };
    onScroll();
    window.addEventListener('scroll', onScroll, { passive: true });
  }

  // mobilni meni
  var menuBtn = document.querySelector('.menu-toggle');
  var nav = document.getElementById('site-nav');
  if (menuBtn && nav) {
    var setMenu = function (open) {
      nav.classList.toggle('is-open', open);
      menuBtn.setAttribute('aria-expanded', String(open));
      menuBtn.setAttribute('aria-label', open ? T.menuClose : T.menuOpen);
    };
    menuBtn.addEventListener('click', function () { setMenu(menuBtn.getAttribute('aria-expanded') !== 'true'); });
    document.addEventListener('keydown', function (e) { if (e.key === 'Escape') setMenu(false); });
    nav.addEventListener('click', function (e) { if (e.target.closest('a')) setMenu(false); });
  }

  // tema
  var themeBtn = document.querySelector('.theme-toggle');
  if (themeBtn) {
    var current = function () {
      var t = root.getAttribute('data-theme');
      if (t) return t;
      return window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
    };
    var sync = function () { themeBtn.setAttribute('aria-pressed', String(current() === 'dark')); };
    sync();
    themeBtn.addEventListener('click', function () {
      var next = current() === 'dark' ? 'light' : 'dark';
      root.setAttribute('data-theme', next);
      try { localStorage.setItem('doptiva-theme', next); } catch (e) {}
      sync();
    });
  }

  // drsnik fotografij
  document.querySelectorAll('[data-slider]').forEach(function (slider) {
    var track = slider.querySelector('.slider-track');
    var slides = Array.prototype.slice.call(track.children);
    var dots = Array.prototype.slice.call(slider.querySelectorAll('.slider-dot'));
    var prev = slider.querySelector('[data-prev]');
    var next = slider.querySelector('[data-next]');
    var ms = parseInt(slider.getAttribute('data-interval') || '7000', 10);
    var reduce = window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    var index = 0, timer = null, paused = false, visible = true;
    slider.style.setProperty('--slide-ms', ms + 'ms');

    var go = function (i, user) {
      index = (i + slides.length) % slides.length;
      var left = slides[index].offsetLeft - track.offsetLeft;
      track.scrollTo({ left: left, behavior: reduce ? 'auto' : 'smooth' });
      mark();
      if (user) restart();
    };
    var mark = function () {
      dots.forEach(function (d, j) { d.setAttribute('aria-current', j === index ? 'true' : 'false'); });
    };
    var stop = function () { clearTimeout(timer); timer = null; slider.classList.remove('is-playing'); };
    var restart = function () {
      stop();
      if (reduce || paused || !visible || slides.length < 2) return;
      mark();
      void slider.offsetWidth; // ponovno zaženi animacijo napredka
      slider.classList.add('is-playing');
      timer = setTimeout(function () { go(index + 1); restart(); }, ms);
    };

    // sinhronizacija ob ročnem drsenju (dotik, sledilna ploščica)
    var scrollTimer;
    track.addEventListener('scroll', function () {
      clearTimeout(scrollTimer);
      scrollTimer = setTimeout(function () {
        var best = 0, dist = Infinity;
        slides.forEach(function (s, j) {
          var d = Math.abs(s.offsetLeft - track.offsetLeft - track.scrollLeft);
          if (d < dist) { dist = d; best = j; }
        });
        if (best !== index) { index = best; mark(); restart(); }
      }, 120);
    }, { passive: true });

    dots.forEach(function (d, j) { d.addEventListener('click', function () { go(j, true); }); });
    if (prev) prev.addEventListener('click', function () { go(index - 1, true); });
    if (next) next.addEventListener('click', function () { go(index + 1, true); });
    slider.addEventListener('mouseenter', function () { paused = true; stop(); });
    slider.addEventListener('mouseleave', function () { paused = false; restart(); });
    slider.addEventListener('focusin', function () { paused = true; stop(); });
    slider.addEventListener('focusout', function () { paused = false; restart(); });
    track.addEventListener('keydown', function (e) {
      if (e.key === 'ArrowRight') { e.preventDefault(); go(index + 1, true); }
      if (e.key === 'ArrowLeft') { e.preventDefault(); go(index - 1, true); }
    });
    if ('IntersectionObserver' in window) {
      new IntersectionObserver(function (entries) {
        visible = entries[0].isIntersecting;
        visible ? restart() : stop();
      }, { threshold: 0.3 }).observe(slider);
    }
    document.addEventListener('visibilitychange', function () { document.hidden ? stop() : restart(); });
    mark();
    restart();
  });

  // kopiranje e-naslova
  document.querySelectorAll('[data-copy]').forEach(function (btn) {
    btn.addEventListener('click', function () {
      var text = btn.getAttribute('data-copy');
      var done = function () { btn.textContent = T.copied; setTimeout(function () { btn.textContent = T.copy; }, 2000); };
      if (navigator.clipboard && navigator.clipboard.writeText) {
        navigator.clipboard.writeText(text).then(done, function () { selectText(btn.previousElementSibling); });
      } else { selectText(btn.previousElementSibling); }
    });
  });
  function selectText(el) {
    if (!el) return;
    var r = document.createRange(); r.selectNodeContents(el);
    var s = window.getSelection(); s.removeAllRanges(); s.addRange(r);
  }

  // kontaktni obrazec
  var form = document.getElementById('contact-form');
  if (form) {
    var status = document.getElementById('form-status');
    var started = form.querySelector('[name="started"]');
    if (started) started.value = String(Date.now());
    var email = form.getAttribute('data-email');
    var show = function (state, msg, withEmail) {
      status.hidden = false;
      status.setAttribute('data-state', state);
      status.textContent = msg;
      if (withEmail) {
        var a = document.createElement('a');
        a.href = 'mailto:' + email; a.textContent = email;
        status.appendChild(a); status.appendChild(document.createTextNode('.'));
      }
      status.focus();
    };
    if (/[?&](poslano|sent)=1/.test(location.search)) show('ok', T.ok);
    form.addEventListener('submit', function (e) {
      e.preventDefault();
      var fields = ['name', 'email', 'message'];
      var bad = false;
      fields.forEach(function (n) {
        var el = form.elements[n];
        var ok = el.checkValidity() && el.value.trim().length > 0;
        el.setAttribute('aria-invalid', ok ? 'false' : 'true');
        if (!ok) bad = true;
      });
      var consent = form.elements.consent;
      consent.setAttribute('aria-invalid', consent.checked ? 'false' : 'true');
      if (!consent.checked) bad = true;
      if (bad) { show('error', T.invalid); return; }

      if (root.hasAttribute('data-preview')) { show('ok', T.preview, true); return; }

      var btn = form.querySelector('button[type="submit"]');
      var label = btn.textContent;
      btn.disabled = true; btn.textContent = T.sending;
      var data = {};
      new FormData(form).forEach(function (v, k) { data[k] = typeof v === 'string' ? v : ''; });
      data.lang = lang;
      fetch('/api/contact', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data)
      }).then(function (res) {
        if (!res.ok) throw new Error('HTTP ' + res.status);
        form.reset();
        show('ok', T.ok);
      }).catch(function () {
        show('error', T.fail, true);
      }).finally(function () {
        btn.disabled = false; btn.textContent = label;
      });
    });
  }
})();
