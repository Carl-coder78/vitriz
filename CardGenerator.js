export function generarCard(producto) {
  const { tipo, titulo, precio, imagen, link, vistas, favoritos, atributos = {} } = producto;

  const claseTipo = `tipo-${tipo}`;
  const cardHTML = `
    <article class="card ${claseTipo}">
      <a href="${link}" class="card-link">
        <figure class="card-media">
          <img src="${imagen}" alt="${titulo}" />
        </figure>
        <div class="card-body">
          <h3 class="card-titulo">${titulo}</h3>
          <div class="card-precio">${precio}</div>
          <div class="card-datos">
            ${vistas ? `<span class="ico ico-eye">${vistas}</span>` : ''}
            ${favoritos ? `<span class="ico ico-heart">${favoritos}</span>` : ''}
          </div>
          <ul class="card-atributos">
            ${Object.entries(atributos).map(([key, val]) =>
              `<li><span class="ico ico-${key}"></span> ${val}</li>`
            ).join('')}
          </ul>
        </div>
      </a>
    </article>
  `;
  return cardHTML.trim();
}
