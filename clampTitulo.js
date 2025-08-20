
            /**
        * Valida longitud del título y aplica clamping editorial si excede el límite perceptual.
        * Se integra al layout sin afectar otros bloques.
        */

const limite = 22;
document.querySelectorAll('.titulo').forEach(el => {
  const texto = el.textContent.trim();
  if (texto.length > limite) {
    el.textContent = texto.slice(0, limite - 3) + '...';
  }
});

// Efectos en el header al quedar sticky 
// Selecciona tu header
const header = document.querySelector('.header');

window.addEventListener('scroll', () => {
  if (window.scrollY > 0) {
    header.classList.add('scrolled');
  } else {
    header.classList.remove('scrolled');
  }
});

// Lógica FILTRADO
// Lógica completa de filtrado de miniaturas y togle de filtros avanzados
document.addEventListener('DOMContentLoaded', () => {
  // 🔹 BLOQUE 1: Referencias iniciales al DOM (HTML)
  const form           = document.getElementById('filters-form');
  const cards          = Array.from(document.querySelectorAll('.vitrina-vitriz .miniatura'));
  const counter        = document.getElementById('result-count'); // Opcional
  const toggleBtn      = form.querySelector('.more-filters-toggle');
  const tooltip        = form.querySelector('.filter-tooltip');
  const additional     = document.getElementById('additional-filters');
  const resetBtn       = form.querySelector('#filter-reset');
  const propertyChecks = Array.from(form.querySelectorAll('input[name="property"]'));

  // 🔹 BLOQUE 2: Mapeo entre tipo de propiedad y subfiltros correspondientes
  // Este objeto define qué grupo de subfiltros se muestra para cada propiedad
  const advancedMap = {
    casa: '.advanced-housing-filters',
    apartamento: '.advanced-housing-filters', // Usa los mismos que casa
    vehiculo: '.advanced-vehicle-filters',
    lote: '.advanced-lote-filters'
  };

  // 🔹 BLOQUE 3: Mostrar el mensaje de advertencia cuando no se ha seleccionado ninguna propiedad
  function showTooltip() {
    tooltip.classList.remove('hidden');
    tooltip.classList.add('visible');
    setTimeout(() => {
      tooltip.classList.remove('visible');
      tooltip.classList.add('hidden');
    }, 2000);
  }

  // 🔹 BLOQUE 4: Recoge todos los filtros activos del formulario
  function getFilters() {
    const data = {};

    // Recolecta todos los checkboxes marcados
    form.querySelectorAll('input[type="checkbox"]').forEach(cb => {
      if (cb.checked) {
        data[cb.name] = data[cb.name] || [];
        data[cb.name].push(cb.value);
      }
    });

    // Recolecta todos los select con valor diferente a vacío o 'all'
    form.querySelectorAll('select').forEach(sel => {
      const v = sel.value;
      if (v && v !== 'all') {
        data[sel.name] = [v];
      }
    });

    return data; // Resultado: objeto tipo { priceRange: ['low'], location: ['bogota'], ... }
  }

  // 🔹 BLOQUE 5: Mostrar/ocultar los filtros avanzados según la propiedad seleccionada
  function updateAdvanced() {
    const props = getFilters().property || []; // Propiedades activas

    // Oculta todos los grupos de subfiltros (casas, lotes, vehículos)
    Object.values(advancedMap).forEach(sel => {
      document.querySelector(sel).classList.add('hidden');
    });

    // Muestra solo los subfiltros correspondientes a la propiedad marcada
    props.forEach(val => {
      const sel = advancedMap[val];
      if (sel) document.querySelector(sel).classList.remove('hidden');
    });

    const hasProp = props.length > 0;

    // Oculta el mensaje de advertencia si hay propiedad activa
    tooltip.classList.toggle('hidden', hasProp);

    // Si no hay propiedad activa, ocultar el contenedor de filtros adicionales
    if (!hasProp) {
      additional.classList.add('hidden');
      toggleBtn.setAttribute('aria-expanded', 'false');
      toggleBtn.querySelector('.more-filters-label').textContent = 'Más filtros';
    }
  }

  // 🔹 BLOQUE 6 Y 7: Aplica el filtrado a las miniaturas visibles + NO RESULTS
  function applyFilters() {
  const filters = getFilters();
  let anyVisible = false;

  cards.forEach(card => {
    let isVisible = true;

    // 1. Validar primero que el property coincida (obligatorio si está presente)
    if (filters.property && filters.property.length > 0) {
      const cardProp = (card.dataset.property || '').toLowerCase();
      const wantedProp = filters.property.map(v => v.toLowerCase());
      if (!wantedProp.includes(cardProp)) {
        card.style.display = 'none';
        return;
      }
    }

    // 2. Evaluar priceRange SOLO si hay property activo
    if (filters.priceRange && filters.priceRange.length > 0) {
      const cardPrice = (card.dataset.pricerange || '').toLowerCase();
      const wantedPrice = filters.priceRange.map(v => v.toLowerCase());
      if (!wantedPrice.includes(cardPrice)) {
        card.style.display = 'none';
        return;
      }
    }

    // 3. Aplicar el resto de filtros (excepto property y priceRange)
    for (const [name, vals] of Object.entries(filters)) {
      if (name === 'property' || name === 'priceRange') continue; // ya evaluados

      let matched = false;

      // Lógica especial para km
      if (name === 'km') {
        const rawKm = card.dataset.km;
        const km = parseInt(rawKm, 10);
        matched = vals.some(v => {
          if (v === 'low')       return km < 20000;
          if (v === 'mid')       return km >= 20000 && km <= 50000;
          if (v === 'high')      return km > 50000 && km <= 100000;
          if (v === 'very-high') return km > 100000;
        });
      } else {
        const dataVal = (card.dataset[name] || '').toLowerCase();
        const wanted = vals.map(v => v.toLowerCase());
        matched = wanted.includes(dataVal);
      }

      if (!matched) {
        isVisible = false;
        break;
      }
    }

    card.style.display = isVisible ? '' : 'none';
    if (isVisible) anyVisible = true;
  });

  updateNoResultsMessage(!anyVisible);
}


function updateNoResultsMessage(show) {
  let message = document.getElementById('no-results-message');
  if (!message) {
    message = document.createElement('div');
    message.id = 'no-results-message';
    message.className = 'no-results hidden';
    message.textContent = 'No se encontraron resultados.';
    document.querySelector('.vitrina-vitriz')?.appendChild(message);
  }
  message.classList.toggle('hidden', !show);
}



  // 🔹 BLOQUE 8: Listeners de eventos del formulario
  // Cuando cambian los checkboxes o selects
  form.addEventListener('change', updateAdvanced);

  // Cuando se hace clic en "Más filtros"
  toggleBtn.addEventListener('click', () => {
    const hasProp = getFilters().property?.length > 0;

    if (!hasProp) {
      showTooltip(); // Mostrar advertencia
      return;
    }

    tooltip.classList.add('hidden'); // Oculta el tooltip si estaba visible
    const willHide = additional.classList.toggle('hidden'); // Alterna visibilidad
    toggleBtn.setAttribute('aria-expanded', String(!willHide));
    toggleBtn.querySelector('.more-filters-label').textContent =
      willHide ? 'Más filtros' : 'Menos filtros';

    // Asegura que se actualice el contenido mostrado
    if (!willHide) updateAdvanced();
  });

  // Oculta el mensaje si el usuario selecciona una propiedad
  propertyChecks.forEach(cb =>
    cb.addEventListener('change', () => tooltip.classList.add('hidden'))
  );

  // Envío del formulario con botón de búsqueda
  form.addEventListener('submit', e => {
    e.preventDefault();
    applyFilters();
  });

  // Cuando se hace clic en resetear filtros
  resetBtn.addEventListener('click', () => {
    form.reset();
    updateAdvanced();
    applyFilters();

    // Restablece estado de "Más filtros"
    additional.classList.add('hidden');
    toggleBtn.setAttribute('aria-expanded', 'false');
    toggleBtn.querySelector('.more-filters-label').textContent = 'Más filtros';
  });

  // 🔹 BLOQUE 9: Inicialización al cargar
  updateAdvanced(); // Muestra los filtros correctos al inicio
  applyFilters();   // Aplica filtros iniciales
});

