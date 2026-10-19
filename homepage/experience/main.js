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
    { name: 'IIT Indore', short: 'IIT Indore', angle: 180, dist: 23, build: iitIndore, title: 'IIT Indore · Research internship', text: 'Summer 2019 (05/19): studied the effects of synthetic jet impingement and its applications, including thermal performance and its variation with the waveform.' },
    { name: 'Max Planck Institute (AEI)', short: 'AEI', angle: 60, dist: 23, build: aei, title: 'Max Planck Institute for Gravitational Physics (AEI)', text: 'Three stints: 06/2020 LISA module for PyCBC; 07/2022 higher modes and pre-merger detection of GWs; 02/2023 Master thesis on exploring the dark sector with GW lensing.' },
    { name: 'SYRTE · Paris Observatory', short: 'SYRTE', angle: -60, dist: 23, build: syrte, title: 'SYRTE, Observatoire de Paris', text: 'Systèmes de Référence Temps-Espace (09/2022): worked on waveform compression of EMRIs using Singular Value Decomposition.' },
  ],
});
