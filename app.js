const products = window.KIMCHI_PRODUCTS || [];

const $ = (sel) => document.querySelector(sel);
const $$ = (sel) => document.querySelectorAll(sel);

const catsEl = $("#cats");
const bestGrid = $("#bestGrid");
const productsGrid = $("#productsGrid");
const searchInput = $("#searchInput");

const menuBtn = $("#menuBtn");
const drawer = $("#drawer");
const drawerOverlay = document.getElementById("drawerOverlay");
const drawerClose = document.getElementById("drawerClose");

const cartBtn = $("#cartBtn");
const cartModal = $("#cartModal");
const cartClose = $("#cartClose");
const cartItems = $("#cartItems");
const cartCountEls = document.querySelectorAll(".cart-badge");
const cartTotal = $("#cartTotal");
const cartTotal2 = $("#cartTotal2");
const cartCheckoutBtn = $("#cartCheckoutBtn");
const checkoutBtn = $("#checkoutBtn");

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
  { name: "Promo", special: true,  img: "url('img/cats/cat1.jpg')" },
  { name: "Picante",  special: false, img: "url('img/cats/cat2.jpg')" },
  { name: "Sin picante", special: false, img: "url('img/cats/.png')" },
  { name: "Especiales", special: false, img: "url('img/cats/.png')" },
  { name: "Salsas",   special: false, img: "url('img/cats/.png')" },
];

const CART_KEY = "kimchi_cart_v1";
let cart = loadCart(); 

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
  return "$" + (n || 0).toLocaleString("es-AR");
}

function getProductById(id){
  return products.find(p => p.id === id);
}

function isPromoEligibleKimchiNoEspecial(p){
  if (!p) return false;
  const blocked = ["Especiales", "Salsas", "Promo"];
  return !blocked.includes(p.category);
}

function isSalsa(p){
  return p && p.category === "Salsas";
}

function isAkusay(p){
  return p && /akusay/i.test(p.name);
}

function isTofu(p){
  return p && /tofu/i.test(p.name);
}

function sumCartTotal(cartObj){
  let total = 0;
  for (const [id, qty] of Object.entries(cartObj)){
    const p = getProductById(id);
    if (!p) continue;
    total += (p.price * qty);
  }
  return total;
}

function computePromos(cartObj){
  const remaining = { ...cartObj }; 
  const applied = [];

  const getQty = (id) => remaining[id] || 0;
  const take = (id, n) => {
    remaining[id] = (remaining[id] || 0) - n;
    if (remaining[id] <= 0) delete remaining[id];
  };

  const expandIds = (predicate) => {
    const arr = [];
    for (const [id, qty] of Object.entries(remaining)){
      const p = getProductById(id);
      if (!p) continue;
      if (!predicate(p)) continue;
      for (let i=0;i<qty;i++) arr.push(id);
    }
    arr.sort((a,b) => (getProductById(b)?.price||0) - (getProductById(a)?.price||0));
    return arr;
  };

  {
  const akusayIds = expandIds(p =>
    isAkusay(p) && p.category !== "Promo" && p.category !== "Salsas"
  );

  const tofuIds = expandIds(p =>
    isTofu(p) && p.category === "Especiales" 
  );

  let pairs = Math.min(akusayIds.length, tofuIds.length);
  while (pairs-- > 0){
    const aId = akusayIds.shift();
    const tId = tofuIds.shift();
    take(aId, 1);
    take(tId, 1);

    const base = (getProductById(aId)?.price||0) + (getProductById(tId)?.price||0);
    const promoPrice = 35000;

    applied.push({
      title: "Promo: 1 Akusay + 1 Tofu",
      price: promoPrice,
      items: [{ id: aId, qty: 1 }, { id: tId, qty: 1 }],
      savings: Math.max(0, base - promoPrice),
      });
    }
  }

  {
    const salsaIds = expandIds(isSalsa);
    while (salsaIds.length >= 3){
      const ids = [salsaIds.shift(), salsaIds.shift(), salsaIds.shift()];
      ids.forEach(id => take(id, 1));

      const base = ids.reduce((acc,id)=> acc + (getProductById(id)?.price||0), 0);
      const promoPrice = 40000;
      applied.push({
        title: "Promo: 3 Salsas",
        price: promoPrice,
        items: ids.map(id => ({ id, qty: 1 })),
        savings: Math.max(0, base - promoPrice),
      });
    }
  }

  {
    const kimchiIds = expandIds(isPromoEligibleKimchiNoEspecial);
    while (kimchiIds.length >= 3){
      const ids = [kimchiIds.shift(), kimchiIds.shift(), kimchiIds.shift()];
      ids.forEach(id => take(id, 1));

      const base = ids.reduce((acc,id)=> acc + (getProductById(id)?.price||0), 0);
      const promoPrice = 50000;
      applied.push({
        title: "Promo: 3 Kimchis (sin especiales)",
        price: promoPrice,
        items: ids.map(id => ({ id, qty: 1 })),
        savings: Math.max(0, base - promoPrice),
      });
    }
  }

  {
    const ids = Object.keys(remaining);
    for (const id of ids){
      const p = getProductById(id);
      if (!isPromoEligibleKimchiNoEspecial(p)) continue;

      let pairs = Math.floor(getQty(id) / 2);
      while (pairs-- > 0){
        take(id, 2);

        const base = (p.price || 0) * 2;
        const promoPrice = 35000;
        applied.push({
          title: "Promo: 2 Kimchis Iguales (sin especiales)",
          price: promoPrice,
          items: [{ id, qty: 2 }],
          savings: Math.max(0, base - promoPrice),
        });
      }
    }
  }

  const baseTotal = sumCartTotal(cartObj);
  const promoItemsBaseTotal = applied.reduce((acc, pr) => {
    const sum = pr.items.reduce((a,it) => a + (getProductById(it.id)?.price||0) * it.qty, 0);
    return acc + sum;
  }, 0);
  const promoTotal = applied.reduce((acc, pr) => acc + pr.price, 0);

  const discount = Math.max(0, promoItemsBaseTotal - promoTotal);

  return { applied, discount };
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

  const { discount } = computePromos(cart);
  total = Math.max(0, total - discount);

  return { count, total };
}

