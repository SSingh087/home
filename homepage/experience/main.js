import { createWorld } from '../world/engine.js';
import { iitIndore, aei, syrte } from '../world/buildings.js';

createWorld({
  theme: {
    sky: ['#1b1244', '#6b3a7a', '#f2a56a'], fog: 0x7a4a80, exposure: 1.1,
    hemi: [0xffc9a0, 0x4a3a6a, 1.15], sun: [0xffb27a, 2.3],
    ground: 0x9a8fd0, lip: 0xe0a060, rock: [0x4a3a66, 0x3a2c55], plaza: 0xd8c8dc, path: 0xe2c3a2, pad: 0x6be3ff,
    trunk: 0x5a3a4a, leaf: [0x6a62c8, 0xa08cf0], flowers: [0xffd25a, 0x6be3ff, 0xff7a8a, 0xffffff],
    cloud: 0xf2b8a0, particles: 0xfff0a0, lamp: 2.2, stars: true,
  },
  places: [
    { id: 'iit-indore', angle: 180, dist: 23, build: iitIndore },
    { id: 'aei', angle: 60, dist: 23, build: aei },
    { id: 'syrte', angle: -60, dist: 23, build: syrte },
  ],
});
