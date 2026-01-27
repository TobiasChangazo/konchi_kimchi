const products = window.KIMCHI_PRODUCTS || [];

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

function getProductById(id) {
  return products.find(p => p.id === id);
}
function sumCartTotal(cartObj) {
  let total = 0;
  for (const [id, qty] of Object.entries(cartObj)) {
    const p = getProductById(id);
    if (!p) continue;
    total += (p.price || 0) * qty;
  }
  return total;
}

function isPromoEligibleKimchiNoEspecial(p) {
  if (!p) return false;
  const blocked = ["Especiales", "Salsas", "Promo"];
  return !blocked.includes(p.category);
}
function isSalsa(p) { return p && p.category === "Salsas"; }
function isAkusay(p) { return p && /akusay/i.test(p.name); }
function isTofu(p) { return p && /tofu/i.test(p.name); }

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
        title: "Promo 4x3 (¡El de menor valor se Descuenta!)",
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
        title: "Promo: 3 Kimchis",
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
          title: "Promo: 2 Kimchis Iguales",
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
  const baseTotal = sumCartTotal(cart);
  const { applied, discount } = computePromos(cart);
  const total = Math.max(0, baseTotal - discount);
  return { baseTotal, applied, discount, total };
}

function addToCart(id, qty = 1) {
  cart[id] = (cart[id] || 0) + qty;
  if (cart[id] <= 0) delete cart[id];
  saveCart();
  renderCheckout();
}


function renderCheckout() {
  const itemsEl = document.getElementById("checkoutItems");
  const totalsEl = document.getElementById("checkoutTotals");
  
  const steps = document.querySelectorAll('.checkoutStep');
  const track = document.getElementById("checkoutTrack"); 

  const entries = Object.entries(cart).filter(([_, q]) => q > 0);

  if (clearCheckoutBtn) {
    clearCheckoutBtn.style.display = entries.length > 0 ? "flex" : "none";
  }

  if (!entries.length) {
    itemsEl.innerHTML = `
    <div class="emptyCart">
      <img src="img/carritovacio.webp" alt="Carrito vacío" class="emptyCart__img">
      <h3 class="emptyCart__title">Tu carrito está vacío</h3>
      <p class="emptyCart__text">
        Agregá productos para empezar tu pedido.
      </p>
      <button class="btn btn--primary emptyCart__cta"
        onclick="window.location.href='index.html#catalogo'">
        VER PRODUCTOS
      </button>
    </div>
    `;

    totalsEl.innerHTML = "";
    if (goStep2Btn) goStep2Btn.style.display = "none";
    
    if (steps[1]) steps[1].style.display = 'none'; 
    
    if (track) track.style.display = 'block'; 

    showToast("⚠️ Tu carrito está vacío.");

    return;
  }

  if (goStep2Btn) goStep2Btn.style.display = "";
  
  if (steps[1]) steps[1].style.display = ''; 
  if (track) track.style.display = '';

  itemsEl.innerHTML = entries.map(([id, qty]) => {
    const p = getProductById(id);
    if (!p) return "";
    
    let displayName = p.name;
    if (p.name.includes("Pera") || p.name.includes("Remolacha")) {
        const tag = (p.category === "Picante") ? " (Picante)" : " (Sin Picante)";
        displayName = displayName.replace("•", `${tag} •`);
    }

    const bg = p.image ? `style="background-image:url('${p.image}')"` : ""; 
    return `
    <div class="cart__item">
      <div class="cart__left">
        <div class="cart__thumb" ${p.image ? `style="background-image:url('${p.image}')"` : ""}></div>
        <div>
          <div class="cart__name">${renderNameWithSize(displayName)}</div>
          <div class="cart__mini">${money(p.price)}</div>
        </div>
      </div>

      <div class="qty">
        <button data-act="dec" data-id="${p.id}">−</button>
        <strong>${qty}</strong>
        <button data-act="inc" data-id="${p.id}">+</button>
      </div>
    </div>
  `;
  }).join("");

  const { baseTotal, discount, total } = cartSummary();

  totalsEl.innerHTML = `
  <div class="checkout__row checkout__row--muted">
    <div>Subtotal</div>
    <strong>${money(baseTotal)}</strong>
  </div>

  <div class="checkout__row checkout__row--muted">
    <div>Descuento</div>
    <strong>−${money(discount)}</strong>
  </div>

  <div class="checkout__row checkout__row--total">
    <div>Total</div>
    <strong>${money(total)}</strong>
  </div>
`;
}

document.addEventListener("click", (e) => {
  const btn = e.target.closest("button[data-act]");
  if (!btn) return;
  const id = btn.dataset.id;
  const act = btn.dataset.act;
  if (act === "inc") addToCart(id, 1);
  if (act === "dec") addToCart(id, -1);
});

