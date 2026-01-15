// app.js
const products = window.KIMCHI_PRODUCTS || [];

const $ = (sel) => document.querySelector(sel);
const $$ = (sel) => document.querySelectorAll(sel);

const catsEl = $("#cats");
const bestGrid = $("#bestGrid");
const productsGrid = $("#productsGrid");
const searchInput = $("#searchInput");

const menuBtn = $("#menuBtn");
const drawer = $("#drawer");

const cartBtn = $("#cartBtn");
const cartModal = $("#cartModal");
const cartClose = $("#cartClose");
const cartItems = $("#cartItems");
const cartCount = $("#cartCount");
const cartTotal = $("#cartTotal"); // puede ser null ahora
const cartTotal2 = $("#cartTotal2");
const cartCheckoutBtn = $("#cartCheckoutBtn");
const checkoutBtn = $("#checkoutBtn");

// product modal
const productModal = $("#productModal");
const modalClose = $("#modalClose");
const modalImg = $("#modalImg");
const modalTitle = $("#modalTitle");
const modalPrice = $("#modalPrice");
const modalDesc = $("#modalDesc");
const modalAddBtn = $("#modalAddBtn");

let activeCategory = null;
let modalProduct = null;

const CATEGORY_META = [
  { name: "Promo", special: true,  img: "url('img/cats/promos.PNG')" },
  { name: "Picante",  special: false, img: "url('img/cats/picantetest.PNG')" },
  { name: "Sin picante", special: false, img: "url('img/cats/sinpicante.PNG')" },
  { name: "Especiales", special: false, img: "url('img/cats/especiales.PNG')" },
  { name: "Salsas",   special: false, img: "url('img/cats/salsas.PNG')" },
];


// --- Cart state ---
const CART_KEY = "kimchi_cart_v1";
let cart = loadCart(); // { [id]: qty }

function loadCart(){
  try{
    const raw = localStorage.getItem(CART_KEY);
    return raw ? JSON.parse(raw) : {};
  }catch{
    return {};
  }
}
function saveCart(){
  localStorage.setItem(CART_KEY, JSON.stringify(cart));
}

function money(n){
  // simple ARS formatting
  return "$" + (n || 0).toLocaleString("es-AR");
}

function getProductById(id){
  return products.find(p => p.id === id);
}

function cartSummary(){
  let count = 0;
  let total = 0;
  for (const [id, qty] of Object.entries(cart)){
    const p = getProductById(id);
    if (!p) continue;
    count += qty;
    total += p.price * qty;
  }
  return { count, total };
}

function updateCartUI(){
  const { count, total } = cartSummary();
  cartCount.textContent = String(count);
  cartTotal2.textContent = money(total);
  if (cartTotal) cartTotal.textContent = money(total);

  // items
  cartItems.innerHTML = "";
  const entries = Object.entries(cart).filter(([_,q]) => q > 0);

  if (!entries.length){
    cartItems.innerHTML = `<div class="tip">Tu carrito está vacío.</div>`;
    return;
  }

  for (const [id, qty] of entries){
    const p = getProductById(id);
    if (!p) continue;

    const row = document.createElement("div");
    row.className = "cart__item";
    row.innerHTML = `
      <div>
        <div class="cart__name">${escapeHtml(p.name)}</div>
        <div class="cart__mini">${money(p.price)} c/u</div>
      </div>
      <div class="qty">
        <button data-act="dec" data-id="${p.id}">−</button>
        <strong>${qty}</strong>
        <button data-act="inc" data-id="${p.id}">+</button>
      </div>
    `;
    cartItems.appendChild(row);
  }
}

function addToCart(id, qty=1){
  cart[id] = (cart[id] || 0) + qty;
  if (cart[id] <= 0) delete cart[id];
  saveCart();
  updateCartUI();
}

function escapeHtml(str){
  return String(str)
    .replaceAll("&","&amp;")
    .replaceAll("<","&lt;")
    .replaceAll(">","&gt;")
    .replaceAll('"',"&quot;")
    .replaceAll("'","&#039;");
}

function setHash(params){
  const qs = new URLSearchParams(params);
  location.hash = qs.toString();
}

function getRoute(){
  const qs = new URLSearchParams((location.hash || "").replace("#",""));
  const cat = qs.get("cat");
  const pid = qs.get("p");
  return { cat, pid };
}

function renderCrumb(){
  const crumb = document.getElementById("crumb");
  if (!crumb) return;

  const { cat, pid } = getRoute();

  // Inicio
  if (!cat && !pid){
    crumb.innerHTML = "";
    return;
  }

  // Inicio/Categoria
  if (cat && !pid){
    crumb.innerHTML = `<a href="#top" onclick="location.hash='';return false;">Inicio</a> / ${escapeHtml(cat)}`;
    return;
  }

  // Inicio/Categoria/Producto
  if (cat && pid){
    const p = getProductById(pid);
    const pname = p ? p.name : "Producto";
    crumb.innerHTML =
      `<a href="#top" onclick="location.hash='';return false;">Inicio</a> / ` +
      `<a href="#catalogo" onclick="location.hash='cat=${encodeURIComponent(cat)}';return false;">${escapeHtml(cat)}</a> / ` +
      `${escapeHtml(pname)}`;
  }
}

