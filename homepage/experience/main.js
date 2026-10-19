import { createWorld } from '../world/engine.js';
import { iitIndore, aei, observatoire } from '../world/buildings.js';

// Experience planet: a bright, cheerful candy-pastel world. No flag/landmark props here.
createWorld({
  theme: {
    sky: ['#5ec3ff', '#a9e4ff', '#ffe8b0'], fog: 0xdff3ff, exposure: 1.1,
    hemi: [0xe8f6ff, 0xffd9a8, 1.25], sun: [0xfff3d6, 2.5],
    ground: 0xb6e68f, lip: 0xffc27a, rock: [0xf0a98a, 0xd9886b], plaza: 0xfff1d8, path: 0xffe2b5, pad: 0xff6fae,
    trunk: 0x9a6a48, leaf: [0xff8fb8, 0xffc34d], flowers: [0xff6fae, 0xffd25a, 0xffffff, 0x6bd6ff],
    cloud: 0xffffff, particles: 0xfff3a0, lamp: 0.9, stars: false,
  },
  places: [
    { id: 'iit-indore', angle: 180, dist: 23, build: iitIndore, opts: { props: false } },
    { id: 'aei', angle: 60, dist: 23, build: aei, opts: { props: false } },
    { id: 'syrte', angle: -60, dist: 23, build: observatoire, opts: { props: false } }, // same building as the Education island's Observatoire
  ],
});
