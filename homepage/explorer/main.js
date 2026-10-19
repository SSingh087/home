import { createWorld } from '../world/engine.js';
import { svnit, sorbonne, observatoire, glasgow } from '../world/buildings.js';
import { eiffel } from '../world/props.js';

createWorld({
  startYaw: Math.PI, // look from the south so the Eiffel Tower sits behind the plaza
  theme: {
    sky: ['#86c5ef', '#cfe8f5', '#fde7c6'], fog: 0xf6e3c4, exposure: 1.05,
    hemi: [0xdff0ff, 0xb9a070, 1.1], sun: [0xfff0d0, 2.4],
    ground: 0x9cc65f, lip: 0xd2ad6e, rock: [0x8a6a4a, 0x6e5238], plaza: 0xeadfc6, path: 0xe6d1a2, pad: 0xffb347,
    trunk: 0x7a5230, leaf: [0x4fa04a, 0x6dbb52], flowers: [0xff7a8a, 0xffd25a, 0xffffff, 0xb08cff],
    cloud: 0xffffff, particles: 0xffe9a0, lamp: 0.9, stars: false,
  },
  // text for each place lives in ../data/places.js
  places: [
    { id: 'svnit', angle: -135, dist: 23, build: svnit },
    { id: 'sorbonne', angle: -45, dist: 23, build: sorbonne },
    { id: 'observatoire', angle: 45, dist: 23, build: observatoire },
    { id: 'glasgow', angle: 135, dist: 23, build: glasgow },
  ],
  extras: [{ angle: 0, dist: 33, build: eiffel, scale: 0.7 }], // Paris, between the Sorbonne and the Observatoire
});