// --- Drawer ---
if (menuBtn && drawer){
  menuBtn.addEventListener("click", () => {
    const isOpen = drawer.classList.toggle("is-open");
    menuBtn.setAttribute("aria-expanded", String(isOpen));
    drawer.setAttribute("aria-hidden", String(!isOpen));
  });

  drawer.addEventListener("click", (e) => {
    if (e.target.matches("a")){
      drawer.classList.remove("is-open");
      menuBtn.setAttribute("aria-expanded","false");
      drawer.setAttribute("aria-hidden","true");
    }
  });
}

// --- Modal helpers ---
function openModal(el){
  el.classList.add("is-open");
  el.setAttribute("aria-hidden", "false");
}
function closeModal(el){
  el.classList.remove("is-open");
  el.setAttribute("aria-hidden", "true");
}

document.addEventListener("click", (e) => {
  const overlay = e.target.closest("[data-close='1']");
  if (overlay){
    closeModal(productModal);
    closeModal(cartModal);
  }
});

// Product modal open
function openProductModal(p){
  modalProduct = p;
  modalTitle.textContent = p.name;
  modalPrice.textContent = money(p.price);
  modalDesc.textContent = p.long || p.short || "";
  modalImg.style.backgroundImage = p.image ? `url('${p.image}')` : "";
  modalImg.style.backgroundSize = p.image ? "cover" : "";
  modalImg.style.backgroundPosition = "center";

const extra = document.getElementById("modalExtra");
if (!extra) return;

const info = p.info || {};
let html = "";

/* Tiempo de fermentación */
if (info.fermentacion){
  html += `
    <h4>Tiempo de fermentación</h4>
    <div style="margin-bottom:10px;">${escapeHtml(info.fermentacion)}</div>
  `;
}

/* Nivel de picante (🔥) */
if (typeof info.nivelPicante === "number"){
  const flames = `<span style="font-size:18px;">${"🔥".repeat(info.nivelPicante)}</span>`;
  html += `
    <h4>Nivel de picante</h4>
    <div style="margin-bottom:10px;">${flames}</div>
  `;
}

/* Beneficios */
if (Array.isArray(info.beneficios) && info.beneficios.length){
  html += `
    <h4>Beneficios</h4>
    <ul>
      ${info.beneficios.map(b => `<li>${escapeHtml(b)}</li>`).join("")}
    </ul>
  `;
}

extra.innerHTML = html;


  openModal(productModal);
}

modalClose.addEventListener("click", () => closeModal(productModal));
modalAddBtn.addEventListener("click", () => {
  if (!modalProduct) return;
  addToCart(modalProduct.id, 1);
  closeModal(productModal);
});

// Cart modal
cartBtn.addEventListener("click", () => openModal(cartModal));
cartClose.addEventListener("click", () => closeModal(cartModal));
cartItems.addEventListener("click", (e) => {
  const btn = e.target.closest("button[data-act]");
  if (!btn) return;
  const id = btn.dataset.id;
  const act = btn.dataset.act;
  if (act === "inc") addToCart(id, 1);
  if (act === "dec") addToCart(id, -1);
});

// --- Categories / Render ---

function renderCategories(){
  catsEl.innerHTML = "";

  CATEGORY_META.forEach((c) => {
    const div = document.createElement("div");

    div.className =
      "cat" +
      (c.special ? " cat--special" : "") +
      (activeCategory === c.name ? " is-active" : "");

    div.style.setProperty("--cat-img", c.img);

    div.innerHTML = `<div class="cat__name">${escapeHtml(c.name)}</div>`;

    div.addEventListener("click", () => {
      window.location.href = `categoria.html?cat=${encodeURIComponent(c.name)}`;
    });

    catsEl.appendChild(div);
  });
}

function matchesFilters(p){
  const q = ((searchInput && searchInput.value) ? searchInput.value : "").trim().toLowerCase();
  const byCat = !activeCategory || p.category === activeCategory;
  const bySearch = !q || p.name.toLowerCase().includes(q);

  return byCat && bySearch;
}

