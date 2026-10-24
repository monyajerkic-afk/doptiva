// Resolve the preferred theme before the first render to avoid mismatched dark colors.
// Explicit user preference wins; otherwise follow the operating-system preference.
(function () {
  var root = document.documentElement;
  var media = window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)');
  function preference() {
    try {
      var saved = localStorage.getItem('doptiva-theme');
      if (saved === 'light' || saved === 'dark') return saved;
    } catch (e) {}
    return null;
  }
  function apply() {
    root.setAttribute('data-theme', preference() || (media && media.matches ? 'dark' : 'light'));
  }
  apply();
  if (media && media.addEventListener) {
    media.addEventListener('change', function () {
      if (!preference()) apply();
    });
  }
})();
