
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


