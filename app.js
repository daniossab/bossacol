/* ========= CONFIGURACIÓN — editar con los datos reales de Bossa ========= */
const WHATSAPP = "573104361293"; // número con indicativo, sin "+" ni espacios

// Productos de la tienda. Sin precios: la cotización se hace por WhatsApp.
const DENSIDADES = ["Densidad 15 kg/m³", "Densidad 20 kg/m³", "Densidad 30 kg/m³"];
const PRODUCTOS = [
  { id: "bloque-madre", cat: "bloque", insignia: "2 × 1 × 0,6 m", nombre: "Bloque madre",
    desc: "Bloque macizo de EPS de 2,00 × 1,00 × 0,60 m para corte y fabricación.",
    etiqueta: "Densidad", opciones: DENSIDADES, img: "tienda-bloque-madre", alt: "Bloque de icopor blanco de forma rectangular" },
  { id: "lamina", cat: "lamina", insignia: "2 × 1 m", nombre: "Lámina de icopor",
    desc: "Lámina de EPS de 2,00 × 1,00 m para aislamiento, cielos rasos, empaque y manualidades.",
    etiqueta: "Espesor", opciones: ["2 cm", "5 cm", "10 cm", "15 cm", "20 cm", "25 cm", "30 cm"].map(e => "Espesor " + e), img: "tienda-lamina", alt: "Láminas de icopor de varios espesores apiladas en escalera" },
  { id: "lamina-medida", cat: "lamina", insignia: "A la medida", nombre: "Lámina de icopor a la medida",
    desc: "Cortamos la lámina con las medidas que necesites.",
    etiqueta: "Densidad", opciones: DENSIDADES, medidas: true, img: "tienda-lamina-medida", alt: "Pila de láminas de icopor cortadas a la medida" },
  { id: "bloque-medida", cat: "bloque", insignia: "A la medida", nombre: "Bloque de icopor a la medida",
    desc: "Cortamos el bloque con las medidas que necesites.",
    etiqueta: "Densidad", opciones: DENSIDADES, medidas: true, img: "tienda-bloque-medida", alt: "Bloques de icopor de distintos tamaños" }
];

/* ========= UTILIDADES ========= */
const $ = (s, c = document) => c.querySelector(s);
const $$ = (s, c = document) => [...c.querySelectorAll(s)];
const enlaceWA = texto => `https://wa.me/${WHATSAPP}?text=${encodeURIComponent(texto)}`;
const escapar = s => String(s).replace(/[&<>"]/g, c => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" }[c]));
const sinMovimiento = () => matchMedia("(prefers-reduced-motion: reduce)").matches;
const SALIDA = "cubic-bezier(0.23, 1, 0.32, 1)";

/* ========= TIENDA ========= */
const contProductos = $("#productos"); // solo existe en /tienda/
if (contProductos) contProductos.innerHTML = PRODUCTOS.map(p => `
  <article class="producto" id="${p.id}" data-cat="${p.cat}" data-id="${p.id}">
    <div class="visual">
      <img src="/img/${p.img}.jpg" srcset="/img/${p.img}-480.jpg 480w, /img/${p.img}.jpg 800w" sizes="(min-width: 1101px) 300px, (min-width: 641px) 48vw, 100vw" width="800" height="800" alt="${p.alt}" loading="lazy" decoding="async">
      <span class="insignia">${p.insignia}</span>
    </div>
    <div class="info">
      <h2>${p.nombre}</h2>
      <p>${p.desc}</p>
      <div class="campo">
        <label for="var-${p.id}">${p.etiqueta}</label>
        <select id="var-${p.id}" class="variante">
          ${p.opciones.map((n, i) => `<option value="${i}">${n}</option>`).join("")}
        </select>
      </div>
      ${p.medidas ? `
      <fieldset class="medidas">
        <legend>Medidas (cm)</legend>
        <div class="fila-medidas">
          <label>Ancho<input type="text" class="dim" data-dim="ancho" inputmode="decimal" autocomplete="off"></label>
          <label>Largo<input type="text" class="dim" data-dim="largo" inputmode="decimal" autocomplete="off"></label>
          <label>Alto<input type="text" class="dim" data-dim="alto" inputmode="decimal" autocomplete="off"></label>
        </div>
        <span class="error-medidas" role="alert"></span>
      </fieldset>` : ""}
      <div class="compra">
        <span class="etiqueta-campo" id="cant-${p.id}">Cantidad</span>
        <div class="cantidad" role="group" aria-labelledby="cant-${p.id}">
          <button type="button" class="menos" aria-label="Restar una unidad">−</button>
          <input type="number" class="cant" value="1" min="1" inputmode="numeric" aria-labelledby="cant-${p.id}">
          <button type="button" class="mas" aria-label="Sumar una unidad">+</button>
        </div>
      </div>
      <button class="boton agregar" type="button">Agregar al pedido</button>
    </div>
  </article>`).join("");

