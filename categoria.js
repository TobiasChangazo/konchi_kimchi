function getCat(){
  const url = new URL(window.location.href);
  return url.searchParams.get("cat") || "";
}

(function init(){
  const cat = getCat();
  activeCategory = cat;

  const crumb = document.getElementById("crumb");
  crumb.innerHTML = `<a href="index.html">Inicio</a> / ${cat || "Categoría"}`;

  renderProducts();     
  updateCartUI();
})();
