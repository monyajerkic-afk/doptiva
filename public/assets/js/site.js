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
      tooFast: 'Obrazec je bil oddan prehitro, zato ga nismo poslali. Počakajte nekaj sekund in kliknite znova.',
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
      tooFast: 'The form was submitted too quickly, so it was not sent. Please wait a few seconds and click again.',
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

  var reduce = window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  // opazovanje vidnosti: animacije tečejo le, ko je element na zaslonu
  function watch(el, onChange) {
    if (!('IntersectionObserver' in window)) { onChange(true); return; }
    new IntersectionObserver(function (entries) { onChange(entries[0].isIntersecting); }, { threshold: 0.25 }).observe(el);
  }
  document.querySelectorAll('[data-animate]').forEach(function (el) {
    watch(el, function (v) { if (v) el.classList.add('is-visible'); });
  });

  // trak ploščic, ki se sam premika
  document.querySelectorAll('[data-marquee]').forEach(function (m) {
    if (reduce) return;
    var track = m.querySelector('.marquee-track');
    var originals = Array.prototype.slice.call(track.children);
    originals.forEach(function (n) {
      var c = n.cloneNode(true);
      c.setAttribute('aria-hidden', 'true');
      c.querySelectorAll('a, button').forEach(function (a) { a.setAttribute('tabindex', '-1'); });
      c.querySelectorAll('img').forEach(function (img) { img.setAttribute('alt', ''); });
      track.appendChild(c);
    });
    var setSpeed = function () {
      var half = track.scrollWidth / 2;
      m.style.setProperty('--marquee-duration', Math.max(30, Math.round(half / 38)) + 's');
    };
    setSpeed();
    window.addEventListener('resize', setSpeed);
    m.classList.add('is-running');
    var section = m.closest('section');
    var btn = section && section.querySelector('[data-marquee-toggle]');
    var userPaused = false;
    if (btn) {
      btn.hidden = false;
      btn.addEventListener('click', function () {
        userPaused = !userPaused;
        btn.setAttribute('aria-pressed', String(userPaused));
        btn.querySelector('[data-label-pause]').hidden = userPaused;
        btn.querySelector('[data-label-play]').hidden = !userPaused;
        m.classList.toggle('is-paused', userPaused);
      });
    }
    watch(m, function (v) { m.classList.toggle('is-paused', userPaused || !v); });
  });

  // ponavljajoče se tihe animacije (koraki, Refilo, Terto)
  function loop(el, ms, tick) {
    if (reduce) return;
    var timer = null;
    watch(el, function (v) {
      clearInterval(timer); timer = null;
      if (v && !document.hidden) { tick(); timer = setInterval(tick, ms); }
    });
  }

  document.querySelectorAll('[data-steps]').forEach(function (ol) {
    var items = ol.querySelectorAll('.step'), i = -1;
    loop(ol, 2600, function () {
      if (items[i]) items[i].classList.remove('is-active');
      i = (i + 1) % items.length;
      items[i].classList.add('is-active');
    });
  });

  document.querySelectorAll('[data-refilo]').forEach(function (ui) {
    var chip = ui.querySelector('[data-cycle]');
    var row = ui.querySelector('[data-cycle-row]');
    var flow = ui.querySelectorAll('.ui-flow span');
    if (!chip) return;
    var states = JSON.parse(chip.getAttribute('data-cycle')), i = 0;
    loop(ui, 2200, function () {
      i = (i + 1) % states.length;
      chip.textContent = states[i][0];
      chip.className = 'st st-' + states[i][1];
      flow.forEach(function (f, k) { f.classList.toggle('is-current', k === i); });
      row.classList.add('is-changing');
      setTimeout(function () { row.classList.remove('is-changing'); }, 700);
    });
  });

  document.querySelectorAll('[data-terto]').forEach(function (ui) {
    var steps = ui.querySelectorAll('[data-tstep]'), i = -1;
    var btn = ui.querySelector('[data-sent]');
    var label = btn ? btn.textContent : '';
    loop(ui, 1400, function () {
      if (steps[i]) steps[i].classList.remove('is-focus');
      if (btn) { btn.classList.remove('is-sent'); btn.textContent = label; }
      i = (i + 1) % (steps.length + 1);
      if (i === steps.length) { if (btn) { btn.classList.add('is-sent'); btn.textContent = btn.getAttribute('data-sent') + ' \u2713'; } return; }
      steps[i].classList.add('is-focus');
    });
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
    var openedAt = Date.now();
    var elapsedField = form.querySelector('[name="elapsed"]');
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
      if (elapsedField) elapsedField.value = String(Date.now() - openedAt);
      var data = {};
      new FormData(form).forEach(function (v, k) { data[k] = typeof v === 'string' ? v : ''; });
      data.lang = lang;
      fetch('/api/contact', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data)
      }).then(function (res) {
        if (res.ok) { form.reset(); openedAt = Date.now(); show('ok', T.ok); return; }
        return res.json().catch(function () { return {}; }).then(function (j) {
          if (j && j.error === 'too_fast') show('error', T.tooFast);
          else show('error', T.fail, true);
        });
      }).catch(function () {
        show('error', T.fail, true);
      }).finally(function () {
        btn.disabled = false; btn.textContent = label;
      });
    });
  }
})();