const CLAVE_CARRITO = "bossa-pedido-v2"; // v2: pedido sin precios
let carrito = [];
try { carrito = JSON.parse(localStorage.getItem(CLAVE_CARRITO)) || []; } catch (e) {}
const cm = n => String(n).replace(".", ",");
// Números como se escriben en Colombia: "1.250" (mil doscientos cincuenta), "450,5", "1.250,5" o "1250.5"
const numero = v => {
  let t = String(v).trim().replace(/\s/g, "");
  if (t.includes(",")) t = t.replace(/\./g, "").replace(",", ".");
  else if (/^\d{1,3}(\.\d{3})+$/.test(t)) t = t.replace(/\./g, "");
  return /^\d+(\.\d+)?$/.test(t) ? parseFloat(t) : NaN;
};
const recortarMedio = (s, max = 44) => s.length <= max ? s : s.slice(0, max - 17) + "…" + s.slice(-16);

$$(".producto").forEach(card => {
  const p = PRODUCTOS.find(x => x.id === card.dataset.id);
  const sel = $(".variante", card), cant = $(".cant", card);
  $(".menos", card).onclick = () => cant.value = Math.max(1, (parseInt(cant.value) || 1) - 1);
  $(".mas", card).onclick = () => cant.value = Math.min(9999, (parseInt(cant.value) || 0) + 1);
  $$(".dim", card).forEach(d => d.addEventListener("input", () => d.classList.remove("invalido")));
  $(".agregar", card).onclick = e => {
    let variante = p.opciones[sel.value];
    if (p.medidas) {
      const dims = $$(".dim", card), error = $(".error-medidas", card);
      const faltan = dims.filter(d => !(numero(d.value) > 0));
      dims.forEach(d => { const mal = faltan.includes(d); d.classList.toggle("invalido", mal); d.setAttribute("aria-invalid", mal); });
      if (faltan.length) {
        const nombres = faltan.map(d => "el " + d.dataset.dim);
        error.textContent = "Escribe " + (nombres.length > 1 ? nombres.slice(0, -1).join(", ") + " y " + nombres.at(-1) : nombres[0]) + " en centímetros, con números mayores que cero.";
        faltan[0].focus();
        return;
      }
      error.textContent = "";
      variante += `, ${dims.map(d => cm(numero(d.value))).join(" × ")} cm (ancho × largo × alto)`;
    }
    const clave = p.id + "|" + variante;
    const existente = carrito.find(i => i.clave === clave);
    const n = Math.min(9999, Math.max(1, parseInt(cant.value) || 1));
    existente ? existente.cantidad = Math.min(9999, existente.cantidad + n) : carrito.push({ clave, nombre: p.nombre, variante, cantidad: n });
    guardarCarrito(true);
    const b = e.currentTarget; b.textContent = "Agregado a tu pedido"; b.disabled = true;
    setTimeout(() => { b.textContent = "Agregar al pedido"; b.disabled = false; }, 1400);
    cant.value = 1;
    $$(".dim", card).forEach(d => d.value = "");
  };
});

$$(".filtro").forEach(f => f.onclick = () => {
  $$(".filtro").forEach(x => x.setAttribute("aria-pressed", x === f));
  $$(".producto").forEach(c => c.classList.toggle("oculto", f.dataset.filtro !== "todos" && c.dataset.cat !== f.dataset.filtro));
});

function guardarCarrito(latido) {
  try { localStorage.setItem(CLAVE_CARRITO, JSON.stringify(carrito)); } catch (e) {}
  pintarCarrito();
  const cont = $("#contadorCarrito");
  if (latido && !sinMovimiento() && cont.animate) cont.animate([{ transform: "scale(.8)" }, { transform: "scale(1)" }], { duration: 240, easing: SALIDA });
}
function pintarCarrito() {
  const unidades = carrito.reduce((s, i) => s + i.cantidad, 0);
  const cont = $("#contadorCarrito");
  cont.textContent = unidades > 999 ? "999+" : unidades;
  cont.classList.toggle("visible", unidades > 0);
  $("#abrirCarrito").setAttribute("aria-label", unidades ? `Ver tu pedido, ${unidades.toLocaleString("es-CO")} ${unidades === 1 ? "unidad" : "unidades"}` : "Ver tu pedido");
  $("#itemsCarrito").innerHTML = carrito.length ? carrito.map((i, idx) => `
    <div class="item">
      <b>${i.cantidad} × ${escapar(i.nombre)}</b>
      <button type="button" class="quitar" data-idx="${idx}" aria-label="Quitar ${escapar(i.nombre)} del pedido">Quitar</button>
      <small>${escapar(i.variante)}</small>
    </div>`).join("") : `<p class="vacio">Tu pedido está vacío.<br>Agrega láminas o bloques desde la tienda.</p>`;
  $$("#itemsCarrito .quitar").forEach(b => b.onclick = () => {
    carrito.splice(b.dataset.idx, 1); guardarCarrito();
    const siguiente = $("#itemsCarrito .quitar") || $("#cerrarCarrito"); siguiente.focus();
  });
  $("#enviarPedido").disabled = !carrito.length;
}
pintarCarrito();

