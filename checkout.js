// checkout.js
const products = window.KIMCHI_PRODUCTS || [];

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
function escapeHtml(str){
  return String(str)
    .replaceAll("&","&amp;")
    .replaceAll("<","&lt;")
    .replaceAll(">","&gt;")
    .replaceAll('"',"&quot;")
    .replaceAll("'","&#039;");
}
function getProductById(id){
  return products.find(p => p.id === id);
}
function sumCartTotal(cartObj){
  let total = 0;
  for (const [id, qty] of Object.entries(cartObj)){
    const p = getProductById(id);
    if (!p) continue;
    total += (p.price||0) * qty;
  }
  return total;
}

// helpers promos (pegalo arriba de computePromos o antes de cartSummary)
function isPromoEligibleKimchiNoEspecial(p){
  if (!p) return false;
  const blocked = ["Especiales", "Salsas", "Promo"];
  return !blocked.includes(p.category);
}
function isSalsa(p){ return p && p.category === "Salsas"; }
function isAkusay(p){ return p && /akusay/i.test(p.name); }
function isTofu(p){ return p && /tofu/i.test(p.name); }

function computePromos(cartObj){
  const remaining = { ...cartObj }; // copia
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
    // precio DESC para maximizar ahorro en packs precio fijo
    arr.sort((a,b) => (getProductById(b)?.price||0) - (getProductById(a)?.price||0));
    return arr;
  };

  // PROMO 1: 1 Akusay (picante o blanco) + 1 Tofu (especial) = 35.000
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

  // PROMO 4: 3 Salsas = 40.000
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

  // PROMO 3: 3 Kimchis = 50.000 (variados) excluye especiales
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

  // PROMO 2: 2 Kimchis Iguales = 35.000 (sin especiales)
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

  // descuento total
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
  const baseTotal = sumCartTotal(cart);
  const { applied, discount } = computePromos(cart);
  const total = Math.max(0, baseTotal - discount);
  return { baseTotal, applied, discount, total };
}

function addToCart(id, qty=1){
  cart[id] = (cart[id] || 0) + qty;
  if (cart[id] <= 0) delete cart[id];
  saveCart();
  renderCheckout();
}

function renderCheckout(){
  const itemsEl = document.getElementById("checkoutItems");
  const totalsEl = document.getElementById("checkoutTotals");

  const entries = Object.entries(cart).filter(([_,q]) => q > 0);

 if (!entries.length){
  itemsEl.innerHTML = `
    <div class="emptyCart">
      <img src="img/carritovacio.webp" alt="Carrito vacío" class="emptyCart__img">
      <h3 class="emptyCart__title">Tu carrito está vacío</h3>
      <p class="emptyCart__text">
        Agregá productos para empezar tu pedido.
      </p>
      <button class="btn btn--primary emptyCart__cta"
        onclick="window.location.href='index.html'">
        Ver productos
      </button>
    </div>
  `;

  totalsEl.innerHTML = "";

  // 👇 OCULTAR botón Continuar
  if (goStep2Btn) goStep2Btn.style.display = "none";

  return;
}

// 👇 hay productos → mostrar botón Continuar
if (goStep2Btn) goStep2Btn.style.display = "";

    // Items (con foto)
itemsEl.innerHTML = entries.map(([id, qty]) => {
  const p = getProductById(id);
  if (!p) return "";
  const bg = p.image ? `background-image:url('${p.image}')` : "";
  return `
    <div class="cart__item">
      <div class="cart__left">
        <div class="cart__thumb" style="${bg}"></div>
        <div>
          <div class="cart__name">${escapeHtml(p.name)}</div>
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

// Click +/−
document.addEventListener("click", (e) => {
  const btn = e.target.closest("button[data-act]");
  if (!btn) return;
  const id = btn.dataset.id;
  const act = btn.dataset.act;
  if (act === "inc") addToCart(id, 1);
  if (act === "dec") addToCart(id, -1);
});

// WhatsApp
function buildWhatsAppMessage(){
  const name = (document.getElementById("custName").value || "").trim();
  const pay  = (document.getElementById("payMethod").value || "").trim();
  const notes = (document.getElementById("custNotes").value || "").trim();

  const entries = Object.entries(cart).filter(([_,q]) => q > 0);

  let msg = `Hola! Quiero hacer un pedido 🥬\n\n`;

  if (name) msg += `*Nombre:* ${name}\n`;
  if (pay) msg += `*Pago:* ${pay}\n`;
  if (notes) msg += `*Notas:* ${notes}\n`;
  msg += `\n*Detalle:*\n`;

  for (const [id, qty] of entries){
    const p = getProductById(id);
    if (!p) continue;
    msg += `• x${qty} ${p.name} — ${money(p.price * qty)}\n`;
  }

  const { baseTotal, applied, discount, total } = cartSummary();

  if (applied.length){
    msg += `\n*Promos aplicadas:*\n`;
    for (const pr of applied){
      msg += `• ${pr.title} — ${money(pr.price)}\n`;
    }
    msg += `*Ahorro:* -${money(discount)}\n`;
  }

  msg += `\n*Subtotal:* ${money(baseTotal)}\n`;
  msg += `*Total:* ${money(total)}\n`;

  return msg;
}

function openWhatsApp(){
  // poné tu número real:
  const phone = "5490000000000";
  const text = buildWhatsAppMessage();
  const url = `https://wa.me/${phone}?text=${encodeURIComponent(text)}`;
  window.open(url, "_blank");
}

document.getElementById("sendWhatsAppBtn").addEventListener("click", () => {
  const name = (document.getElementById("custName").value || "").trim();
  const pay  = (document.getElementById("payMethod").value || "").trim();

  // validación simple
  if (!name){
    alert("Poné tu nombre y apellido.");
    return;
  }
  if (!pay){
    alert("Elegí el medio de pago.");
    return;
  }

  openWhatsApp();
});

const flowEl = document.getElementById("checkoutFlow");
const goStep2Btn = document.getElementById("goStep2Btn");
const backStep1Btn = document.getElementById("backStep1Btn");

function setStep(n){
  if (!flowEl) return;
  flowEl.classList.toggle("is-step2", n === 2);
}

if (goStep2Btn) goStep2Btn.addEventListener("click", () => setStep(2));
if (backStep1Btn) backStep1Btn.addEventListener("click", () => setStep(1));

setStep(1);


// init
renderCheckout();
