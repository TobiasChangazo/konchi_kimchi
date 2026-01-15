function getCat(){
  const url = new URL(window.location.href);
  return url.searchParams.get("cat") || "";
}

(function init(){
  const cat = getCat();
  activeCategory = cat; // usa tu filtro actual :contentReference[oaicite:4]{index=4}

  // Breadcrumb tipo “Inicio/Picante”
  const crumb = document.getElementById("crumb");
  crumb.textContent = `Inicio/${cat || "Categoría"}`;

  // IMPORTANTÍSIMO: en esta página NO llamamos renderBest()
  renderProducts();      // usa productsGrid :contentReference[oaicite:5]{index=5}
  updateCartUI();
})();