const deliveryBtns = document.querySelectorAll('.delivery-btn');
const deliveryInfo = document.getElementById('deliveryInfo');
const addressWrapper = document.getElementById('addressFieldWrapper');
let currentMethod = 'retiro'; 

const INFO_RETIRO = `
  <strong>📌 Punto de Retiro: Saavedra, CABA</strong>
  <b>Crisólogo Larralde 3676 3E.</b><br>
  Nos pondremos en contacto para informarte horarios y días de entrega.
  <span class="delivery-warning">⏳ Hasta 10 días corridos para entregarlo.</span>
`;

const INFO_ENVIO = `
  <strong>🚚 Envíos</strong>
  <b>Enviamos los Miércoles de 9 a 18hs</b>.<br>
  Nos pondremos en contacto para informarte horarios y días de entrega.
  <span class="delivery-warning">⏳ Hasta 10 días corridos para entregarlo.</span>
`;

function setDeliveryMethod(method) {
  currentMethod = method;

  deliveryBtns.forEach(btn => {
    if (btn.dataset.method === method) {
      btn.classList.add('is-active');
    } else {
      btn.classList.remove('is-active');
    }
  });

  if (method === 'envio') {
    addressWrapper.style.display = 'block';
    deliveryInfo.innerHTML = INFO_ENVIO;
  } else {
    addressWrapper.style.display = 'none';
    deliveryInfo.innerHTML = INFO_RETIRO;
  }
}

if (deliveryBtns.length) {
  setDeliveryMethod('retiro');

  deliveryBtns.forEach(btn => {
    btn.addEventListener('click', () => setDeliveryMethod(btn.dataset.method));
  });
}

function buildMessageNew() {
  const name = (document.getElementById("custName").value || "").trim();
  const phone = (document.getElementById("custPhone").value || "").trim();
  const notes = (document.getElementById("custNotes").value || "").trim();
  const street = (document.getElementById("custStreet")?.value || "").trim();
  const number = (document.getElementById("custNumber")?.value || "").trim();
  const ref = (document.getElementById("custRef")?.value || "").trim();

  let msg = "";

  if (currentMethod === 'envio') {
    msg += `Método de entrega: Envio\n`;
    msg += `Dirección: ${street} ${number}\n`;
    if (ref) { 
      msg += `Referencia: ${ref}\n`;
    }
  } else {
    msg += `Método de entrega: Retiro\n`;
  }

  msg += `Nombre: ${name}\n`;
  msg += `Teléfono: ${phone}\n`;

  if (notes) {
    msg += `Notas: ${notes}\n`;
  }

  msg += `\n---------------------------------\n\n`;

  msg += `🛒 Pedido:\n\n`;

  const entries = Object.entries(cart).filter(([_, q]) => q > 0);
  for (const [id, qty] of entries) {
    const p = getProductById(id);
    if (!p) continue;
    
    let finalName = p.name;
    if (p.name.includes("Pera") || p.name.includes("Remolacha")) {
        const tag = (p.category === "Picante") ? " (Picante)" : " (Sin Picante)";
        finalName = finalName.replace("•", `${tag} •`);
    }

    msg += `- ${qty} x ${finalName}\n`;
  }

  msg += `\n---------------------------------\n\n`;

  const { total, applied } = cartSummary(); 

  msg += `Total: ${money(total)}\n`;

  if (applied.length) {
    msg += `\nPromos Aplicadas:\n`;
    for (const pr of applied) {
      msg += `• ${pr.title}\n`; 
    }
  }

  return msg;
}

const sendBtn = document.getElementById("sendWhatsAppBtn");

if (sendBtn) {
  const newSendBtn = sendBtn.cloneNode(true);
  sendBtn.parentNode.replaceChild(newSendBtn, sendBtn);

  newSendBtn.addEventListener("click", async () => {
    const name = document.getElementById("custName").value.trim();
    const phone = document.getElementById("custPhone").value.trim();

    if (!name) {
      showToast("⚠️ Por favor, completá tu Nombre.");
      document.getElementById("custName").focus();
      return;
    }
    
    if (!phone || phone.length < 8) {
      showToast("⚠️ Por favor, completá tu Teléfono.");
      document.getElementById("custPhone").focus();
      return;
    }

    if (currentMethod === 'envio') {
      const street = document.getElementById("custStreet")?.value.trim();
      const number = document.getElementById("custNumber")?.value.trim();
      
      if (!street) {
        showToast("⚠️ Falta la Calle de envío.");
        document.getElementById("custStreet").focus();
        return;
      }
      if (!number) {
        showToast("⚠️ Falta la Altura de envío.");
        document.getElementById("custNumber").focus();
        return;
      }
    }

    const text = buildMessageNew();

    try {
      await navigator.clipboard.writeText(text);
      showToast("¡Pedido copiado! 📋 Pegalo en el chat.");

      // Limpiar carrito
      cart = {}; 
      saveCart(); 

      setTimeout(() => {
        window.location.href = "https://ig.me/m/konchi.kimchi";
      }, 2000);

    } catch (err) {
      showToast("Error al copiar. Redirigiendo...");
      setTimeout(() => {
         window.location.href = "https://ig.me/m/konchi.kimchi";
      }, 1000);
    }
  });
}