//🔹 BLOQUE 10: location transition ZIG ZAG

// location-zigzag.js  — Pegar como archivo JS externo (reemplaza tu bloque anterior)
(function () {
  document.addEventListener("DOMContentLoaded", () => {
    const DEBUG = false; // poner false en producción

    // --------------- SELECTORES ---------------
    const wrapper = document.getElementById("lineas-wrapper");
    const svg = wrapper ? wrapper.querySelector("svg") : (document.getElementById("svg1") || document.querySelector("svg"));
    if (!svg) {
      console.error("No se encontró <svg> dentro de #lineas-wrapper o globalmente (id svg1).");
      return;
    }
    const groupLineas = svg.querySelector("#lineas-minitags");
    const location = svg.querySelector("#location");

    if (!groupLineas) {
      console.error("No se encontró <g id='lineas-minitags'> dentro del SVG.");
      return;
    }
    if (!location) {
      console.warn("No se encontró #location dentro del mismo <svg>. El script seguirá con diagnóstico de puntos.");
    }

    // --------------- util: crear SVGPoint ---------------
    function createPoint(x, y) { const p = svg.createSVGPoint(); p.x = x; p.y = y; return p; }

    // --------------- util: transforma punto local(el) -> user coords (SVG) ---------------
    // Reemplaza tu localToUser por esta versión
function localToUser(el, x, y) {
  try {
    const pt = svg.createSVGPoint();
    pt.x = x; pt.y = y;

    // 1) coords locales del elemento -> píxeles de pantalla
    const toScreen = el.getScreenCTM ? el.getScreenCTM() : el.getCTM().multiply(svg.getScreenCTM());
    const pScreen = pt.matrixTransform(toScreen);

    // 2) pantalla -> user units del <svg> raíz (viewBox)
    const inv = svg.getScreenCTM().inverse();
    const pUser = pScreen.matrixTransform(inv);

    return { x: pUser.x, y: pUser.y };
  } catch (err) {
    console.warn("localToUser fallo:", err);
    return { x, y };
  }
}
    // --------------- util: user coords -> screen/client pixels ---------------
    function userToScreen(userX, userY) {
      try {
        const pt = createPoint(userX, userY);
        return pt.matrixTransform(svg.getScreenCTM());
      } catch (err) {
        console.warn("userToScreen fallo:", err);
        return { x: userX, y: userY };
      }
    }

    // --------------- util: screen/client pixels -> user coords ---------------
    function screenToUser(screenX, screenY) {
      try {
        const pt = createPoint(screenX, screenY);
        const inv = svg.getScreenCTM().inverse();
        return pt.matrixTransform(inv);
      } catch (err) {
        console.warn("screenToUser fallo:", err);
        return { x: screenX, y: screenY };
      }
    }

    // --------------- obtener puntos (punto-a..d) con coordenadas USER ---------------
    const pointIds = ["punto-a", "punto-b", "punto-c", "punto-d"];
    const puntos = pointIds.map(id => {
      const el = svg.getElementById ? svg.getElementById(id) : document.getElementById(id);
      // fallback querySelector in case of namespace issues
      const elem = el || svg.querySelector("#" + id);
      if (!elem) return null;
      const bb = elem.getBBox();
      const cx = bb.x + bb.width / 2;
      const cy = bb.y + bb.height / 2;
      const user = localToUser(elem, cx, cy);        // user units en el SVG
      const screen = userToScreen(user.x, user.y);   // px en pantalla
      return { id, el: elem, bb, cx, cy, user: { x: user.x, y: user.y }, screen };
    }).filter(Boolean);

    console.group("Puntos detectados");
    puntos.forEach(p => {
      console.log(p.id, "bbox:", p.bb, "center(local):", { cx: p.cx, cy: p.cy }, "user:", p.user, "screen(px):", p.screen);
    });
    console.groupEnd();

    // Dibujo debug sobre SVG (opcional)
    if (DEBUG) {
      puntos.forEach(p => {
        const c = document.createElementNS("http://www.w3.org/2000/svg", "circle");
        c.setAttribute("cx", p.user.x);
        c.setAttribute("cy", p.user.y);
        c.setAttribute("r", Math.max(0.6, (svg.viewBox ? svg.viewBox.baseVal.width : svg.clientWidth) * 0.01));
        c.setAttribute("fill", "rgba(0,150,0,0.9)");
        c.setAttribute("stroke", "#fff");
        svg.appendChild(c);
      });
      for (let i = 0; i < puntos.length - 1; i++) {
        const l = document.createElementNS("http://www.w3.org/2000/svg", "line");
        l.setAttribute("x1", puntos[i].user.x);
        l.setAttribute("y1", puntos[i].user.y);
        l.setAttribute("x2", puntos[i + 1].user.x);
        l.setAttribute("y2", puntos[i + 1].user.y);
        l.setAttribute("stroke", "#F38820");
        l.setAttribute("stroke-width", Math.max(0.5, (svg.viewBox ? svg.viewBox.baseVal.width : svg.clientWidth) * 0.003));
        svg.appendChild(l);
      }
    }

    // si no hay location, terminamos con diagnóstico
    if (!location) {
      const wrapRect = wrapper && wrapper.getBoundingClientRect();
      console.log("lineas-wrapper getBoundingClientRect:", wrapRect);
      return;
    }

    // --------------- calcular ANCLA del marker en COORDENADAS LOCALES de #location ---------------
    function getLocationAnchorLocal() {
      const path = location.querySelector("path");
      if (!path) {
        console.warn("#location no tiene <path> interno para hallar ancla. Se usa getBBox() como fallback.");
        const bb = location.getBBox();
        return { x: bb.x + bb.width / 2, y: bb.y + bb.height };
      }
      const total = path.getTotalLength();
      let best = null;
      const steps = 220;
      for (let i = 0; i <= steps; i++) {
        const p = path.getPointAtLength((i / steps) * total); // p in path local coords
        // path local -> user coords
        const pUser = createPoint(p.x, p.y).matrixTransform(path.getCTM());
        // user -> location-local (invert location.getCTM)
        let pLoc;
        try {
          const locInv = location.getCTM().inverse();
          pLoc = createPoint(pUser.x, pUser.y).matrixTransform(locInv);
        } catch (err) {
          // fallback: approximate using path.getCTM inverse trick
          pLoc = { x: p.x, y: p.y };
        }
        if (!best || pLoc.y > best.y) best = { x: pLoc.x, y: pLoc.y };
      }
      return best;
    }

    const anchorLocal = getLocationAnchorLocal();
    const locBBoxLocal = location.getBBox();
    console.log("anchorLocal (coords dentro de #location):", anchorLocal, "location bbox local:", locBBoxLocal);

    // --------------- calcular scale del marker (mantener tamaño relativo al viewBox) ---------------
    const vb = svg.viewBox && svg.viewBox.baseVal ? svg.viewBox.baseVal : { width: svg.clientWidth, height: svg.clientHeight };
    const TARGET_FRACTION = 0.12; // fracción del alto del viewBox que ocupará el marker
    const desiredHeight = vb.height * TARGET_FRACTION;
    let scaleMarker = 1;
    if (locBBoxLocal.height > 0) {
      scaleMarker = desiredHeight / locBBoxLocal.height;
      if (scaleMarker > 1) scaleMarker = 1;
    }
    console.log("viewBox:", vb, "desiredHeight:", desiredHeight, "scaleMarker:", scaleMarker);

    // --------------- función que mueve #location para que su ANCLA (local) quede en user(x,y) ---------------
    const baseScale = 0.45;    // el tamaño elegante fijo
    function moveLocationToUser(userX, userY) {
      const scale = baseScale * scaleMarker;

      const tx = userX - anchorLocal.x * scale;
      const ty = userY - anchorLocal.y * scale;

      location.setAttribute("transform", `translate(${tx}, ${ty}) scale(${scale})`);
      return { tx, ty };
}

    // --------------- crear sombra elíptica ---------------
    
    // --------------- SOMBRA ELIPTICA CORRECTA Y EN SU SITIO ---------------
const shadow = svg.querySelector("#shadow");
if (!shadow) {
  console.error("No se encontró <ellipse id='shadow'> en el SVG.");
} else {
  shadow.setAttribute("pointer-events", "none");
  shadow.setAttribute("stroke", "none");
  // tu SVG ya tiene fill="url(#shadowGradient)" → se conserva estética bonita
  shadow.style.visibility = "hidden";
  shadow.style.opacity = 0;
}

function moveShadowTo(x, groundY, objY, minSize = 2, maxSize = 12) {
  if (!shadow) return;

  // === POSICIÓN EXACTA (como el antiguo, sin +5) ===
  shadow.setAttribute("cx", x);
  shadow.setAttribute("cy", groundY);

  // altura normalizada: 0 = suelo, 1 = pico
  const heightFactor = Math.max(0, Math.min(1, (groundY - objY) / Math.max(1, groundY)));

  // === TAMAÑO ===
  // horizontal más grande abajo, más pequeño arriba
  const rx = minSize + (maxSize - minSize) * (1 - heightFactor);
  // vertical más chata (como el antiguo) pero un poco más proporcionada
  const ry = rx * 0.3;

  shadow.setAttribute("rx", rx.toFixed(2));
  shadow.setAttribute("ry", ry.toFixed(2));

  // === OPACIDAD ===
  // más fuerte cerca del suelo, más débil arriba
  const opacity = 0.1 + 0.35 * (1 - heightFactor);
  shadow.setAttribute("opacity", opacity.toFixed(2));

  // nos aseguramos que no cargue el filtro feo
  shadow.removeAttribute("filter");
}


    // ============== HELPERS ==============
    const clamp = (v, min, max) => Math.max(min, Math.min(max, v));
    const lerp = (a, b, t) => a + (b - a) * t;
    function easeOutCubic(t) { t = clamp(t, 0, 1); return 1 - Math.pow(1 - t, 3); }

    // ============== PARÁMETROS DE ANIMACIÓN ==============
    const alturaSalto = 100;     // px (user units)
    const duracionSalto = 1200;  // ms
    const pausa = 300;           // ms

    function parabolaAt(t, start, end) {
      const peakY = (start.y + end.y) / 2 - alturaSalto;
      const x = (1 - t) * start.x + t * end.x;
      const y = (1 - t) * (1 - t) * start.y
        + 2 * (1 - t) * t * peakY
        + t * t * end.y;
      return { x, y };
    }

    async function animateShadowEntry(x, y, { delay = 150, duration = 500, startScale = 0.55, endScale = 1 } = {}) {
      moveShadowTo(x, y, startScale);
      shadow.style.visibility = "visible";
      shadow.style.opacity = 0;
      await new Promise(res => setTimeout(res, delay));
      const t0 = performance.now();
      return new Promise(resolve => {
        function frame(now) {
          const p = Math.min((now - t0) / duration, 1);
          const e = easeOutCubic(p);
          const s = startScale + (endScale - startScale) * e;
          moveShadowTo(x, y, s);
          shadow.style.opacity = e;
          if (p < 1) requestAnimationFrame(frame); else resolve();
        }
        requestAnimationFrame(frame);
      });
    }

    function shakeLanding(x, y, intensity = 2, duration = 300) {
      return new Promise(resolve => {
        const start = performance.now();
        function frame(now) {
          const t = (now - start) / duration;
          if (t >= 1) {
            moveLocationToUser(x, y);
            shadow.setAttribute("cx", x);
            resolve();
            return;
          }
          const offset = intensity * Math.sin(t * 6 * Math.PI) * (1 - t);
          moveLocationToUser(x + offset, y);
          shadow.setAttribute("cx", x + offset);
          requestAnimationFrame(frame);
        }
        requestAnimationFrame(frame);
      });
    }

    // ============== SALTO (parábola) ==============
    function animateJump(start, end, isLast) {
      return new Promise(resolve => {
        let t0;
        function frame(time) {
          if (!t0) t0 = time;
          const p = Math.min((time - t0) / duracionSalto, 1);
          const pos = parabolaAt(p, start, end);
          moveLocationToUser(pos.x, pos.y);
          const groundY = lerp(start.y, end.y, p);
          const height = groundY - pos.y;
          const hNorm = clamp(height / alturaSalto, 0, 1);
          const scale = 0.7 + 0.3 * (1 - hNorm);
          moveShadowTo(pos.x, groundY, scale);
          if (p < 1) {
            requestAnimationFrame(frame);
          } else {
            if (isLast) {
              setTimeout(() => {
                location.style.transition = "opacity 0.9s ease";
                shadow.style.transition = "opacity 0.9s ease";
                location.style.opacity = 0;
                shadow.style.opacity = 0;
              }, 1500);
            } else {
              shakeLanding(end.x, end.y);
            }
            setTimeout(resolve, pausa);
          }
        }
        requestAnimationFrame(frame);
      });
    }

    /// ============== SECUENCIA ==============
let sequenceStarted = false;

async function runSequence() {
  if (sequenceStarted) return;
  sequenceStarted = true;

  location.style.transition = "none";
  if (shadow) shadow.style.transition = "none";

  location.style.visibility = "hidden";
  location.style.opacity = 1;
  if (shadow) {
    shadow.style.visibility = "hidden";
    shadow.style.opacity = 0;
  }

  if (puntos.length === 0) return;

  // posiciona en el primer punto y muestra
  moveLocationToUser(puntos[0].user.x, puntos[0].user.y);
  await new Promise(r => setTimeout(r, 100));
  location.style.visibility = "visible";

  // entrada de sombra
  if (shadow) {
    await animateShadowEntry(puntos[0].user.x, puntos[0].user.y, { delay: 200, duration: 450 });
  }

  await new Promise(res => setTimeout(res, 350));

  for (let i = 0; i < puntos.length - 1; i++) {
    const isLast = i === puntos.length - 2;
    await animateJump(puntos[i].user, puntos[i + 1].user, isLast);
  }
}

// DEBUGGER FLAG
// --- DEBUG de scroll (simple) + anti-dobles disparos ---
const DEBUG_SCROLL = true;
let triggerScheduled = false; // evita que IO y fallback disparen a la vez

function triggerRunSequence(source) {
  if (sequenceStarted || triggerScheduled) {
    if (DEBUG_SCROLL) console.log(`[${source}] ignorado (sequenceStarted=${sequenceStarted}, triggerScheduled=${triggerScheduled})`);
    return;
  }
  triggerScheduled = true;
  if (DEBUG_SCROLL) console.log(`[${source}] scheduling runSequence en 120ms`);
  setTimeout(() => {
    if (!sequenceStarted) {
      if (DEBUG_SCROLL) console.log(`[${source}] runSequence()`);
      runSequence();
    }
    triggerScheduled = false;
  }, 120);
}

// Debug visual/numérico de visibilidad (no altera flujo)
function logScrollState(tag, el) {
  if (!DEBUG_SCROLL) return;
  const r = el.getBoundingClientRect();
  const vh = window.innerHeight || document.documentElement.clientHeight;
  const visible = Math.max(0, Math.min(r.bottom, vh) - Math.max(r.top, 0));
  const ratio = r.height > 0 ? visible / r.height : 0;
  console.log(`[${tag}] top:${r.top.toFixed(1)} bottom:${r.bottom.toFixed(1)} h:${r.height.toFixed(1)} visiblePx:${visible.toFixed(1)} ratio:${ratio.toFixed(2)}`);
}

// --------------- TRIGGER POR SCROLL (IntersectionObserver) ---------------
function isInViewport(el, threshold = 0.35) {
  const rect = el.getBoundingClientRect();
  const viewH = window.innerHeight || document.documentElement.clientHeight;
  const visible = Math.max(0, Math.min(rect.bottom, viewH) - Math.max(rect.top, 0));
  return rect.height > 0 && (visible / rect.height) >= threshold;
}

// Observamos el wrapper si existe, si no el svg
const targetToObserve = wrapper || svg;

const observer = new IntersectionObserver((entries, obs) => {
  for (const e of entries) {
    if (e.isIntersecting) {
      // pequeño delay para estética; quítalo si quieres reacción inmediata
      setTimeout(runSequence, 120);
      obs.disconnect();
      break;
    }
  }
}, {
  root: null,
  threshold: 0.35,         // más permisivo que 0.6
  rootMargin: "-10% 0px"   // dispara un poquito antes
});

// Inicia observación
observer.observe(targetToObserve);

// Fallbacks robustos para casos donde IO no dispara (bfcache, visibilidad, etc.)
function tryStartIfVisible() {
  if (!sequenceStarted && isInViewport(targetToObserve, 0.35)) {
    runSequence();
    observer.disconnect();
  }
}

// si ya está en viewport al cargar
tryStartIfVisible();

// cuando vuelve de bfcache (navegación atrás/adelante)
window.addEventListener("pageshow", tryStartIfVisible, { once: true });

// si el tab pasa a visible y ya está a la vista
document.addEventListener("visibilitychange", () => {
  if (document.visibilityState === "visible") tryStartIfVisible();
}, { passive: true });

// último salvavidas: un primer scroll/resize
const onceStart = () => { tryStartIfVisible(); window.removeEventListener("scroll", onceStart); window.removeEventListener("resize", onceStart); };
window.addEventListener("scroll", onceStart, { passive: true });
window.addEventListener("resize", onceStart);


    // --------------- REPORT rapido ---------------
    console.group("location-zigzag REPORT");
    console.log("wrapper rect (px):", wrapper && wrapper.getBoundingClientRect());
    console.log("svg client size (px):", { clientW: svg.clientWidth, clientH: svg.clientHeight }, "viewBox:", vb);
    console.log("puntos (user units):", puntos.map(p => ({ id: p.id, user: p.user, screen: p.screen })));
    console.log("anchorLocal (location-local units):", anchorLocal);
    console.log("scaleMarker:", scaleMarker);
    console.log("location.transform (actual):", location.getAttribute("transform"));
    console.groupEnd();

  }); // DOMContentLoaded
})();





