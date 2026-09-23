/* Light/dark toggle. Same storage key and behaviour as the landing page and the
   Letterboxd tool so the choice carries across the whole catalog. */
(function () {
  var KEY = "theme";
  var root = document.documentElement;

  function read() {
    try {
      var stored = localStorage.getItem(KEY);
      if (stored === "light" || stored === "dark") return stored;
    } catch (e) {
      /* private mode */
    }
    return window.matchMedia("(prefers-color-scheme: dark)").matches ? "dark" : "light";
  }

  function apply(theme) {
    root.dataset.theme = theme;
    try {
      localStorage.setItem(KEY, theme);
    } catch (e) {
      /* private mode */
    }
    var btn = document.getElementById("theme-toggle");
    if (btn) {
      var dark = theme === "dark";
      btn.setAttribute("aria-pressed", dark ? "true" : "false");
      btn.textContent = dark ? "Light" : "Dark";
    }
  }

  apply(read());
  var btn = document.getElementById("theme-toggle");
  if (btn) {
    btn.addEventListener("click", function () {
      apply(root.dataset.theme === "dark" ? "light" : "dark");
    });
  }
})();