function showToast(msg) {
  let toast = document.querySelector(".toast");
  if (!toast) {
    toast = document.createElement("div");
    toast.className = "toast";
    document.body.appendChild(toast);
  }
  
  toast.textContent = msg;
  toast.classList.add("is-visible");

  setTimeout(() => {
    toast.classList.remove("is-visible");
  }, 3000);
}

const inputName = document.getElementById("custName");
const inputPhone = document.getElementById("custPhone");

if (inputName) {
  inputName.addEventListener("input", function() {
    this.value = this.value.replace(/[^a-zA-ZáéíóúÁÉÍÓÚñÑ\s]/g, '');
  });
}

if (inputPhone) {
  inputPhone.addEventListener("input", function() {
    this.value = this.value.replace(/[^0-9]/g, '');
  });
}

function initPayPills() {
  const select = document.getElementById("payMethod");
  const wrap = document.getElementById("payPills");
  if (!select || !wrap) return;

  const btns = Array.from(wrap.querySelectorAll(".payPill"));

  function setActive(value) {
    select.value = value || "";
    btns.forEach(b => {
      const on = (b.dataset.pay === select.value);
      b.classList.toggle("is-active", on);
      b.setAttribute("aria-checked", on ? "true" : "false");
    });
  }

  btns.forEach(b => b.addEventListener("click", () => setActive(b.dataset.pay)));
  select.addEventListener("change", () => setActive(select.value));

  setActive(select.value);
}

const clearCheckoutBtn = document.getElementById("clearCheckoutBtn");
const confirmModal = document.getElementById("confirmModal");
const cancelClearBtn = document.getElementById("cancelClearBtn");
const confirmClearBtn = document.getElementById("confirmClearBtn");

function toggleConfirmModal(show) {
  if (confirmModal) {
    confirmModal.classList.toggle("is-active", show);
  }
}

if (clearCheckoutBtn) {
  clearCheckoutBtn.addEventListener("click", () => toggleConfirmModal(true));
}

if (cancelClearBtn) {
  cancelClearBtn.addEventListener("click", () => toggleConfirmModal(false));
}

if (confirmClearBtn) {
  confirmClearBtn.addEventListener("click", () => {
    cart = {};         
    saveCart();         
    renderCheckout();  
    toggleConfirmModal(false); 
  });
}

if (confirmModal) {
  confirmModal.addEventListener("click", (e) => {
    if (e.target.classList.contains("confirm-modal__overlay")) {
      toggleConfirmModal(false);
    }
  });
}

const flowEl = document.getElementById("checkoutFlow");
const goStep2Btn = document.getElementById("goStep2Btn");
const backStep1Btn = document.getElementById("backStep1Btn");

const steps = document.querySelectorAll('.checkoutStep');

function setStep(n) {
  if (!flowEl) return;

  steps.forEach(s => s.classList.remove('is-hidden-step'));

  flowEl.classList.toggle("is-step2", n === 2);
  document.body.classList.toggle("is-step2", n === 2);

  window.scrollTo({ top: 0, behavior: "smooth" });

  setTimeout(() => {
    if (n === 1) {
      if(steps[1]) steps[1].classList.add('is-hidden-step');
    } else {
      if(steps[0]) steps[0].classList.add('is-hidden-step');
    }
  }, 350);
}

document.addEventListener("DOMContentLoaded", () => {
    if(steps[1]) steps[1].classList.add('is-hidden-step');
});

if (goStep2Btn) goStep2Btn.addEventListener("click", () => setStep(2));

if (backStep1Btn) backStep1Btn.addEventListener("click", (e) => {
  e.preventDefault();
  e.stopPropagation();

  if (flowEl && flowEl.classList.contains("is-step2")) {
    setStep(1);
    window.scrollTo({ top: 0, behavior: "smooth" });
    return;
  }

  window.location.href = "index.html";
});

setStep(1);


initPayPills();
renderCheckout();