const carritoEl = $("#carrito"), velo = $("#velo"), abrirCarritoBtn = $("#abrirCarrito");
function abrirCarrito(estado) {
  if (estado === carritoEl.classList.contains("abierto")) return;
  carritoEl.classList.toggle("abierto", estado);
  velo.classList.toggle("abierto", estado);
  carritoEl.setAttribute("aria-hidden", !estado);
  carritoEl.inert = !estado;
  ["#principal", "#barra", "#pie", "#botonWhatsapp"].forEach(s => { const el = $(s); if (el) el.inert = estado; });
  (estado ? $("#cerrarCarrito") : abrirCarritoBtn).focus();
}
abrirCarritoBtn.onclick = () => abrirCarrito(true);
$("#cerrarCarrito").onclick = velo.onclick = () => abrirCarrito(false);

$("#enviarPedido").onclick = () => {
  if (!carrito.length) return;
  const lineas = carrito.map(i => `• ${i.cantidad} × ${i.nombre}: ${i.variante}`);
  window.open(enlaceWA(`Hola Bossa, quiero cotizar este pedido:\n${lineas.join("\n")}\n¿Me pueden enviar el precio y el costo de envío?`), "_blank");
};

/* ========= COTIZADOR ========= */
// URL de la aplicación web de Google Apps Script (termina en /exec). Ver google-apps-script/INSTRUCCIONES.md
const COTIZADOR_URL = "https://script.google.com/macros/s/AKfycbz-OZMM5lo5zIhQChZP-sh47qMuzB8pTuAHie0ESSTCVsU3JdE2qm0ayV7k8VP94GK2/exec";
const formC = $("#formCotizar"); // solo existe en /cotizar/
if (formC) {
const leerArea = () => { const n = numero($("#cArea").value); return n > 0 ? n : 0; };
const fmt = (n, d = 0) => n.toLocaleString("es-CO", { maximumFractionDigits: d });
const leerNiveles = () => Math.max(1, parseInt($("#cPisos").value) || 1);
const valorRadio = n => (formC.querySelector(`input[name="${n}"]:checked`) || {}).value || "";
const AYUDA_METODO = {
  "Porones recuperables": "Se retiran al desmoldar y se reutilizan en la losa siguiente.",
  "Formaleta perdida": "El icopor queda dentro de la losa y no se reutiliza.",
  "Aligeramiento de viguetas o nervaduras": "Bloques largos de poca altura que aligeran la diferencia de altura entre los nervios o viguetas y las vigas. También se reutilizan.",
  "No estoy seguro": "Revisamos tus planos y te recomendamos el método."
};
// Los porones recuperables y los bloques de viguetas se desmoldan y se reutilizan piso a piso: una obra de
// 10 losas de 100 m² puede contratar solo 100 m² o cotizar los 1.000. Se le pregunta al cliente cuando hay
// más de una losa. Con formaleta perdida el icopor queda en cada losa, así que se cotizan todas.
const preguntaAlcance = () => valorRadio("metodo") !== "Formaleta perdida" && leerNiveles() > 1;
const alcance = () => preguntaAlcance() ? valorRadio("alcance") : leerNiveles() > 1 ? "Todas las losas" : "Una sola losa";
function areaACotizar() { // m², o null si Bossa debe recomendarla
  const area = leerArea(), a = alcance();
  return a.startsWith("Solo una") ? area : a === "Que Bossa recomiende" ? null : area * leerNiveles();
}
function estimar() {
  const area = leerArea(), total = area * leerNiveles(), h = +$("#cAltura").value / 100, metodo = valorRadio("metodo");
  $("#ayudaMetodo").textContent = AYUDA_METODO[metodo] || "";
  $("#campoAlcance").hidden = !preguntaAlcance();
  const aCotizar = areaACotizar(), viguetas = metodo.startsWith("Aligeramiento de viguetas");
  $("#estArea").textContent = total ? fmt(total) + " m²" : "— m²";
  $("#estCotizar").textContent = !area ? "— m²" : aCotizar === null ? "Por definir" : fmt(aCotizar) + " m²";
  // ~65 % del área ocupada por porones (orientativo); no aplica a los bloques de viguetas
  $("#estVolumen").textContent = !area ? "— m³" : viguetas ? "Según el despiece" : aCotizar === null ? "Por definir" : fmt(aCotizar * h * 0.65, 1) + " m³";
  // 85–120 kg/m² sobre todas las losas construidas, se reutilicen o no los porones
  $("#estCarga").textContent = !total ? "— t" : viguetas ? "Según el diseño" : `${fmt(total * 0.085, 1)}–${fmt(total * 0.12, 1)} t`;
}
["cArea", "cPisos", "cAltura"].forEach(id => $("#" + id).addEventListener("input", estimar));
formC.addEventListener("change", e => { if (e.target.name === "metodo" || e.target.name === "alcance") estimar(); });
estimar();

const MENSAJES = {
  cCiudad: "Escribe la ciudad de la obra.",
  cArea: "Escribe el área de cada losa en m², solo con números. Por ejemplo: 100 o 1.250.",
  cNombre: "Escribe tu nombre.",
  cCorreo: "Escribe un correo válido, por ejemplo nombre@empresa.com.",
  cTelefono: "Escribe un teléfono o WhatsApp de al menos 7 dígitos."
};
function validarCampo(c) {
  let ok = c.id === "cArea" ? leerArea() > 0 : c.checkValidity() && c.value.trim() !== "";
  if (c.id === "cTelefono") ok = ok && c.value.replace(/\D/g, "").length >= 7;
  c.setAttribute("aria-invalid", !ok);
  $("#e-" + c.id).textContent = ok ? "" : MENSAJES[c.id];
  return ok;
}
const requeridos = $$("[required]", formC);
requeridos.forEach(c => c.addEventListener("input", () => { if (c.getAttribute("aria-invalid") === "true") validarCampo(c); }));

/* Planos adjuntos */
const MAX_PLANOS = 5, MAX_BYTES_PLANOS = 20 * 1024 * 1024;
const EXT_PLANOS = ["pdf", "dwg", "dxf", "jpg", "jpeg", "png", "zip", "rar"];
let planos = [];
const tamano = b => b < 1048576 ? Math.max(1, Math.round(b / 1024)) + " KB" : (b / 1048576).toFixed(1).replace(".", ",") + " MB";

function agregarPlanos(lista) {
  const errores = [];
  for (const f of lista) {
    const ext = f.name.split(".").pop().toLowerCase();
    if (!EXT_PLANOS.includes(ext)) { errores.push(`${f.name}: formato no admitido. Usa PDF, DWG, DXF, JPG, PNG o ZIP.`); continue; }
    if (planos.length >= MAX_PLANOS) { errores.push(`Máximo ${MAX_PLANOS} archivos. Si tienes más, comprímelos en un ZIP.`); break; }
    if (planos.reduce((s, p) => s + p.size, 0) + f.size > MAX_BYTES_PLANOS) { errores.push(`${f.name} supera el límite de 20 MB en total. Comprime los planos o envíalos por WhatsApp.`); continue; }
    if (!planos.some(p => p.name === f.name && p.size === f.size)) planos.push(f);
  }
  $("#errorPlanos").textContent = errores.join(" ");
  pintarPlanos();
}
function pintarPlanos() {
  $("#listaPlanos").innerHTML = planos.map((f, i) =>
    `<li><span title="${escapar(f.name)}">${escapar(recortarMedio(f.name))}<small>${tamano(f.size)}</small></span><button type="button" class="quitar" data-i="${i}" aria-label="Quitar ${escapar(f.name)}">Quitar</button></li>`).join("");
  $$("#listaPlanos button").forEach(b => b.onclick = () => { planos.splice(b.dataset.i, 1); $("#errorPlanos").textContent = ""; pintarPlanos(); inputPlanos.focus(); });
}
const inputPlanos = $("#cPlanos"), zona = $("#zonaPlanos");
inputPlanos.addEventListener("change", () => { agregarPlanos(inputPlanos.files); inputPlanos.value = ""; });
["dragenter", "dragover"].forEach(ev => zona.addEventListener(ev, e => { e.preventDefault(); zona.classList.add("arrastrando"); }));
["dragleave", "drop"].forEach(ev => zona.addEventListener(ev, e => { e.preventDefault(); zona.classList.remove("arrastrando"); }));
zona.addEventListener("drop", e => agregarPlanos(e.dataTransfer.files));

const aBase64 = f => new Promise((ok, mal) => {
  const r = new FileReader();
  r.onload = () => ok(r.result.split(",")[1]);
  r.onerror = () => mal(r.error);
  r.readAsDataURL(f);
});

formC.addEventListener("submit", async e => {
  e.preventDefault();
  const invalidos = requeridos.filter(c => !validarCampo(c));
  if (invalidos.length) { invalidos[0].focus(); return; }

  const d = Object.fromEntries(new FormData(formC));
  d.area = String(leerArea());
  d.pisos = String(leerNiveles());
  d.alcance = alcance();
  const aCotizar = areaACotizar();
  d.area_cotizar = aCotizar === null ? "" : String(aCotizar);
  const boton = $("button[type=submit]", formC), ok = $("#okCotizar"), error = $("#errorCotizar");
  ok.classList.remove("visible"); error.classList.remove("visible");
  boton.disabled = true;
  boton.textContent = planos.length ? "Subiendo planos…" : "Enviando…";
  const losasTexto = (+d.pisos > 1 ? `${d.pisos} losas` : "una losa") + ` de ${fmt(+d.area, 1)} m²`;

  try {
    if (!COTIZADOR_URL) throw new Error("sin-url");
    d.planos = await Promise.all(planos.map(async f => ({ nombre: f.name, tipo: f.type, datos: await aBase64(f) })));
    // Sin cabeceras para que el navegador no haga una consulta previa (CORS) a Apps Script
    const r = await fetch(COTIZADOR_URL, { method: "POST", body: JSON.stringify(d) });
    const res = await r.json();
    if (!res.ok) throw new Error(res.error || "rechazado");

    const nPlanos = planos.length;
    ok.innerHTML = `<b>Solicitud enviada.</b> Recibimos tu solicitud para ${losasTexto} en ${escapar(d.ciudad)}${nPlanos ? ` con ${nPlanos} ${nPlanos === 1 ? "plano" : "planos"}` : ""}. Te contactaremos en máximo 48 horas hábiles. ¿Prefieres agilizar? <a href="${enlaceWA(`Hola Bossa, soy ${d.nombre}. Acabo de enviar una solicitud de cotización para ${losasTexto} en ${d.ciudad} (${d.metodo.toLowerCase()}).`)}" target="_blank" rel="noopener">Escríbenos por WhatsApp</a>.`;
    ok.classList.add("visible");
    formC.reset(); planos = []; pintarPlanos(); estimar();
    requeridos.forEach(c => c.removeAttribute("aria-invalid"));
  } catch (err) {
    console.error("Cotizador:", err);
    const wa = enlaceWA(`Hola Bossa, soy ${d.nombre} y quiero cotizar un proyecto ${d.tipo.toLowerCase()} en ${d.ciudad}: ${losasTexto}, ${d.metodo.toLowerCase()}, ${d.sistema.toLowerCase()}, altura de ${d.altura} cm. Área a cotizar: ${d.alcance.toLowerCase()}.`);
    error.innerHTML = err.message === "sin-url"
      ? `El envío del cotizador todavía no está activado en esta página. Mientras tanto, <a href="${wa}" target="_blank" rel="noopener">envíanos tu solicitud por WhatsApp</a>.`
      : `No pudimos enviar la solicitud. Revisa tu conexión e inténtalo de nuevo; tus datos siguen en el formulario. Si el problema continúa, <a href="${wa}" target="_blank" rel="noopener">envíanos la solicitud por WhatsApp</a>.`;
    error.classList.add("visible");
  } finally {
    boton.disabled = false;
    boton.textContent = "Solicitar cotización";
  }
});

} // fin del cotizador

