const products = window.KIMCHI_PRODUCTS || [];

const $ = (sel) => document.querySelector(sel);
const $$ = (sel) => document.querySelectorAll(sel);

const catsEl = $("#cats");
const bestGrid = $("#bestGrid");
const productsGrid = $("#productsGrid");
const searchInput = $("#searchInput");
const searchModal = $("#searchModal");
const searchBtn = $("#searchBtn");
const drawerSearchBtn = $("#drawerSearchBtn");
const searchSuggestions = $("#searchSuggestions");
const clearCartBtn = $("#clearCartBtn");
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
  { name: "Promo", special: true, img: "url('img/cats/cat122222.jpg')" },
  { name: "Picante", special: false, img: "url('img/cats/cat222222.jpg')" },
  { name: "Sin picante", special: false, img: "url('img/cats/.png')" },
  { name: "Especiales", special: false, img: "url('img/cats/.png')" },
  { name: "Salsas", special: false, img: "url('img/cats/.png')" },
];

const CART_KEY = "kimchi_cart_v1";
let cart = loadCart();

function loadCart() {
  try {
    const raw = localStorage.getItem(CART_KEY);
    return raw ? JSON.parse(raw) : {};
  } catch {
    return {};
  }
}
function saveCart() {
  localStorage.setItem(CART_KEY, JSON.stringify(cart));
}

function money(n) {
  return "$" + (n || 0).toLocaleString("es-AR");
}

function getProductById(id) {
  return products.find(p => p.id === id);
}

function isPromoEligibleKimchiNoEspecial(p) {
  if (!p) return false;
  const blocked = ["Especiales", "Salsas", "Promo"];
  return !blocked.includes(p.category);
}

function isSalsa(p) {
  return p && p.category === "Salsas";
}

function isAkusay(p) {
  return p && /akusay/i.test(p.name);
}

function isTofu(p) {
  return p && /tofu/i.test(p.name);
}

function sumCartTotal(cartObj) {
  let total = 0;
  for (const [id, qty] of Object.entries(cartObj)) {
    const p = getProductById(id);
    if (!p) continue;
    total += (p.price * qty);
  }
  return total;
}

