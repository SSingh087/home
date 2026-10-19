import { createWorld } from '../world/engine.js';
import { svnit, sorbonne, observatoire, glasgow } from '../world/buildings.js';

createWorld({
  theme: {
    sky: ['#86c5ef', '#cfe8f5', '#fde7c6'], fog: 0xf6e3c4, exposure: 1.05,
    hemi: [0xdff0ff, 0xb9a070, 1.1], sun: [0xfff0d0, 2.4],
    ground: 0x9cc65f, lip: 0xd2ad6e, rock: [0x8a6a4a, 0x6e5238], plaza: 0xeadfc6, path: 0xe6d1a2, pad: 0xffb347,
    trunk: 0x7a5230, leaf: [0x4fa04a, 0x6dbb52], flowers: [0xff7a8a, 0xffd25a, 0xffffff, 0xb08cff],
    cloud: 0xffffff, particles: 0xffe9a0, lamp: 0.9, stars: false,
  },
  places: [
    { name: 'SVNIT Surat', short: 'SVNIT', angle: -135, dist: 23, build: svnit, title: 'SVNIT, Surat · B.Tech', text: 'Undergraduate studies in mechanical engineering, alongside machine learning for astronomy: GW parameter estimation, galaxy-merger prediction and interacting galaxies.' },
    { name: 'Sorbonne Université', short: 'Sorbonne', angle: -45, dist: 23, build: sorbonne, title: 'Sorbonne Université, Paris · MSc', text: 'Master in Fundamental Physics and Applications (from 09/2021). Developed tools to study gravitational-wave lensing.' },
    { name: 'Observatoire de Paris · PSL', short: 'Observatoire', angle: 45, dist: 23, build: observatoire, title: 'Observatoire de Paris, PSL · MSc', text: 'Master in Astrophysics (from 09/2022), including an internship at SYRTE and a master thesis at the Max Planck Institute on exploring the dark sector with GW lensing.' },
    { name: 'University of Glasgow', short: 'Glasgow', angle: 135, dist: 23, build: glasgow, title: 'University of Glasgow · PhD', text: 'Since 10/2023: population inference of compact objects with gravitational waves.' },
  ],
});