/* ========= GUÍAS ========= */
$$(".leer").forEach(b => b.onclick = () => {
  const det = document.getElementById(b.getAttribute("aria-controls"));
  const abierto = det.classList.toggle("abierto");
  b.setAttribute("aria-expanded", abierto);
  $("span", b).textContent = abierto ? "Ver menos" : "Leer más";
});

/* ========= GENERAL ========= */
$("#anio").textContent = new Date().getFullYear();
$("#botonWhatsapp").href = enlaceWA("Hola Bossa, quiero información sobre aligeramiento de losas con EPS.");
if ($("#botonEquipo")) $("#botonEquipo").href = enlaceWA("Hola Bossa, me gustaría trabajar con ustedes. Les envío mi hoja de vida.");

const ham = $("#hamburguesa"), menu = $("#menu"), menuMovil = matchMedia("(max-width: 900px)");
function abrirMenu(si) {
  menu.classList.toggle("abierto", si);
  ham.setAttribute("aria-expanded", si);
  ham.setAttribute("aria-label", si ? "Cerrar menú" : "Abrir menú");
  menu.inert = menuMovil.matches && !si;
}
abrirMenu(false);
menuMovil.addEventListener("change", () => abrirMenu(false));
ham.onclick = () => abrirMenu(!menu.classList.contains("abierto"));
$$("#menu a").forEach(a => a.addEventListener("click", () => abrirMenu(false)));
document.addEventListener("keydown", e => {
  if (e.key !== "Escape") return;
  if (carritoEl.classList.contains("abierto")) abrirCarrito(false);
  else if (menu.classList.contains("abierto")) { abrirMenu(false); ham.focus(); }
});
document.addEventListener("click", e => { if (menu.classList.contains("abierto") && !e.target.closest("#menu, #hamburguesa")) abrirMenu(false); });