function computePromos(cartObj) {
  const remaining = { ...cartObj };
  const applied = [];

  const getQty = (id) => remaining[id] || 0;
  
  const take = (id, n) => {
    remaining[id] = (remaining[id] || 0) - n;
    if (remaining[id] <= 0) delete remaining[id];
  };

  const expandIds = (predicate) => {
    const arr = [];
    for (const [id, qty] of Object.entries(remaining)) {
      const p = getProductById(id);
      if (!p) continue;
      if (!predicate(p)) continue;
      for (let i = 0; i < qty; i++) arr.push(id);
    }
    arr.sort((a, b) => (getProductById(b)?.price || 0) - (getProductById(a)?.price || 0));
    return arr;
  };

  function isPromo4x3Eligible(p) {
    if (!p) return false;
    return p.category !== "Salsas" && p.category !== "Promo";
  }

  {
    const mixIds = expandIds(isPromo4x3Eligible);
    
    while (mixIds.length >= 4) {
      const groupIds = [
        mixIds.shift(),
        mixIds.shift(),
        mixIds.shift(),
        mixIds.shift()
      ];

      groupIds.forEach(id => take(id, 1));

      const prices = groupIds.map(id => getProductById(id)?.price || 0);
      const totalGroup = prices.reduce((a, b) => a + b, 0);
      
      const cheapest = prices[3]; 
      const promoPrice = totalGroup - cheapest;

      applied.push({
        title: "Promo 4x3 (1 sin cargo)",
        price: promoPrice,
        items: groupIds.map(id => ({ id, qty: 1 })),
        savings: cheapest,
      });
    }
  }

  // --- PROMO: AKUSAY + TOFU ---
  {
    const akusayIds = expandIds(p =>
      isAkusay(p) && p.category !== "Promo" && p.category !== "Salsas"
    );
    const tofuIds = expandIds(p =>
      isTofu(p) && p.category === "Especiales"
    );

    let pairs = Math.min(akusayIds.length, tofuIds.length);
    while (pairs-- > 0) {
      const aId = akusayIds.shift();
      const tId = tofuIds.shift();
      take(aId, 1);
      take(tId, 1);

      const base = (getProductById(aId)?.price || 0) + (getProductById(tId)?.price || 0);
      const promoPrice = 35000;

      applied.push({
        title: "Promo: 1 Akusay + 1 Tofu",
        price: promoPrice,
        items: [{ id: aId, qty: 1 }, { id: tId, qty: 1 }],
        savings: Math.max(0, base - promoPrice),
      });
    }
  }

  // --- PROMO: 3 SALSAS ---
  {
    const salsaIds = expandIds(isSalsa);
    while (salsaIds.length >= 3) {
      const ids = [salsaIds.shift(), salsaIds.shift(), salsaIds.shift()];
      ids.forEach(id => take(id, 1));

      const base = ids.reduce((acc, id) => acc + (getProductById(id)?.price || 0), 0);
      const promoPrice = 40000;
      applied.push({
        title: "Promo: 3 Salsas",
        price: promoPrice,
        items: ids.map(id => ({ id, qty: 1 })),
        savings: Math.max(0, base - promoPrice),
      });
    }
  }

  // --- PROMO: 3 KIMCHIS (Sin especiales) ---
  {
    const kimchiIds = expandIds(isPromoEligibleKimchiNoEspecial);
    while (kimchiIds.length >= 3) {
      const ids = [kimchiIds.shift(), kimchiIds.shift(), kimchiIds.shift()];
      ids.forEach(id => take(id, 1));

      const base = ids.reduce((acc, id) => acc + (getProductById(id)?.price || 0), 0);
      const promoPrice = 50000;
      applied.push({
        title: "Promo: 3 Kimchis (sin especiales)",
        price: promoPrice,
        items: ids.map(id => ({ id, qty: 1 })),
        savings: Math.max(0, base - promoPrice),
      });
    }
  }

  // --- PROMO: 2 IGUALES (Sin especiales) ---
  {
    const ids = Object.keys(remaining);
    for (const id of ids) {
      const p = getProductById(id);
      if (!isPromoEligibleKimchiNoEspecial(p)) continue;

      let pairs = Math.floor(getQty(id) / 2);
      while (pairs-- > 0) {
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
    const sum = pr.items.reduce((a, it) => a + (getProductById(it.id)?.price || 0) * it.qty, 0);
    return acc + sum;
  }, 0);
  const promoTotal = applied.reduce((acc, pr) => acc + pr.price, 0);

  const discount = Math.max(0, promoItemsBaseTotal - promoTotal);

  return { applied, discount };
}

function cartSummary() {
  let count = 0;
  let total = 0;

  for (const [id, qty] of Object.entries(cart)) {
    const p = getProductById(id);
    if (!p) continue;
    count += qty;
    total += p.price * qty;
  }

  const { discount } = computePromos(cart);
  total = Math.max(0, total - discount);

  return { count, total };
}

function updateCartUI() {
  const { count, total } = cartSummary();

  cartCountEls.forEach(el => {
    el.textContent = String(count);
    el.style.display = count > 0 ? "grid" : "none";
  });

  if (cartTotal2) cartTotal2.textContent = money(total);
  if (cartTotal) cartTotal.textContent = money(total);


  if (cartItems) cartItems.innerHTML = "";

  const entries = Object.entries(cart).filter(([_, q]) => q > 0);

  if (!entries.length) {
    if (cartItems) cartItems.innerHTML = `<div class="tip">Tu carrito está vacío.</div>`;
    return;
  }

  for (const [id, qty] of entries) {
    const p = getProductById(id);
    if (!p) continue;

    const row = document.createElement("div");
    row.className = "cart__item";
    row.innerHTML = `
      <div>
        <div class="cart__name">${renderNameWithSize(p.name)}</div>
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

  if (applied.length) {
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

function addToCart(id, qty = 1) {
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


function escapeHtml(str) {
  return String(str)
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");
}

function splitNameSize(name) {
  const raw = (name || "").toString();
  const parts = raw.split("•");
  if (parts.length < 2) return { main: raw.trim(), size: "" };
  return { main: parts[0].trim(), size: parts.slice(1).join("•").trim() };
}

function renderNameWithSize(name) {
  const { main, size } = splitNameSize(name);
  return size
    ? `${escapeHtml(main)} <span class="name-sep">•</span> <span class="name-size">${escapeHtml(size).replace(" ml", "&nbsp;ml")}</span>`
    : escapeHtml(main);
}


function setHash(params) {
  const qs = new URLSearchParams(params);
  location.hash = qs.toString();
}

function getRoute() {
  const qs = new URLSearchParams((location.hash || "").replace("#", ""));
  const cat = qs.get("cat");
  const pid = qs.get("p");
  return { cat, pid };
}

function renderCrumb() {
  const crumb = document.getElementById("crumb");
  if (!crumb) return;

  const { cat, pid } = getRoute();

  if (!cat && !pid) {
    crumb.innerHTML = "";
    return;
  }

  if (cat && !pid) {
    crumb.innerHTML = `<a href="#top" onclick="location.hash='';return false;">Inicio</a> / ${escapeHtml(cat)}`;
    return;
  }

  if (cat && pid) {
    const p = getProductById(pid);
    const pname = p ? p.name : "Producto";
    crumb.innerHTML =
      `<a href="#top" onclick="location.hash='';return false;">Inicio</a> / ` +
      `<a href="#catalogo" onclick="location.hash='cat=${encodeURIComponent(cat)}';return false;">${escapeHtml(cat)}</a> / ` +
      `${escapeHtml(pname)}`;
  }
}

// helpers
function openModal(el) {
  el.classList.add("is-open");
  el.setAttribute("aria-hidden", "false");
}
function closeModal(el) {
  el.classList.remove("is-open");
  el.setAttribute("aria-hidden", "true");
}

function setSearchSuggestionsVisible() {
  if (!searchSuggestions || !searchInput) return;
  const hasText = !!searchInput.value.trim();
  searchSuggestions.style.display = hasText ? "none" : "block";
}

function openSearchModal() {
  if (!searchModal) return;

  closeDrawer?.();

  openModal(searchModal);

  if (searchInput) {
    searchInput.value = "";
    hideSearchDrop?.();
    setSearchSuggestionsVisible();
    setTimeout(() => searchInput.focus(), 50);
  }
}

function closeSearchModal() {
  if (!searchModal) return;
  closeModal(searchModal);

  hideSearchDrop?.();
  if (searchInput) searchInput.blur();
}

function isSearchOpen() {
  return !!searchModal && searchModal.classList.contains("is-open");
}

if (searchBtn) {
  searchBtn.addEventListener("click", (e) => {
    e.preventDefault();
    openSearchModal();
  });
}

if (drawerSearchBtn) {
  drawerSearchBtn.addEventListener("click", (e) => {
    e.preventDefault();
    openSearchModal();
  });
}

if (searchModal) {
  searchModal.addEventListener("click", (e) => {
    const closeEl = e.target.closest("[data-search-close]");
    if (closeEl) closeSearchModal();
  });
}

document.addEventListener("click", (e) => {
  const chip = e.target.closest("[data-search-chip]");
  if (!chip || !searchInput) return;

  if (searchModal && !isSearchOpen()) openModal(searchModal);

  searchInput.value = chip.dataset.searchChip || chip.textContent || "";
  setSearchSuggestionsVisible();
  renderSearchDrop(searchInput.value);
  searchInput.focus();
});

document.addEventListener("keydown", (e) => {
  if (e.key !== "Escape") return;

  if (isSearchOpen()) {
    e.preventDefault();
    closeSearchModal();
  } else {
    hideSearchDrop?.();
  }
});

if (searchInput) {
  searchInput.addEventListener("input", () => {
    setSearchSuggestionsVisible();
  });
}

function resetProductModalState() {
  modalBundle = null;

  modalProduct = null;

  setModalQty(1);

  const qtyBox = document.querySelector(".modal__qty");
  if (qtyBox) qtyBox.style.display = "flex";

  if (modalAddBtn) {
    modalAddBtn.disabled = false;
    modalAddBtn.style.opacity = "1";
    modalAddBtn.style.pointerEvents = "auto";
  }
}

document.addEventListener("click", (e) => {
  const overlay = e.target.closest("[data-close='1']");
  if (overlay) {
    closeProductModalAndResetRoute();
    closeModal(cartModal);
  }
});

if (modalClose) modalClose.addEventListener("click", closeProductModalAndResetRoute);

function closeProductModalAndResetRoute() {
  closeModal(productModal);
  resetProductModalState();

  const { pid } = getRoute();
  if (pid) location.hash = "";
}

function openProductModal(p) {
  modalProduct = p;
  modalTitle.innerHTML = renderNameWithSize(p.name);
  modalPrice.textContent = money(p.price);
  modalDesc.textContent = p.long || p.short || "";
  modalImg.style.backgroundImage = p.image ? `url('${p.image}')` : "";
  modalImg.style.backgroundSize = p.image ? "cover" : "";
  modalImg.style.backgroundPosition = "center";

  const extra = document.getElementById("modalExtra");
  if (extra) {
    const info = p.info || {};
    let html = "";

    if (info.fermentacion) {
      html += `
        <h4>Tiempo de fermentación</h4>
        <div style="margin-bottom:10px; color: #354F49;;">${escapeHtml(info.fermentacion)}</div>
      `;
    }

    if (typeof info.nivelPicante === "number") {
      const flames = `<span style="font-size:18px;">${"🔥".repeat(info.nivelPicante)}</span>`;
      html += `
        <h4>Nivel de picante</h4>
        <div style="margin-bottom:10px;">${flames}</div>
      `;
    }

    if (Array.isArray(info.beneficios) && info.beneficios.length) {
      html += `
        <h4>Beneficios</h4>
        <ul>
          ${info.beneficios.map(b => `<li>${escapeHtml(b)}</li>`).join("")}
        </ul>
      `;
    }

    extra.innerHTML = html;

    const kind = promoKindFromProduct(p);

    if (kind === "3salsas") {
      modalBundle = { kind, targetPerPack: 3, poolFn: isSalsa, picks: {} };

    } else if (kind === "3kimchis") {
      modalBundle = { kind, targetPerPack: 3, poolFn: eligibleKimchiNoEspecial, picks: {} };

    } else if (kind === "2iguales") {
      modalBundle = { kind, targetPerPack: 2, poolFn: eligibleKimchiNoEspecial, picks: {}, lockId: null };

    } else if (kind === "akusaytofu") {
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

  if (modalBundle) {
    renderBundleUI();
  }


  openModal(productModal);
}

const modalQtyDec = document.getElementById("modalQtyDec");
const modalQtyInc = document.getElementById("modalQtyInc");
const modalQtyVal = document.getElementById("modalQtyVal");
let modalQty = 1;

function setModalQty(n) {
  modalQty = Math.max(1, Number(n) || 1);
  if (modalQtyVal) modalQtyVal.textContent = String(modalQty);
}

let modalBundle = null;

function isPromoProduct(p) {
  return p && p.category === "Promo";
}

function promoKindFromProduct(p) {
  if (!isPromoProduct(p)) return null;

  const name = (p.name || "").toLowerCase();

  if (name.includes("3 salsas")) return "3salsas";
  if (name.includes("3 kimchis")) return "3kimchis";
  if (name.includes("2 kimchis iguales")) return "2iguales";
  if (name.includes("akusay") && name.includes("tofu")) return "akusaytofu";

  return null;
}

function eligibleKimchiNoEspecial(p) {
  return p && p.category !== "Especiales" && p.category !== "Salsas" && p.category !== "Promo";
}

function isSalsa(p) { return p && p.category === "Salsas"; }
function isAkusay(p) { return p && /akusay/i.test(p.name); }
function isTofu(p) { return p && /tofu/i.test(p.name); }

function findTofuEspecialId() {
  const tofu = products.find(p => p.category === "Especiales" && isTofu(p));
  return tofu ? tofu.id : null;
}

function bundleTargetCount() {
  if (!modalBundle) return 0;
  return modalBundle.targetPerPack * modalQty;
}

function bundleSelectedCount() {
  if (!modalBundle) return 0;
  return Object.values(modalBundle.picks).reduce((a, b) => a + b, 0);
}

function buildPoolItems() {
  if (!modalBundle) return [];
  const pool = products.filter(modalBundle.poolFn);
  pool.sort((a, b) => (b.price || 0) - (a.price || 0));
  return pool;
}

function setAddBtnState(ok) {
  if (!modalAddBtn) return;
  modalAddBtn.disabled = !ok;
  modalAddBtn.style.opacity = ok ? "1" : ".55";
  modalAddBtn.style.pointerEvents = ok ? "auto" : "none";
}

function renderBundleUI() {
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
  if (hint) {
    const left = target - selected;
    if (modalBundle.kind === "2iguales" && modalBundle.lockId) {
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

  if (act === "inc") {
    if (selected >= target) return;

    if (modalBundle.kind === "2iguales") {
      if (modalBundle.lockId && modalBundle.lockId !== id) return;
      if (!modalBundle.lockId) modalBundle.lockId = id;
    }

    modalBundle.picks[id] = (modalBundle.picks[id] || 0) + 1;
  } else {
    modalBundle.picks[id] = Math.max(0, (modalBundle.picks[id] || 0) - 1);
    if (modalBundle.picks[id] === 0) delete modalBundle.picks[id];

    if (modalBundle.kind === "2iguales" && modalBundle.lockId) {
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

  if (modalBundle) {
    const target = bundleTargetCount();
    const selected = bundleSelectedCount();
    if (selected !== target) return;

    for (const [id, qty] of Object.entries(modalBundle.picks)) {
      addToCart(id, qty);
    }

    if (modalBundle.kind === "akusaytofu") {
      const tofuId = findTofuEspecialId();
      if (tofuId) {
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

function renderCategories() {
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

function matchesFilters(p) {
  const q = ((searchInput && searchInput.value) ? searchInput.value : "").trim().toLowerCase();
  const byCat = !activeCategory || p.category === activeCategory;
  const bySearch = !q || p.name.toLowerCase().includes(q);

  return byCat && bySearch;
}

function productCard(p) {
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
      <div class="card__title">${renderNameWithSize(p.name)}</div>
      <div class="card__desc">${escapeHtml(p.short || "")}</div>
      <div class="card__price">${money(p.price)}</div>
      <button class="btn" data-add="${p.id}">${isPromo ? "ARMAR PROMO 🧩" : "AGREGAR AL 🛒"}</button>
    </div>
    `;

    el.addEventListener("click", (e) => {
      if (bestGrid?.classList.contains("is-dragging")) return;
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
      <div class="card__title">${renderNameWithSize(p.name)}</div>
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

function renderBest() {
  if (!bestGrid) return;

  const bestEmpty = document.getElementById("bestEmpty");
  bestGrid.innerHTML = "";

  const best = products
    .filter(p => p.bestSeller)
    .slice(0, 10);

  if (!best.length) {
    if (bestEmpty) bestEmpty.style.display = "block";
    return;
  }

  if (bestEmpty) bestEmpty.style.display = "none";

  setupBestInfinite(best);
}

function setupBestInfinite(best) {
  if (typeof bestInfiniteCleanup === "function") bestInfiniteCleanup();

  if (best.length < 2) {
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
    if (isPointerDown) return;

    clearTimeout(snapTimer);
    snapTimer = setTimeout(() => {
      const seg = getSegment();
      if (!seg) return;

      const left = bestGrid.scrollLeft;

      if (left < seg * 0.25) doJump(+seg);
      else if (left > seg * 1.75) doJump(-seg);
    }, 90);
  };


  const isDesktopPointer = window.matchMedia("(hover: hover) and (pointer: fine)").matches;

  let dragMoved = false;
  let captured = false;
  let startX = 0;
  let startLeft = 0;

  const onPointerDown = (e) => {
    if (!isDesktopPointer) return;
    if (e.button !== 0) return; 

    isPointerDown = true;
    dragMoved = false;
    captured = false;

    startX = e.clientX;
    startLeft = bestGrid.scrollLeft;
  };

  const onPointerMove = (e) => {
    if (!isDesktopPointer) return;
    if (!isPointerDown) return;

    const dx = e.clientX - startX;

    if (!dragMoved && Math.abs(dx) > 6) {
      dragMoved = true;
      bestGrid.classList.add("is-dragging");

      if (!captured) {
        bestGrid.setPointerCapture?.(e.pointerId);
        captured = true;
      }
    }

    if (!dragMoved) return;
    bestGrid.scrollLeft = startLeft - dx;
  };

  const onPointerUp = () => {
    if (!isDesktopPointer) return;

    isPointerDown = false;

    if (dragMoved) {
      bestGrid.classList.remove("is-dragging");
      dragMoved = false;

      clearTimeout(snapTimer);
      snapTimer = setTimeout(() => {
        const seg = getSegment();
        if (!seg) return;

        const left = bestGrid.scrollLeft;
        if (left < seg * 0.25) doJump(+seg);
        else if (left > seg * 1.75) doJump(-seg);
      }, 120);
    }
  };

  // listeners
  bestGrid.addEventListener("pointerdown", onPointerDown);
  bestGrid.addEventListener("pointermove", onPointerMove);
  bestGrid.addEventListener("pointerup", onPointerUp);
  bestGrid.addEventListener("pointercancel", onPointerUp);
  bestGrid.addEventListener("pointerleave", onPointerUp);


  bestGrid.addEventListener("click", (e) => {
    if (bestGrid.classList.contains("is-dragging")) {
      e.preventDefault();
      e.stopPropagation();
    }
  }, true);


  bestGrid.addEventListener("scroll", onScroll, { passive: true });

  bestInfiniteCleanup = () => {
    clearTimeout(snapTimer);
    bestGrid.removeEventListener("scroll", onScroll);

    bestGrid.removeEventListener("pointerdown", onPointerDown);
    bestGrid.removeEventListener("pointermove", onPointerMove);
    bestGrid.removeEventListener("pointerup", onPointerUp);
    bestGrid.removeEventListener("pointercancel", onPointerUp);
    bestGrid.removeEventListener("pointerleave", onPointerUp);

    bestInfiniteCleanup = null;
  };

}

function renderProducts() {
  if (!productsGrid) return;

  productsGrid.innerHTML = "";
  const list = products.filter(matchesFilters);

  if (!list.length) {
    productsGrid.innerHTML = `<div class="tip">No se encontraron productos.</div>`;
    return;
  }

  list.forEach(p => productsGrid.appendChild(productCard(p)));
}

const yearEl = document.getElementById("copyYear");
if (yearEl) yearEl.textContent = new Date().getFullYear();

window.addEventListener("hashchange", renderAll);

function renderAll() {
  const { cat, pid } = getRoute();

  activeCategory = cat || null;

  renderCategories();
  renderCrumb();

  if (pid) {
    const p = getProductById(pid);
    if (p) openProductModal(p);
  }

  renderBest();
  renderProducts();

  updateCartUI();
}

let searchDrop = null;

function ensureSearchDropdown() {
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

function hideSearchDrop() {
  if (!searchDrop) return;
  searchDrop.classList.add("is-hidden");
  const list = searchDrop.querySelector(".search-drop__list");
  if (list) list.innerHTML = "";
}

function normalize(s) {
  return (s || "")
    .toString()
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "");
}

function searchProducts(q) {
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

function getHeatTag(p) {
  const cat = (p?.category || "").toString().toLowerCase();
  if (cat === "sin picante") return { text: "Sin picante", cls: "meta--sin-picante" };
  if (cat === "picante") return { text: "Picante", cls: "meta--picante" };

  const n = Number(p?.nivelPicante);
  if (Number.isFinite(n)) {
    if (n === 0) return { text: "Sin picante", cls: "meta--sin-picante" };
    if (n > 0) return { text: "Picante", cls: "meta--picante" };
  }

  const lvl = (p?.picante || p?.nivel || p?.heat || "").toString().toLowerCase();
  if (lvl.includes("sin picante") || lvl.includes("sin")) return { text: "Sin picante", cls: "meta--sin-picante" };
  if (lvl.includes("picante") || lvl.includes("pic")) return { text: "Picante", cls: "meta--picante" };

  const hay = `${p?.name || ""} ${p?.short || ""} ${p?.long || ""} ${p?.category || ""}`.toLowerCase();
  if (hay.includes("sin picante")) return { text: "Sin picante", cls: "meta--sin-picante" };
  if (hay.includes("picante")) return { text: "Picante", cls: "meta--picante" };

  return { text: "Clásico", cls: "meta--neutral" };
}



function renderSearchDrop(q) {
  ensureSearchDropdown();
  if (!searchDrop) return;

  const results = searchProducts(q);
  const list = searchDrop.querySelector(".search-drop__list");
  if (!list) return;

  if (!q.trim() || !results.length) {
    hideSearchDrop();
    return;
  }

  list.innerHTML = results.map(p => {
    const img = p.image ? `style="background-image:url('${p.image}')"` : "";

    let meta = "";
    let metaClass = "";


    if (p.category === "Promo") {
      meta = "Promo";
      metaClass = "meta--promo";
    }
    else if (p.category === "Especiales") {
      meta = "Especiales";
      metaClass = "meta--especial";
    }

    else if (p.category === "Salsas") {
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

      if (typeof closeSearchModal === "function") {
        closeSearchModal();
      } else if (searchModal && searchModal.classList.contains("is-open")) {
        closeModal(searchModal);
      }
    });
  });

}

if (searchInput) {
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

function buildWhatsAppMessage() {
  const entries = Object.entries(cart).filter(([_, q]) => q > 0);
  if (!entries.length) return "Hola! Quiero hacer un pedido.\n\n(El carrito está vacío)";
  let msg = "Hola! Quiero hacer un pedido:\n\n";
  for (const [id, qty] of entries) {
    const p = getProductById(id);
    if (!p) continue;
    msg += `(x${qty}) ${p.name} — ${money(p.price * qty)}\n`;
  }

  const promos = computePromos(cart);
  if (promos.applied.length) {
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

function openWhatsApp() {
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

function closeSidePanel() {
  sidePanel.classList.remove("is-open");
  sidePanel.setAttribute("aria-hidden", "true");
  delete sidePanel.dataset.panel;
}

document.addEventListener("click", (e) => {
  if (e.target.matches("[data-panel-close]")) {
    closeSidePanel();
  }
});

function closeDrawer() {
  if (!drawer) return;
  drawer.classList.remove("is-open");
  if (menuBtn) menuBtn.setAttribute("aria-expanded", "false");
  drawer.setAttribute("aria-hidden", "true");
  if (drawerOverlay) drawerOverlay.hidden = true;
}

function openDrawer() {
  if (!drawer) return;
  drawer.classList.add("is-open");
  if (menuBtn) menuBtn.setAttribute("aria-expanded", "true");
  drawer.setAttribute("aria-hidden", "false");
  if (drawerOverlay) drawerOverlay.hidden = false;
}

if (menuBtn && drawer) {
  menuBtn.addEventListener("click", () => {
    const isOpen = drawer.classList.contains("is-open");
    isOpen ? closeDrawer() : openDrawer();
  });

  if (drawerClose) drawerClose.addEventListener("click", closeDrawer);
  if (drawerOverlay) drawerOverlay.addEventListener("click", closeDrawer);

  drawer.addEventListener("click", (e) => {
    const btn = e.target.closest("[data-panel]");
    if (btn) {
      const key = btn.dataset.panel;

      const tpl = document.getElementById(`tpl-${key}`);
      const html = tpl ? tpl.innerHTML : `<p>Contenido no configurado.</p>`;

      const titles = {
        kimchis: "Sobre nuestros Kimchis",
        faq: "Preguntas frecuentes",
        contact: "Contacto",
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
    if (a) {
      const href = a.getAttribute("href") || "";

      if (href.startsWith("#")) {
        e.preventDefault();

        const target = document.querySelector(href);
        closeDrawer();

        if (target) {
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
const bannerDots = document.querySelectorAll(".banner__dots .dot");
const bannerPrev = document.querySelector(".banner__arrow--left");
const bannerNext = document.querySelector(".banner__arrow--right");

let bannerCurrent = 0;

function showBanner(i) {
  if (!bannerSlides.length) return;

  bannerSlides.forEach(s => s.classList.remove("is-active"));
  bannerDots.forEach(d => d.classList.remove("is-active"));

  bannerCurrent = (i + bannerSlides.length) % bannerSlides.length;

  bannerSlides[bannerCurrent].classList.add("is-active");
  if (bannerDots[bannerCurrent]) {
    bannerDots[bannerCurrent].classList.add("is-active");
  }
}

if (bannerPrev && bannerNext) {
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
    kimchis: "Sobre nuestros Kimchis",
    faq: "Preguntas frecuentes",
    contact: "Contacto",
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

document.addEventListener('DOMContentLoaded', () => {
  const searchSheet = document.getElementById('searchSheet');
  const openBtns = document.querySelectorAll('#searchBtn, #drawerSearchBtn');
  const closeOverlay = document.querySelector('.search-sheet__overlay');
  const input = document.getElementById('newSearchInput');
  const sheetBody = document.querySelector('.search-sheet__body');
  const drawer = document.getElementById('drawer');
  const drawerOverlay = document.getElementById('drawerOverlay');

  const QUICK_CATS = ["Promo", "Picante", "Sin picante", "Especiales", "Salsas"];

  function getTag(p) {
    const cat = (p.category || "").trim().toLowerCase();

    if (cat === "promo") return { label: "Promo", className: "meta--promo" };
    if (cat === "salsas") return { label: "Salsa", className: "meta--salsa" };
    if (cat === "especiales") return { label: "Especial", className: "meta--especial" };
    if (cat === "sin picante") return { label: "Sin picante", className: "meta--sin-picante" };
    if (cat === "picante") return { label: "Picante", className: "meta--picante" };

    const nameLower = (p.name || "").toLowerCase();
    if (nameLower.includes("sin picante")) return { label: "Sin picante", className: "meta--sin-picante" };
    if (nameLower.includes("picante")) return { label: "Picante", className: "meta--picante" };
    if (nameLower.includes("salsa")) return { label: "Salsa", className: "meta--salsa" };

    return null;
  }

  function renderSheetItem(p) {
    const precio = typeof money === 'function' ? money(p.price) : `$${p.price}`;
    const imgStyle = p.image ? `background-image:url('${p.image}')` : `background-color:#eee`;
    const tag = getTag(p);
    const tagHtml = tag ? `<span class="search-item__meta ${tag.className}" style="margin-top:6px; align-self:flex-start; font-size:11px;">${tag.label}</span>` : '';

    let displayName = p.name;

    if (displayName.includes("•")) {
      const parts = displayName.split("•");
      displayName = `${parts[0]} • <span style="color:#e27f3d; font-weight:800;">${parts[1]}</span>`;
    }

    return `
            <button class="sheet-item" data-id="${p.id}" style="align-items: flex-start;">
                <div class="sheet-item__img" style="${imgStyle}"></div>
                <div class="sheet-item__info">
                    <span class="sheet-item__name">${displayName}</span>
                    <span class="sheet-item__desc">${p.short || p.category}</span>
                    ${tagHtml}
                </div>
                <div class="sheet-item__price">${precio}</div>
            </button>
        `;
  }

  function renderDefaultState() {
    let pillsHtml = `<div class="sheet-pills">`;

    const catClasses = {
      "Promo": "meta--promo", "Picante": "meta--picante",
      "Sin picante": "meta--sin-picante", "Especiales": "meta--especial",
      "Salsas": "meta--salsa"
    };

    QUICK_CATS.forEach(cat => {
      const cssClass = catClasses[cat] || "";
      pillsHtml += `<button class="sheet-pill ${cssClass}" onclick="fillSearch('${cat}')">${cat}</button>`;
    });
    pillsHtml += `</div>`;

    const bestSellers = typeof products !== 'undefined' ? products.filter(p => p.bestSeller).slice(0, 3) : [];

    let bestHtml = '';
    if (bestSellers.length > 0) {
      bestHtml = `
                <div class="sheet-group">
                    <div class="sheet-group__title">🔥 Más vendidos</div>
                    <div class="sheet-list">${bestSellers.map(p => renderSheetItem(p)).join('')}</div>
                </div>
            `;
    }
    sheetBody.innerHTML = pillsHtml + bestHtml;
    setupItemClicks();
  }

  function renderResults(query) {
    if (typeof products === 'undefined') return;
    const q = query.toLowerCase().trim();

    let found = [];

    const isExactCategory = QUICK_CATS.map(c => c.toLowerCase()).includes(q);

    if (isExactCategory) {
      found = products.filter(p => (p.category || "").toLowerCase() === q);
    } else {
      found = products.filter(p => {
        const text = (p.name + ' ' + p.category + ' ' + (p.short || '')).toLowerCase();
        return text.includes(q);
      });
    }

    if (found.length === 0) {
      sheetBody.innerHTML = `<div class="sheet-group" style="text-align:center; opacity:0.6; margin-top:40px;"><p>No encontramos nada 🥺</p></div>`;
      return;
    }

    sheetBody.innerHTML = `
            <div class="sheet-group">
                <div class="sheet-group__title">Resultados</div>
                <div class="sheet-list">${found.map(p => renderSheetItem(p)).join('')}</div>
            </div>
        `;
    setupItemClicks();
  }

  function setupItemClicks() {
    const items = sheetBody.querySelectorAll('.sheet-item');
    items.forEach(btn => {
      btn.addEventListener('click', () => {
        const id = btn.dataset.id;
        const product = products.find(p => p.id == id);
        if (product && typeof openProductModal === 'function') {
          openProductModal(product);
        }
      });
    });
  }

  function openSearch() {
    if (drawer && drawer.classList.contains('is-open')) {
      drawer.classList.remove('is-open');
      if (drawerOverlay) drawerOverlay.hidden = true;
    }
    searchSheet.classList.add('is-open');
    searchSheet.setAttribute('aria-hidden', 'false');
    input.value = '';
    renderDefaultState();
    setTimeout(() => input.focus(), 100);
    document.body.style.overflow = 'hidden';
  }

  function closeSearch() {
    searchSheet.classList.remove('is-open');
    searchSheet.setAttribute('aria-hidden', 'true');
    document.body.style.overflow = '';
    input.blur();
  }

  window.fillSearch = (text) => {
    input.value = text;
    renderResults(text);
    input.focus();
  };

  openBtns.forEach(btn => btn.addEventListener('click', (e) => { e.preventDefault(); e.stopPropagation(); openSearch(); }));
  if (closeOverlay) closeOverlay.addEventListener('click', closeSearch);
  input.addEventListener('input', (e) => {
    e.target.value.trim().length === 0 ? renderDefaultState() : renderResults(e.target.value);
  });

  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape' && searchSheet.classList.contains('is-open')) closeSearch();
  });
});


window.addEventListener("load", () => {
  if (window.location.hash) {
    const target = document.querySelector(window.location.hash);

    if (target) {
      setTimeout(() => {
        const header = document.querySelector(".header");
        const offset = (header?.offsetHeight || 0) + 20;
        const y = target.getBoundingClientRect().top + window.pageYOffset - offset;

        window.scrollTo({ top: Math.max(0, y), behavior: "smooth" });
      }, 100);
    }
  }
});

document.addEventListener("DOMContentLoaded", () => {
  const track = document.getElementById("track");
  const dotsContainer = document.getElementById("appleDots");
  
  if (!track || !dotsContainer) return;

  const originalCards = Array.from(track.children);
  const cardCount = originalCards.length;

  originalCards.forEach((_, index) => {
    const dot = document.createElement("button");
    dot.className = `apple-dot ${index === 0 ? "is-active" : ""}`;
    dot.ariaLabel = `Ir al banner ${index + 1}`;
    dot.addEventListener("click", () => scrollToRealIndex(index));
    dotsContainer.appendChild(dot);
  });
  
  const dots = Array.from(dotsContainer.children);

  const cloneFirst = originalCards[0].cloneNode(true);
  const cloneLast = originalCards[cardCount - 1].cloneNode(true);
  const cloneSecond = originalCards[1].cloneNode(true);
  const cloneSecondLast = originalCards[cardCount - 2].cloneNode(true);

  cloneFirst.dataset.clone = "first";
  cloneLast.dataset.clone = "last";
  cloneSecond.dataset.clone = "second";
  cloneSecondLast.dataset.clone = "secondLast";

  track.appendChild(cloneFirst);
  track.appendChild(cloneSecond);
  track.insertBefore(cloneLast, track.firstChild);
  track.insertBefore(cloneSecondLast, track.firstChild);

  const allCards = Array.from(track.children);
  
  const startIndex = 2; 

  const getCardWidth = () => allCards[0].offsetWidth;
  const getGap = () => 20;

  const jumpToSlide = (index, smooth = false) => {
    const cardWidth = getCardWidth();
    const gap = getGap();
    const itemWidth = cardWidth + gap;
    const targetScroll = (index * itemWidth); 

    if (!smooth) track.classList.add("is-jumping");
    
    track.scrollTo({
      left: targetScroll,
      behavior: smooth ? "smooth" : "auto"
    });

    if (!smooth) {
      requestAnimationFrame(() => track.classList.remove("is-jumping"));
    }
  };

  setTimeout(() => jumpToSlide(startIndex, false), 50);

  let activeIndex = 0;
  let autoScrollTimer;
  let isScrolling = false;

  const updateActiveDot = () => {
    const cardWidth = getCardWidth();
    const gap = getGap();
    const itemWidth = cardWidth + gap;
    const scrollLeft = track.scrollLeft;
    const rawIndex = Math.round(scrollLeft / itemWidth);
    
    let realIndex = rawIndex - 2; 

    if (realIndex < 0) realIndex = cardCount + realIndex;
    if (realIndex >= cardCount) realIndex = realIndex - cardCount;

    if (activeIndex !== realIndex) {
      dots[activeIndex]?.classList.remove("is-active");
      dots[realIndex]?.classList.add("is-active");
      activeIndex = realIndex;
    }
  };

  const handleInfiniteLoop = () => {
    const cardWidth = getCardWidth();
    const gap = getGap();
    const itemWidth = cardWidth + gap;
    const scrollLeft = track.scrollLeft;
    const maxScroll = track.scrollWidth - track.clientWidth;
    
    if (scrollLeft < itemWidth * 0.5) {
      jumpToSlide(cardCount + 2 - 1, false); 
    }
    else if (scrollLeft > (itemWidth * (cardCount + 2)) - (itemWidth * 0.5)) {
      jumpToSlide(2, false);
    }
    
    updateActiveDot();
    isScrolling = false;
  };

  const scrollToRealIndex = (realIndex) => {
    jumpToSlide(realIndex + 2, true);
    resetAutoScroll();
  };

  const nextSlide = () => {
    const cardWidth = getCardWidth();
    const gap = getGap();
    track.scrollBy({ left: cardWidth + gap, behavior: "smooth" });
  };

  const startAutoScroll = () => {
    autoScrollTimer = setInterval(nextSlide, 5000);
  };

  const resetAutoScroll = () => {
    clearInterval(autoScrollTimer);
    startAutoScroll();
  };
  track.addEventListener("scroll", () => {
    if (!isScrolling) {
      window.requestAnimationFrame(updateActiveDot);
    }
    clearTimeout(track.scrollTimeout);
    track.scrollTimeout = setTimeout(handleInfiniteLoop, 150);
  });

  track.addEventListener("pointerdown", () => clearInterval(autoScrollTimer));
  track.addEventListener("touchstart", () => clearInterval(autoScrollTimer));
  track.addEventListener("pointerup", resetAutoScroll);
  track.addEventListener("touchend", resetAutoScroll);

  startAutoScroll();
});

renderAll();
