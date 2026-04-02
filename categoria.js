function getCat() {
  const url = new URL(window.location.href);
  return url.searchParams.get("cat") || "";
}

function escCrumb(str) {
  return String(str || "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;");
}

(function init() {
  const cat = getCat();
  activeCategory = cat;

  const crumb = document.getElementById("crumb");
  const titleEl = document.getElementById("categoryTitle");
  if (titleEl) {
    titleEl.textContent = cat || "Productos";
  }
  crumb.innerHTML = `<a href="index.html">Inicio</a><span>/</span>${escCrumb(cat || "Categoría")}`;

  renderProducts();
  updateCartUI();
})();