/* "Del plano a la losa": un solo revelado escalonado, una vez */
(function () {
  const sis = $("#sistema"), lista = $(".pasos-sistema");
  if (!sis || !("IntersectionObserver" in window) || sinMovimiento()) return;
  sis.classList.add("por-revelar");
  const io = new IntersectionObserver(es => { if (es[0].isIntersecting) { sis.classList.add("revelada"); io.disconnect(); } }, { threshold: .1 });
  io.observe(lista);
})();

/* ========= HERO: LA LOSA SE ARMA EN 5 PASOS =========
   Cinco renders con el mismo encuadre (img/losa-paso-1..5) apilados. Cada paso imita la acción real:
   los porones se posan (capa con máscara), el acero se tiende a lo largo de las vigas, el concreto se
   vacía desde la esquina del fondo y en el desmolde caen la formaleta y los porones. Solo transform,
   opacity y clip-path, con la Web Animations API para poder pausar, retomar e invertir sin saltos. */
(function () {
  const fig = document.getElementById("armado");
  if (!fig || !fig.animate) return;
  const capa = { c2: $(".c2", fig), c3: $(".c3", fig), c4: $(".c4", fig), c5: $(".c5", fig), d: $(".c4b", fig) };
  const cota = $(".cota", fig), linea = $(".cota-linea", fig), punto = $(".cota-punto", fig), rotulo = $(".cota-rotulo", fig);
  const botones = $$(".pasos-armado button", fig);
  const avances = botones.map(b => $(".avance", b));
  const rm = matchMedia("(prefers-reduced-motion: reduce)");
  const MOVER = "cubic-bezier(0.77, 0, 0.175, 1)";

  // Resorte críticamente amortiguado (sin rebote) como easing linear(); si no hay soporte, ease-out fuerte
  const RESORTE = (() => {
    if (!(window.CSS && CSS.supports("animation-timing-function", "linear(0, 1)"))) return SALIDA;
    const k = 7.4, p = [];
    for (let i = 0; i <= 24; i++) { const t = i / 24 * k; p.push(i === 24 ? 1 : +(1 - (1 + t) * Math.exp(-t)).toFixed(4)); }
    return `linear(${p.join(", ")})`;
  })();

  // Geometría en % del cuadro (1488 × 942 px). Acero: frente paralelo a las caras de los porones (u) que avanza a lo largo de las vigas (v).
  const W = 1488, H = 942, U = [0.945, 0.328], V = [0.8, -0.6];
  const pct = (x, y) => `${(x / W * 100).toFixed(2)}% ${(y / H * 100).toFixed(2)}%`;
  const barrido = b => {
    const L = 3000, p = [b * V[0], b * V[1]];
    const a = [p[0] - L * U[0], p[1] - L * U[1]], c = [p[0] + L * U[0], p[1] + L * U[1]];
    return `polygon(${[a, c, [c[0] - L * V[0], c[1] - L * V[1]], [a[0] - L * V[0], a[1] - L * V[1]]].map(q => pct(q[0], q[1])).join(", ")})`;
  };
  const ESTADO = {
    c2: [{ clipPath: "inset(0% 0% 100% 0%)", transform: "translateY(-4%)" }, { clipPath: "inset(0% 0% 0% 0%)", transform: "translateY(0%)" }],
    c3: [{ clipPath: barrido(-606) }, { clipPath: barrido(105) }],
    // Concreto: charco que se extiende desde la esquina del fondo, achatado al plano de la losa (ry = 0,6 rx)
    c4: [{ clipPath: "ellipse(0% 0% at 30.5% 5.8%)" }, { clipPath: "ellipse(94.1% 89.2% at 30.5% 5.8%)" }]
  };
  const PERIODO = [0, 700, 1500, 1500, 2000, 1300]; // transición + pausa de cada paso (ms); total ≈ 7 s
  const menos = () => rm.matches;
  const poner = (el, estilo) => Object.assign(el.style, estilo);

  // Animaciones vivas: se pausan con la pestaña oculta y se fijan en su valor actual al interrumpirlas
  const vivas = new Set();
  function animar(el, cuadro, ms, easing, retraso = 0) {
    const a = el.animate(cuadro, { duration: ms, easing, delay: retraso, fill: "forwards" });
    vivas.add(a);
    if (document.hidden) a.pause();
    return a.finished.then(() => { try { a.commitStyles(); } catch (e) {} a.cancel(); vivas.delete(a); return true; }, () => false);
  }
  const espera = ms => animar(fig, [], ms, "linear");
  function detener() {
    vivas.forEach(a => { try { a.commitStyles(); } catch (e) {} a.cancel(); });
    vivas.clear();
  }
  document.addEventListener("visibilitychange", () => vivas.forEach(a => document.hidden ? a.pause() : a.play()));

  function reposo(n) {
    const r = menos();
    const vis = (k, nombre) => r ? { opacity: n >= k ? "1" : "0", clipPath: "none", transform: "none" }
                                 : Object.assign({ opacity: "1" }, ESTADO[nombre][n >= k ? 1 : 0]);
    return { c2: vis(2, "c2"), c3: vis(3, "c3"), c4: vis(4, "c4"), c5: { opacity: n >= 5 ? "1" : "0" }, d: { opacity: "0", transform: r ? "none" : "translateY(5%)" } };
  }
  function marcar(n, lleno) {
    botones.forEach((b, i) => {
      const paso = i + 1;
      b.classList.toggle("hecho", paso < n);
      paso === n ? b.setAttribute("aria-current", "step") : b.removeAttribute("aria-current");
      avances[i].style.transform = `scaleX(${paso < n || (paso === n && lleno) ? 1 : 0})`;
    });
  }
  let cotaVisible = false;
  function cotaInstantanea(si) {
    cotaVisible = si;
    poner(cota, { opacity: si ? "1" : "0", visibility: si ? "visible" : "hidden" });
    poner(linea, { clipPath: "inset(0% 0% 0% 0%)" }); poner(rotulo, { opacity: "1" }); poner(punto, { opacity: "1" });
  }
  function mostrarCota() {
    if (cotaVisible) return Promise.resolve(true);
    cotaVisible = true;
    poner(cota, { visibility: "visible" });
    if (menos()) return animar(cota, { opacity: 1 }, 150, "ease");
    poner(cota, { opacity: "1" }); poner(rotulo, { opacity: "0" }); poner(punto, { opacity: "0" });
    poner(linea, { clipPath: "inset(100% 100% 0% 0%)" });
    return Promise.all([
      animar(punto, { opacity: 1 }, 120, "ease"),
      animar(linea, { clipPath: "inset(0% 0% 0% 0%)" }, 320, SALIDA),
      animar(rotulo, { opacity: 1 }, 260, SALIDA, 180)
    ]);
  }
  function ocultarCota() { cotaInstantanea(false); }

  let actual = 1, turno = 0;
  function fijar(n) {
    detener();
    const e = reposo(n);
    for (const k in e) poner(capa[k], e[k]);
    actual = n;
    marcar(n, true);
    cotaInstantanea(n === 5);
  }

  // Avanza al paso n desde lo que se ve ahora (sirve también para terminar un paso interrumpido)
  function adelante(n, rapido, mio) {
    if (menos()) {
      const e = reposo(n), t = [];
      ["c2", "c3", "c4", "c5"].forEach(k => { if (capa[k].style.opacity !== e[k].opacity) t.push(animar(capa[k], { opacity: +e[k].opacity }, 150, "ease")); });
      return Promise.all(t).then(() => n === 5 && mio === turno ? mostrarCota() : true);
    }
    const f = rapido ? .5 : 1;
    if (n === 2) {
      poner(capa.c2, { opacity: "1" });
      return Promise.all([
        animar(capa.c2, { clipPath: ESTADO.c2[1].clipPath }, 600 * f, SALIDA),
        animar(capa.c2, { transform: ESTADO.c2[1].transform }, 720 * f, RESORTE)
      ]);
    }
    if (n === 3) return animar(capa.c3, { clipPath: ESTADO.c3[1].clipPath }, 900 * f, MOVER);
    if (n === 4) return animar(capa.c4, { clipPath: ESTADO.c4[1].clipPath }, 1300 * f, MOVER);
    if (n === 5) {
      if (!(parseFloat(capa.c5.style.opacity) > 0)) poner(capa.d, { opacity: "1", transform: "translateY(0%)" });
      return Promise.all([
        animar(capa.c5, { opacity: 1 }, 200, "ease"),
        animar(capa.d, { transform: "translateY(5%)", opacity: 0 }, 650 * f, SALIDA, 120 * f)
      ]).then(() => mio === turno ? mostrarCota() : false);
    }
    return Promise.resolve(true);
  }
  // Retrocede del paso n al n-1, por el mismo camino por el que llegó
  function atras(n) {
    if (n === 5) ocultarCota();
    if (menos()) { const k = { 2: "c2", 3: "c3", 4: "c4", 5: "c5" }[n]; return animar(capa[k], { opacity: 0 }, 150, "ease"); }
    if (n === 5) return animar(capa.d, { transform: "translateY(0%)", opacity: 1 }, 300, SALIDA)
      .then(() => animar(capa.c5, { opacity: 0 }, 120, "ease"))
      .then(() => poner(capa.d, { opacity: "0", transform: "translateY(5%)" }));
    if (n === 4) return animar(capa.c4, { clipPath: ESTADO.c4[0].clipPath }, 380, SALIDA);
    if (n === 3) return animar(capa.c3, { clipPath: ESTADO.c3[0].clipPath }, 380, SALIDA);
    return Promise.all([
      animar(capa.c2, { clipPath: ESTADO.c2[0].clipPath }, 320, SALIDA),
      animar(capa.c2, { transform: ESTADO.c2[0].transform }, 320, SALIDA)
    ]);
  }

  // Clic en un paso: retoma desde el valor en pantalla, sin saltos, pasando por los pasos intermedios
  async function irA(obj) {
    const mio = ++turno;
    detener();
    marcar(obj, true);
    if (obj !== 5) ocultarCota();
    if (menos()) { // sin movimiento: un solo fundido de 150 ms hacia el paso elegido
      const e = reposo(obj);
      actual = obj;
      await Promise.all(["c2", "c3", "c4", "c5"].map(k => animar(capa[k], { opacity: +e[k].opacity }, 150, "ease")));
      if (obj === 5 && mio === turno) mostrarCota();
      return;
    }
    if (obj >= actual) await adelante(actual, true, mio);
    while (mio === turno && actual !== obj) {
      if (obj > actual) { actual++; await adelante(actual, true, mio); }
      else { await atras(actual); if (mio === turno) actual--; }
    }
  }

  async function reproducir() {
    const mio = ++turno;
    fijar(1);
    marcar(1, false);
    const llenar = n => menos() ? (poner(avances[n - 1], { transform: "scaleX(1)" }), espera(PERIODO[n]))
                                : animar(avances[n - 1], { transform: "scaleX(1)" }, PERIODO[n], "linear");
    await llenar(1);
    for (let n = 2; n <= 5 && mio === turno; n++) {
      actual = n; marcar(n, false);
      await Promise.all([adelante(n, false, mio), llenar(n)]);
    }
  }

  botones.forEach(b => b.addEventListener("click", () => irA(+b.dataset.paso)));
  $("#verDeNuevo").addEventListener("click", reproducir);
  rm.addEventListener("change", () => { turno++; fijar(menos() ? 5 : actual); });

  if (menos()) { fijar(5); return; }
  fijar(1);
  // Arranca cuando los cinco cuadros y las máscaras están decodificados, el titular ya entró y el hero está a la vista
  const decodificar = src => { const im = new Image(); im.src = src; return im.decode ? im.decode().catch(() => {}) : Promise.resolve(); };
  const listas = Promise.all($$("img.cuadro", fig).map(i => i.decode ? i.decode().catch(() => {}) : Promise.resolve())
    .concat(["/img/losa-mascara-porones.png", "/img/losa-mascara-desmolde.png"].map(decodificar)));
  const entrada = new Promise(r => setTimeout(r, 700));
  const enVista = new Promise(r => {
    if (!("IntersectionObserver" in window)) return r();
    const io = new IntersectionObserver(es => { if (es.some(e => e.isIntersecting)) { io.disconnect(); r(); } }, { threshold: .3 });
    io.observe(fig);
  });
  Promise.all([listas, entrada, enVista]).then(() => { if (turno === 0) reproducir(); });
})();