function updateCartUI(){
  const { count, total } = cartSummary();

  cartCountEls.forEach(el => {
    el.textContent = String(count);
    el.style.display = count > 0 ? "grid" : "none";
  });

  if (cartTotal2) cartTotal2.textContent = money(total);
  if (cartTotal)  cartTotal.textContent  = money(total);


if (cartItems) cartItems.innerHTML = "";

const entries = Object.entries(cart).filter(([_,q]) => q > 0);

if (!entries.length){
  if (cartItems) cartItems.innerHTML = `<div class="tip">Tu carrito está vacío.</div>`;
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
        <div class="cart__mini">${money(p.price)}</div>
      </div>
      <div class="qty">
        <button data-act="dec" data-id="${p.id}">−</button>
        <strong>${qty}</strong>
        <button data-act="inc" data-id="${p.id}">+</button>
      </div>
    `;
    cartItems.appendChild(row);
  }

  const promoBox = document.createElement("div");
promoBox.className = "cart__promos";

const { applied, discount } = computePromos(cart);

  if (applied.length){
  promoBox.innerHTML = `
    <div class="cart__promoTitle">Promos aplicadas</div>
    ${applied.map(pr => `
      <div class="cart__promoRow">
        <div>${escapeHtml(pr.title)}</div>
        <strong>${money(pr.price)}</strong>
      </div>
    `).join("")}
    <div class="cart__promoRow">
      <div>Ahorro</div>
      <strong>−${money(discount)}</strong>
    </div>
  `;
  cartItems.appendChild(promoBox);
  }
}

function addToCart(id, qty=1){
  const p = getProductById(id);
  if (p && p.category === "Promo") {
    openProductModal(p);
    return;
  }

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

  if (!cat && !pid){
    crumb.innerHTML = "";
    return;
  }

  if (cat && !pid){
    crumb.innerHTML = `<a href="#top" onclick="location.hash='';return false;">Inicio</a> / ${escapeHtml(cat)}`;
    return;
  }

  if (cat && pid){
    const p = getProductById(pid);
    const pname = p ? p.name : "Producto";
    crumb.innerHTML =
      `<a href="#top" onclick="location.hash='';return false;">Inicio</a> / ` +
      `<a href="#catalogo" onclick="location.hash='cat=${encodeURIComponent(cat)}';return false;">${escapeHtml(cat)}</a> / ` +
      `${escapeHtml(pname)}`;
  }
}

// helpers
function openModal(el){
  el.classList.add("is-open");
  el.setAttribute("aria-hidden", "false");
}
function closeModal(el){
  el.classList.remove("is-open");
  el.setAttribute("aria-hidden", "true");
}

function resetProductModalState(){
  modalBundle = null;

  modalProduct = null;

  setModalQty(1);

  const qtyBox = document.querySelector(".modal__qty");
  if (qtyBox) qtyBox.style.display = "flex";

  if (modalAddBtn){
    modalAddBtn.disabled = false;
    modalAddBtn.style.opacity = "1";
    modalAddBtn.style.pointerEvents = "auto";
  }
}

document.addEventListener("click", (e) => {
  const overlay = e.target.closest("[data-close='1']");
  if (overlay){
    closeProductModalAndResetRoute();
    closeModal(cartModal);
  }
});

if (modalClose) modalClose.addEventListener("click", closeProductModalAndResetRoute);

function closeProductModalAndResetRoute(){
  closeModal(productModal);
  resetProductModalState(); 

  const { pid } = getRoute();
  if (pid) location.hash = "";
}


function openProductModal(p){
  modalProduct = p;
  modalTitle.textContent = p.name;
  modalPrice.textContent = money(p.price);
  modalDesc.textContent = p.long || p.short || "";
  modalImg.style.backgroundImage = p.image ? `url('${p.image}')` : "";
  modalImg.style.backgroundSize = p.image ? "cover" : "";
  modalImg.style.backgroundPosition = "center";

  const extra = document.getElementById("modalExtra");
  if (extra) {
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

  const kind = promoKindFromProduct(p);

  if (kind === "3salsas"){
    modalBundle = { kind, targetPerPack: 3, poolFn: isSalsa, picks: {} };

  } else if (kind === "3kimchis"){
    modalBundle = { kind, targetPerPack: 3, poolFn: eligibleKimchiNoEspecial, picks: {} };

  } else if (kind === "2iguales"){
    modalBundle = { kind, targetPerPack: 2, poolFn: eligibleKimchiNoEspecial, picks: {}, lockId: null };

  } else if (kind === "akusaytofu"){
    modalBundle = { kind, targetPerPack: 1, poolFn: (x) => isAkusay(x) && eligibleKimchiNoEspecial(x), picks: {} };

  } else {
    modalBundle = null;
  }
  }

  setModalQty(1);

  const qtyBox = document.querySelector(".modal__qty");
  if (qtyBox) {
    qtyBox.style.display = modalBundle ? "none" : "flex";
  }

  if (modalBundle){
  renderBundleUI();
  }


  openModal(productModal);
}

const modalQtyDec = document.getElementById("modalQtyDec");
const modalQtyInc = document.getElementById("modalQtyInc");
const modalQtyVal = document.getElementById("modalQtyVal");
let modalQty = 1;

function setModalQty(n){
  modalQty = Math.max(1, Number(n) || 1);
  if (modalQtyVal) modalQtyVal.textContent = String(modalQty);
}

let modalBundle = null; 

function isPromoProduct(p){
  return p && p.category === "Promo";
}

function promoKindFromProduct(p){
  if (!isPromoProduct(p)) return null;

  const name = (p.name || "").toLowerCase();

  if (name.includes("3 salsas")) return "3salsas";
  if (name.includes("3 kimchis")) return "3kimchis";
  if (name.includes("2 kimchis iguales")) return "2iguales";
  if (name.includes("akusay") && name.includes("tofu")) return "akusaytofu";

  return null;
}

function eligibleKimchiNoEspecial(p){
  return p && p.category !== "Especiales" && p.category !== "Salsas" && p.category !== "Promo";
}

function isSalsa(p){ return p && p.category === "Salsas"; }
function isAkusay(p){ return p && /akusay/i.test(p.name); }
function isTofu(p){ return p && /tofu/i.test(p.name); }

function findTofuEspecialId(){
  const tofu = products.find(p => p.category === "Especiales" && isTofu(p));
  return tofu ? tofu.id : null;
}

function bundleTargetCount(){
  if (!modalBundle) return 0;
  return modalBundle.targetPerPack * modalQty;
}

function bundleSelectedCount(){
  if (!modalBundle) return 0;
  return Object.values(modalBundle.picks).reduce((a,b)=>a+b,0);
}

function buildPoolItems(){
  if (!modalBundle) return [];
  const pool = products.filter(modalBundle.poolFn);
  pool.sort((a,b)=> (b.price||0) - (a.price||0));
  return pool;
}

function setAddBtnState(ok){
  if (!modalAddBtn) return;
  modalAddBtn.disabled = !ok;
  modalAddBtn.style.opacity = ok ? "1" : ".55";
  modalAddBtn.style.pointerEvents = ok ? "auto" : "none";
}

function renderBundleUI(){
  const extra = document.getElementById("modalExtra");
  if (!extra || !modalBundle) return;

  const pool = buildPoolItems();
  const target = bundleTargetCount();
  const selected = bundleSelectedCount();

  const title =
    modalBundle.kind === "3salsas" ? "Elegí tus salsas" :
    modalBundle.kind === "3kimchis" ? "Elegí tus kimchis" :
    modalBundle.kind === "2iguales" ? "Elegí 2 kimchis iguales" :
    "Elegí tu Akusay";

  extra.innerHTML = `
    <h4>${title}</h4>

    <div class="promoPick__meta">
      <strong>Seleccionadas: <span id="promoPickCount">${selected}</span> / <span id="promoPickTarget">${target}</span></strong>
      <div class="promoPick__hint" id="promoPickHint"></div>
    </div>

    <div class="promoPick__list">
      ${pool.map(item => `
        <div class="promoPick__row">
          <div class="promoPick__name">${escapeHtml(item.name)}</div>
          <div class="promoPick__ctrl">
            <button class="promoPick__btn" data-pick-act="dec" data-pick-id="${item.id}">−</button>
            <strong class="promoPick__val" id="pickVal_${item.id}">${modalBundle.picks[item.id] || 0}</strong>
            <button class="promoPick__btn" data-pick-act="inc" data-pick-id="${item.id}">+</button>
          </div>
        </div>
      `).join("")}
    </div>
  `;

  const hint = extra.querySelector("#promoPickHint");
  if (hint){
    const left = target - selected;
    if (modalBundle.kind === "2iguales" && modalBundle.lockId){
      const lockedName = escapeHtml(getProductById(modalBundle.lockId)?.name || "");
      hint.textContent = left > 0
        ? `Elegiste: ${lockedName}. Te faltan ${left}.`
        : `Promo completa ✅ (${lockedName})`;
    } else {
      hint.textContent = left > 0 ? `Te faltan ${left} para completar la promo.` : `Promo completa ✅`;
    }
  }

  setAddBtnState(selected === target);
}

document.addEventListener("click", (e) => {
  const btn = e.target.closest("button[data-pick-act]");
  if (!btn || !modalBundle) return;

  const act = btn.dataset.pickAct;
  const id = String(btn.dataset.pickId || "");
  if (!id) return;

  const target = bundleTargetCount();
  const selected = bundleSelectedCount();

  if (act === "inc"){
    if (selected >= target) return;

    if (modalBundle.kind === "2iguales"){
      if (modalBundle.lockId && modalBundle.lockId !== id) return;
      if (!modalBundle.lockId) modalBundle.lockId = id;
    }

    modalBundle.picks[id] = (modalBundle.picks[id] || 0) + 1;
  } else {
    modalBundle.picks[id] = Math.max(0, (modalBundle.picks[id] || 0) - 1);
    if (modalBundle.picks[id] === 0) delete modalBundle.picks[id];

    if (modalBundle.kind === "2iguales" && modalBundle.lockId){
      const leftOfLocked = modalBundle.picks[modalBundle.lockId] || 0;
      if (leftOfLocked === 0) modalBundle.lockId = null;
    }
  }

  renderBundleUI();
});


if (modalQtyInc) modalQtyInc.addEventListener("click", () => setModalQty(modalQty + 1));
if (modalQtyDec) modalQtyDec.addEventListener("click", () => setModalQty(modalQty - 1));

modalAddBtn.addEventListener("click", () => {
  if (!modalProduct) return;

  if (modalBundle){
    const target = bundleTargetCount();
    const selected = bundleSelectedCount();
    if (selected !== target) return;

    for (const [id, qty] of Object.entries(modalBundle.picks)){
      addToCart(id, qty);
    }

    if (modalBundle.kind === "akusaytofu"){
      const tofuId = findTofuEspecialId();
      if (tofuId){
        addToCart(tofuId, modalQty);
      }
    }

    closeModal(productModal);
    resetProductModalState();
    return;
  }

  addToCart(modalProduct.id, modalQty);
  closeModal(productModal);
  resetProductModalState(); 
});

cartBtn.addEventListener("click", () => {
  window.location.href = "checkout.html";
})

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

  if (isCategoryPage) {
    const imgStyle = p.image
    ? `background-image:url('${p.image}');`
    : "";

    const isPromo = (p.category === "Promo");

    el.innerHTML = `
    <div class="card__img" style="${imgStyle}"></div>
    <div class="card__body">
      <div class="card__title">${escapeHtml(p.name)}</div>
      <div class="card__desc">${escapeHtml(p.short || "")}</div>
      <div class="card__price">${money(p.price)}</div>
      <button class="btn" data-add="${p.id}">${isPromo ? "ARMAR PROMO 🧩" : "AGREGAR AL 🛒"}</button>
    </div>
    `;
    
    el.addEventListener("click", (e) => {
    if (e.target.closest("button")) return; 
      openProductModal(p);
    });

    el.querySelector("[data-add]").addEventListener("click", () => {
    if (isPromo) {
      openProductModal(p);
    } else {
      addToCart(p.id, 1);
    }
    });

    return el;
  }

  el.innerHTML = `
    <div class="card__img" style="${imgStyle}"></div>
    <div class="card__body">
      <div class="card__title">${escapeHtml(p.name)}</div>
      <div class="card__price">${money(p.price)}</div>
      <button class="btn btn--primary btnBest" data-view="${p.id}">VER PRODUCTO</button>
    </div>
  `;

  el.addEventListener("click", (e) => {
  if (e.target.closest("button")) return;
    openProductModal(p);
  });

  el.querySelector("[data-view]").addEventListener("click", () => {
    openProductModal(p);
  });

  return el;
}


let bestInfiniteCleanup = null;

function renderBest(){
  if (!bestGrid) return;

  const bestEmpty = document.getElementById("bestEmpty");
  bestGrid.innerHTML = "";

  const best = products
    .filter(p => p.bestSeller)
    .slice(0, 10);

  if (!best.length){
    if (bestEmpty) bestEmpty.style.display = "block";
    return;
  }

  if (bestEmpty) bestEmpty.style.display = "none";

  setupBestInfinite(best);
}

function setupBestInfinite(best){
  if (typeof bestInfiniteCleanup === "function") bestInfiniteCleanup();

  if (best.length < 2){
    best.forEach(p => bestGrid.appendChild(productCard(p)));
    bestInfiniteCleanup = null;
    return;
  }

  const tripled = [...best, ...best, ...best];

  const frag = document.createDocumentFragment();
  tripled.forEach(p => frag.appendChild(productCard(p)));
  bestGrid.appendChild(frag);

  requestAnimationFrame(() => {
    const segment = bestGrid.scrollWidth / 3;
    bestGrid.scrollLeft = segment;
  });

  let jumping = false;
  let snapTimer = 0;

  const getSegment = () => Math.round(bestGrid.scrollWidth / 3);

  const doJump = (delta) => {
    const seg = getSegment();
    if (!seg) return;

    jumping = true;
    bestGrid.classList.add("is-jumping");
    bestGrid.scrollLeft += delta;

    requestAnimationFrame(() => {
      bestGrid.classList.remove("is-jumping");
      jumping = false;
    });
  };

  const onScroll = () => {
    if (jumping) return;

    clearTimeout(snapTimer);
    snapTimer = setTimeout(() => {
      const seg = getSegment();
      if (!seg) return;

      const left = bestGrid.scrollLeft;

      if (left < seg * 0.25) doJump(+seg);
      else if (left > seg * 1.75) doJump(-seg);
    }, 90);
  };

  bestGrid.addEventListener("scroll", onScroll, { passive: true });

  bestInfiniteCleanup = () => {
    clearTimeout(snapTimer);
    bestGrid.removeEventListener("scroll", onScroll);
    bestInfiniteCleanup = null;
  };

}



function renderProducts(){
  if (!productsGrid) return;

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

  activeCategory = cat || null;

  renderCategories();
  renderCrumb();

  if (pid){
    const p = getProductById(pid);
    if (p) openProductModal(p);
  }

  renderBest();
  renderProducts();

  updateCartUI();
}

let searchDrop = null;

function ensureSearchDropdown(){
  if (!searchInput || searchDrop) return;

  searchDrop = document.createElement("div");
  searchDrop.className = "search-drop is-hidden";
  searchDrop.innerHTML = `<div class="search-drop__list"></div>`;

  const wrap = searchInput.parentElement;
  if (wrap) {
    wrap.style.position = "relative";
    wrap.appendChild(searchDrop);
  } else {
    document.body.appendChild(searchDrop);
  }

  document.addEventListener("click", (e) => {
    if (!searchDrop) return;
    if (e.target === searchInput) return;
    if (searchDrop.contains(e.target)) return;
    hideSearchDrop();
  });
}

function hideSearchDrop(){
  if (!searchDrop) return;
  searchDrop.classList.add("is-hidden");
  const list = searchDrop.querySelector(".search-drop__list");
  if (list) list.innerHTML = "";
}

function normalize(s){
  return (s || "")
    .toString()
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "");
}

function searchProducts(q){
  const qq = normalize(q).trim();
  if (!qq) return [];

  return products
    .map(p => {
      const hay = normalize([
        p.name,
        p.short,
        p.long,
        p.category
      ].filter(Boolean).join(" "));
      return { p, hay };
    })
    .filter(x => x.hay.includes(qq))
    .slice(0, 8)
    .map(x => x.p);
}

function getHeatTag(p){
  const cat = (p?.category || "").toString().toLowerCase();
  if (cat === "sin picante") return { text: "Sin picante", cls: "meta--sin-picante" };
  if (cat === "picante")     return { text: "Picante", cls: "meta--picante" };

  const n = Number(p?.nivelPicante);
  if (Number.isFinite(n)) {
    if (n === 0) return { text: "Sin picante", cls: "meta--sin-picante" };
    if (n > 0)   return { text: "Picante", cls: "meta--picante" };
  }

  const lvl = (p?.picante || p?.nivel || p?.heat || "").toString().toLowerCase();
  if (lvl.includes("sin picante") || lvl.includes("sin")) return { text: "Sin picante", cls: "meta--sin-picante" };
  if (lvl.includes("picante") || lvl.includes("pic"))     return { text: "Picante", cls: "meta--picante" };

  const hay = `${p?.name || ""} ${p?.short || ""} ${p?.long || ""} ${p?.category || ""}`.toLowerCase();
  if (hay.includes("sin picante")) return { text: "Sin picante", cls: "meta--sin-picante" };
  if (hay.includes("picante"))     return { text: "Picante", cls: "meta--picante" };

  return { text: "Clásico", cls: "meta--neutral" };
}



function renderSearchDrop(q){
  ensureSearchDropdown();
  if (!searchDrop) return;

  const results = searchProducts(q);
  const list = searchDrop.querySelector(".search-drop__list");
  if (!list) return;

  if (!q.trim() || !results.length){
    hideSearchDrop();
    return;
  }

  list.innerHTML = results.map(p => {
  const img = p.image ? `style="background-image:url('${p.image}')"` : "";

let meta = "";
let metaClass = "";


if (p.category === "Promo"){
  meta = "Promo";
  metaClass = "meta--promo";
}
else if (p.category === "Especiales"){
  meta = "Especiales";
  metaClass = "meta--especial";
}

else if (p.category === "Salsas"){
  meta = "Salsa";
  metaClass = "meta--salsa";
}

else {
  const heat = getHeatTag(p);
  meta = heat.text;
  metaClass = heat.cls;
}

  return `
    <button class="search-item" type="button" data-id="${p.id}">
      <div class="search-item__img" ${img}></div>
      <div class="search-item__txt">
        <div class="search-item__top">
          <div class="search-item__name">${escapeHtml(p.name)}</div>
          <div class="search-item__price">${money(p.price)}</div>
        </div>
        <div class="search-item__meta ${metaClass}">${meta}</div>
      </div>
    </button>
  `;
  }).join("");


  searchDrop.classList.remove("is-hidden");

  list.querySelectorAll("[data-id]").forEach(btn => {
    btn.addEventListener("click", () => {
      const id = btn.dataset.id;
      const p = getProductById(id);
      if (p) openProductModal(p);
      hideSearchDrop();
      searchInput.blur();
    });
  });
}

if (searchInput){
  ensureSearchDropdown();

  searchInput.addEventListener("input", () => {
    const isCategoryPage = document.body.classList.contains("page-category");

    if (isCategoryPage) renderProducts();

    renderSearchDrop(searchInput.value);
  });

  searchInput.addEventListener("focus", () => {
    renderSearchDrop(searchInput.value);
  });

  searchInput.addEventListener("keydown", (e) => {
    if (e.key === "Escape") hideSearchDrop();
  });
}

let bannerIndex = 0;

function bannerInit(){
  const slides = $$("#bannerTrack .banner__slide");
  const dots   = $$(".banner__dots .dot");
  if (!slides.length) return;

  function show(i){
    slides.forEach(s => s.classList.remove("is-active"));
    dots.forEach(d => d.classList.remove("is-active"));

    bannerIndex = (i + slides.length) % slides.length;

    slides[bannerIndex].classList.add("is-active");
    if (dots[bannerIndex]) dots[bannerIndex].classList.add("is-active");
  }

  const isDesktopPointer = window.matchMedia("(hover: hover) and (pointer: fine)").matches;

  if (isDesktopPointer) {
  dots.forEach((dot, i) => {
    dot.addEventListener("click", (e) => {
      e.preventDefault();
      e.stopPropagation();
      show(i);
      });
    });
  }

  const timer = setInterval(() => show(bannerIndex + 1), 5000);

  const bannerEl = document.querySelector(".banner");
  if (bannerEl){
    let startX = 0;

    bannerEl.addEventListener("touchstart", (e) => {
      startX = e.touches[0].clientX;
    }, { passive: true });

    bannerEl.addEventListener("touchend", (e) => {
      const endX = e.changedTouches[0].clientX;
      const diff = startX - endX;

      if (Math.abs(diff) > 50){
        if (diff > 0) show(bannerIndex + 1); 
        else          show(bannerIndex - 1); 
      }
    }, { passive: true });
  }

  show(0);
}

bannerInit();

function buildWhatsAppMessage(){
  const entries = Object.entries(cart).filter(([_,q]) => q > 0);
  if (!entries.length) return "Hola! Quiero hacer un pedido.\n\n(El carrito está vacío)";
  let msg = "Hola! Quiero hacer un pedido:\n\n";
  for (const [id, qty] of entries){
    const p = getProductById(id);
    if (!p) continue;
    msg += `(x${qty}) ${p.name} — ${money(p.price * qty)}\n`;
  }

  const promos = computePromos(cart);
  if (promos.applied.length){
  msg += `\nPromos aplicadas:\n`;
  promos.applied.forEach(pr => {
    msg += `• ${pr.title} — ${money(pr.price)}\n`;
  });
  msg += `Ahorro: -${money(promos.discount)}\n`;
  }

  const { total } = cartSummary();
  msg += `\nTotal: ${money(total)}\n`;
  return msg;
}

function openWhatsApp(){
  const phone = "5490000000000"; 
  const text = buildWhatsAppMessage();
  const url = `https://wa.me/${phone}?text=${encodeURIComponent(text)}`;
  window.open(url, "_blank");
}

cartCheckoutBtn.addEventListener("click", openWhatsApp);

if (checkoutBtn) {
  checkoutBtn.addEventListener("click", openWhatsApp);
}

const sidePanel = document.getElementById("sidePanel");
const sidePanelTitle = document.getElementById("sidePanelTitle");
const sidePanelBody = document.getElementById("sidePanelBody");

function openSidePanel({ title, content }) {
  sidePanelTitle.textContent = title;
  sidePanelBody.innerHTML = content;

  sidePanel.classList.add("is-open");
  sidePanel.setAttribute("aria-hidden", "false");
}

function closeSidePanel(){
  sidePanel.classList.remove("is-open");
  sidePanel.setAttribute("aria-hidden", "true");
  delete sidePanel.dataset.panel; 
}

document.addEventListener("click", (e) => {
  if (e.target.matches("[data-panel-close]")) {
    closeSidePanel();
  }
});

function closeDrawer(){
  if (!drawer) return;
  drawer.classList.remove("is-open");
  if (menuBtn) menuBtn.setAttribute("aria-expanded","false");
  drawer.setAttribute("aria-hidden","true");
  if (drawerOverlay) drawerOverlay.hidden = true;
}

function openDrawer(){
  if (!drawer) return;
  drawer.classList.add("is-open");
  if (menuBtn) menuBtn.setAttribute("aria-expanded","true");
  drawer.setAttribute("aria-hidden","false");
  if (drawerOverlay) drawerOverlay.hidden = false;
}

if (menuBtn && drawer){
  menuBtn.addEventListener("click", () => {
    const isOpen = drawer.classList.contains("is-open");
    isOpen ? closeDrawer() : openDrawer();
  });

  if (drawerClose) drawerClose.addEventListener("click", closeDrawer);
  if (drawerOverlay) drawerOverlay.addEventListener("click", closeDrawer);

  drawer.addEventListener("click", (e) => {
    const btn = e.target.closest("[data-panel]");
    if (btn){
      const key = btn.dataset.panel;

      const tpl = document.getElementById(`tpl-${key}`);
      const html = tpl ? tpl.innerHTML : `<p>Contenido no configurado.</p>`;

      const titles = {
        about: "Nuestra Historia",
        kimchis: "Sobre nuestros Kimchis",
        faq: "Preguntas frecuentes",
        contact: "Contactos",
      };

      if (sidePanel) sidePanel.dataset.panel = key;

      openSidePanel({
        title: titles[key] || "Panel",
        content: html
      });

      closeDrawer();
      return;
    }

    const a = e.target.closest("a.drawer__link");
      if (a){
      const href = a.getAttribute("href") || "";

      if (href.startsWith("#")){
        e.preventDefault();

      const target = document.querySelector(href);
        closeDrawer();

      if (target){
      setTimeout(() => {
        const header = document.querySelector(".header");
        const offset = (header?.offsetHeight || 0) + 8;

        const y =
          target.getBoundingClientRect().top +
          window.pageYOffset -
          offset;

        window.scrollTo({
          top: Math.max(0, y),
          behavior: "smooth"
            });
          }, 50);
        }
      } else {
      closeDrawer();
    }
    }
  });
}

const bannerSlides = document.querySelectorAll(".banner__slide");
const bannerDots   = document.querySelectorAll(".banner__dots .dot");
const bannerPrev   = document.querySelector(".banner__arrow--left");
const bannerNext   = document.querySelector(".banner__arrow--right");

let bannerCurrent = 0;

function showBanner(i){
  if (!bannerSlides.length) return;

  bannerSlides.forEach(s => s.classList.remove("is-active"));
  bannerDots.forEach(d => d.classList.remove("is-active"));

  bannerCurrent = (i + bannerSlides.length) % bannerSlides.length;

  bannerSlides[bannerCurrent].classList.add("is-active");
  if (bannerDots[bannerCurrent]) {
    bannerDots[bannerCurrent].classList.add("is-active");
  }
}

if (bannerPrev && bannerNext){
  bannerPrev.addEventListener("click", () => showBanner(bannerCurrent - 1));
  bannerNext.addEventListener("click", () => showBanner(bannerCurrent + 1));
}
setInterval(() => showBanner(bannerCurrent + 1), 6000);


document.addEventListener("click", (e) => {
  const a = e.target.closest("a[href^='#']");
  if (!a) return;

  const href = a.getAttribute("href");
  if (!href || href === "#") return;

  const target = document.querySelector(href);
  if (!target) return;

  e.preventDefault();

  const header = document.querySelector(".header");
  const offset = (header?.offsetHeight || 0) + 8;

  const y = target.getBoundingClientRect().top + window.pageYOffset - offset;

  window.scrollTo({ top: Math.max(0, y), behavior: "smooth" });
});

document.addEventListener("click", (e) => {
  const btn = e.target.closest("button[data-panel], a[data-panel]");
  if (!btn) return;

  const key = btn.dataset.panel;

  const tpl = document.getElementById(`tpl-${key}`);
  const html = tpl ? tpl.innerHTML : `<p>Contenido no configurado.</p>`;

  const titles = {
    about: "Nuestra Historia",
    kimchis: "Sobre nuestros Kimchis",
    faq: "Preguntas frecuentes",
    contact: "Contactos",
  };

  sidePanel.dataset.panel = key;

  openSidePanel({
    title: titles[key] || "Panel",
    content: html
  });

  if (drawer && drawer.classList.contains("is-open")) closeDrawer();
});

document.addEventListener("click", (e) => {
  const backBtn = e.target.closest("[data-panel-back]");
  if (!backBtn) return;

  closeSidePanel();
  openDrawer();
});


renderAll();
