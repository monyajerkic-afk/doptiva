// Dark is the default Doptiva V4 experience. A visitor's explicit choice wins.
(function () {
  var root = document.documentElement;
  var themeColor = document.querySelector('meta[name="theme-color"]');
  var selected = null;
  try {
    var saved = localStorage.getItem('doptiva-theme');
    if (saved === 'light' || saved === 'dark') selected = saved;
  } catch (e) {}
  var theme = selected || 'dark';
  root.setAttribute('data-theme', theme);
  if (themeColor) {
    var color = themeColor.getAttribute(theme === 'dark' ? 'data-dark-color' : 'data-light-color');
    if (color) themeColor.setAttribute('content', color);
  }
})();
