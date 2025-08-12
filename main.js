import { generarCard } from './CardGenerator.js';

const producto = {
  tipo: 'apto',
  titulo: 'Apartamento en San Andrés',
  precio: '$450.000.000',
  imagen: 'apto001.jpg',
  link: '/detalle/apto001',
  vistas: 128,
  favoritos: 42,
  atributos: {
    hab: 3,
    bañ: 2,
    m2: 94,
    estr: 4
  }
};

const container = document.querySelector('#cards');
container.insertAdjacentHTML('beforeend', generarCard(producto));
