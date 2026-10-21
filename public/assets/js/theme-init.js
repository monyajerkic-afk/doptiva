// Naloži izbrano temo pred izrisom strani, da ni utripanja.
(function () {
  try {
    var t = localStorage.getItem('doptiva-theme');
    if (t === 'light' || t === 'dark') document.documentElement.setAttribute('data-theme', t);
  } catch (e) {}
})();