function productCard(p){
  const el = document.createElement("div");
  el.className = "card";

  const imgStyle = p.image
    ? `background-image:url('${p.image}');background-size:cover;background-position:center;`
    : "";

  const isCategoryPage = document.body.classList.contains("page-category");

  if (isCategoryPage){
    const imgStyle = p.image
    ? `background-image:url('${p.image}');`
    : "";
    el.innerHTML = `
      <div class="card__img" style="${imgStyle}"></div>
      <div class="card__body">
        <div class="card__title">${escapeHtml(p.name)}</div>
        <div class="card__desc">${escapeHtml(p.short || "")}</div>
        <div class="card__price">${money(p.price)} <span style="font-weight:700; opacity:.7">c/u</span></div>
        <button class="btn" data-add="${p.id}">AGREGAR AL 🛒</button>
      </div>
    `;

    // En categoría: al tocar abre el modal (si querés después lo hacemos pantalla producto)
    el.querySelector(".card__img").addEventListener("click", () => openProductModal(p));
    el.querySelector(".card__title").addEventListener("click", () => openProductModal(p));
    el.querySelector("[data-add]").addEventListener("click", () => addToCart(p.id, 1));

    return el;
  }

  // Layout normal (inicio / más vendidos)
  el.innerHTML = `
    <div class="card__img" style="${imgStyle}"></div>
    <div class="card__body">
      <div class="card__row">
        <div class="card__title">${escapeHtml(p.name)}</div>
        <div class="card__price">${money(p.price)}</div>
      </div>
      <div class="card__desc">${escapeHtml(p.short || "")}</div>
      <button class="btn btn--primary" data-add="${p.id}">Agregar</button>
    </div>
  `;

  el.querySelector(".card__img").addEventListener("click", () => {
    setHash({ cat: p.category, p: p.id });
  });
  el.querySelector(".card__title").addEventListener("click", () => {
    setHash({ cat: p.category, p: p.id });
  });
  el.querySelector("[data-add]").addEventListener("click", () => addToCart(p.id, 1));

  return el;
}


function renderBest(){
  if (!bestGrid) return;

  const bestEmpty = document.getElementById("bestEmpty");
  bestGrid.innerHTML = "";

  const best = products
    .filter(p => p.bestSeller)
    .filter(matchesFilters)
    .slice(0, 8);

  if (!best.length){
    if (bestEmpty) bestEmpty.style.display = "block";
    return;
  }

  if (bestEmpty) bestEmpty.style.display = "none";
  best.forEach(p => bestGrid.appendChild(productCard(p)));
}


function renderProducts(){
  productsGrid.innerHTML = "";
  const list = products.filter(matchesFilters);
  if (!list.length){
    productsGrid.innerHTML = `<div class="tip">No se encontraron productos.</div>`;
    return;
  }
  list.forEach(p => productsGrid.appendChild(productCard(p)));
}

const yearEl = document.getElementById("copyYear");
if (yearEl) yearEl.textContent = new Date().getFullYear();

window.addEventListener("hashchange", renderAll);

function renderAll(){
  const { cat, pid } = getRoute();

  // Estado por ruta
  activeCategory = cat || null;

  renderCategories();
  renderCrumb();

  // Si estoy en producto, abro modal y muestro lista de su categoría abajo
  if (pid){
    const p = getProductById(pid);
    if (p) openProductModal(p);
  }

  // En Inicio: muestro Más vendidos + (opcional) todos los productos
  // En Categoría: muestro lista de esa categoría (productsGrid)
  renderBest();
  renderProducts();

  updateCartUI();
}


if (searchInput) searchInput.addEventListener("input", () => renderAll());

// --- Slider simple (fase 2 ya está, pero lo dejamos andando) ---
let bannerIndex = 0;

function bannerInit(){
  const slides = $$("#bannerTrack .banner__slide");
  const dots = $$("#bannerDots .dot");
  if (!slides.length) return;

  function show(i){
    slides.forEach(s => s.classList.remove("is-active"));
    dots.forEach(d => d.classList.remove("is-active"));
    bannerIndex = (i + slides.length) % slides.length;
    slides[bannerIndex].classList.add("is-active");
    if (dots[bannerIndex]) dots[bannerIndex].classList.add("is-active");
  }

  const btnL = document.querySelector(".banner__arrow--left");
  const btnR = document.querySelector(".banner__arrow--right");
  if (btnL) btnL.addEventListener("click", () => show(bannerIndex - 1));
  if (btnR) btnR.addEventListener("click", () => show(bannerIndex + 1));

  // auto
  setInterval(() => show(bannerIndex + 1), 5000);

  show(0);
}

bannerInit();

// --- WhatsApp checkout (por ahora placeholder) ---
function buildWhatsAppMessage(){
  const entries = Object.entries(cart).filter(([_,q]) => q > 0);
  if (!entries.length) return "Hola! Quiero hacer un pedido.\n\n(El carrito está vacío)";
  let msg = "Hola! Quiero hacer un pedido:\n\n";
  for (const [id, qty] of entries){
    const p = getProductById(id);
    if (!p) continue;
    msg += `(x${qty}) ${p.name} — ${money(p.price * qty)}\n`;
  }
  const { total } = cartSummary();
  msg += `\nTotal: ${money(total)}\n`;
  return msg;
}

function openWhatsApp(){
  const phone = "5490000000000"; // TODO: reemplazar
  const text = buildWhatsAppMessage();
  const url = `https://wa.me/${phone}?text=${encodeURIComponent(text)}`;
  window.open(url, "_blank");
}

cartCheckoutBtn.addEventListener("click", openWhatsApp);

if (checkoutBtn) {
  checkoutBtn.addEventListener("click", openWhatsApp);
}

// init
renderAll();
