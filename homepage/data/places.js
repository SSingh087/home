// Single source of truth for the 3D worlds, the per-place pages and the links from the classic site.
// Only facts already on the timeline / research / publications pages live here; extend freely.
export const PLACES = {
  svnit: {
    world: 'explorer', short: 'SVNIT', name: 'SVNIT Surat', period: 'to 07/2017', country: 'India',
    title: 'SVNIT, Surat · B.Tech',
    summary: 'Undergraduate studies in mechanical engineering at Sardar Vallabhbhai National Institute of Technology, with a growing side-interest in machine learning for astronomy.',
    items: [
      { id: 'mech-eng', title: 'Mechanical engineering (B.Tech)', summary: 'Undergraduate studies in mechanical engineering at SVNIT, Surat.', points: [] },
      { id: 'ml-astronomy', anim: 'galaxies', title: 'Machine learning in astronomy', summary: 'Applied machine learning to several astronomy problems.',
        points: ['Parameter estimation of gravitational waves', 'Predicting galaxy merger events', 'Parameter estimation of interacting galaxies'],
        related: ['Deep learning for estimating parameters of gravitational waves (MNRAS 508, 2021)', 'Estimating dynamical parameters of two interacting galaxies using Deep Learning (MNRAS 521, 2023)'],
        links: [['Parameter estimation of GWs (MNRAS)', 'https://doi.org/10.1093/mnras/stab2417'], ['Predicting galaxy merger events (arXiv)', 'https://arxiv.org/abs/2012.15476'], ['Interacting galaxies (MNRAS)', 'https://doi.org/10.1093/mnras/stad700'], ['Research: Machine Learning', '../research/index.html']] },
    ],
  },
  sorbonne: {
    world: 'explorer', short: 'Sorbonne', name: 'Sorbonne Université', period: 'from 09/2021', country: 'France',
    title: 'Sorbonne Université, Paris · MSc',
    summary: 'Master in Fundamental Physics and Applications (UPMC), where the work on gravitational-wave lensing began.',
    items: [
      { id: 'master-fpa', title: 'Master in Fundamental Physics and Applications', summary: 'First year of the master programme in Paris, from 09/2021.', points: [] },
      { id: 'gw-lensing-tools', anim: 'lensing', title: 'Tools to study GW lensing', summary: 'Worked on developing tools to study gravitational-wave lensing.',
        points: ['Lensing as a probe of fuzzy dark matter and the dark sector'],
        links: [['Research: GW lensing', '../research/index.html']] },
    ],
  },
  observatoire: {
    world: 'explorer', short: 'Observatoire', name: 'Observatoire de Paris · PSL', period: 'from 09/2022', country: 'France',
    title: 'Observatoire de Paris, PSL · MSc',
    summary: 'Master in Astrophysics at Observatoire de Paris, Université PSL, including an internship at SYRTE and the master thesis.',
    items: [
      { id: 'master-astro', title: 'Master in Astrophysics', summary: 'Second year of the master programme, from 09/2022.', points: [] },
      { id: 'syrte-internship', anim: 'svd', title: 'SYRTE internship: compressing EMRI waveforms', summary: 'Worked on waveform compression of extreme mass-ratio inspirals using Singular Value Decomposition, at the Systèmes de Référence Temps-Espace lab.',
        points: [], links: [['Explore SYRTE on the Experience planet', '../places/index.html?id=syrte'], ['Research: waveform compression', '../research/index.html']] },
      { id: 'master-thesis', anim: 'fdm', title: 'Master thesis: exploring the dark sector with GW lensing', summary: 'Written at the Max Planck Institute for Gravitational Physics (02/2023): used gravitational-wave lensing to explore the dark sector.',
        points: [], links: [['Explore the AEI on the Experience planet', '../places/index.html?id=aei']] },
    ],
  },
  glasgow: {
    world: 'explorer', short: 'Glasgow', name: 'University of Glasgow', period: 'from 10/2023', country: 'Scotland',
    title: 'University of Glasgow · PhD',
    summary: 'PhD on population inference with gravitational waves. With new detectors exploring ever larger volumes of the Universe, the goal is to learn the trends of the underlying population of compact objects.',
    items: [
      { id: 'phd-population', anim: 'population', title: 'PhD: population inference with GWs', summary: 'Gravitational waves travel with little dissipation, so new detectors can probe large volumes of the Universe and reveal trends in the population of compact objects: their physical traits, origins and evolution.',
        points: ['Hierarchical inference of the extreme mass-ratio inspiral (EMRI) population', 'Linking GW and multi-messenger observations to massive black hole populations'],
        related: ['Constraints on the extreme mass-ratio inspiral population from LISA data (JCAP, July 2025)', 'Revealing massive black hole astrophysics: The potential of hierarchical inference with EMRI observations (arXiv:2601.15198)', 'Disrupted stars and falling compact objects: combining multi-messenger observations to constrain the population of massive black holes (preprint, 2026)'],
        links: [['Research: Population inference', '../research/index.html'], ['Publications', '../publications/index.html']] },
    ],
  },
  'iit-indore': {
    world: 'experience', short: 'IIT Indore', name: 'IIT Indore', period: '05/2019', country: 'India',
    title: 'IIT Indore · Research internship',
    summary: 'Research internship on synthetic jet impingement and its application, with a focus on thermal performance.',
    items: [
      { id: 'synthetic-jet', anim: 'jet', title: 'Synthetic jet impingement', summary: 'Studied the effects of synthetic jet impingement and its applications, including the thermal performance and its variation with the waveform.',
        points: ['Experimental and numerical thermal-performance study', 'Effect of actuation waveform'],
        related: ['Experimental and Numerical Investigation of Thermal Performance of Synthetic Jet Impingement (ICONE/ASME 2020)', 'Experimental and numerical investigation of the thermal performance of impinging synthetic jets with different waveforms (Experimental Heat Transfer, 2021)', 'Flow and Heat Transfer analysis of an axisymmetric Impinging Synthetic Jet for Electronic Cooling (ICITFES, NIT Rourkela, 2020)'],
        links: [['Publications', '../publications/index.html']] },
    ],
  },
  aei: {
    world: 'experience', short: 'AEI', name: 'Max Planck Institute (AEI)', period: '2020 · 2022 · 2023', country: 'Germany',
    title: 'Max Planck Institute for Gravitational Physics (AEI)',
    summary: 'Three stints at the Albert Einstein Institute: an internship on LISA software, an internship on higher modes, and the master thesis on GW lensing.',
    items: [
      { id: 'lisa-pycbc', anim: 'lisa', title: 'LISA module for PyCBC (06/2020)', summary: 'Research internship: development of a LISA module for PyCBC.', points: [] },
      { id: 'higher-modes', anim: 'modes', title: 'Higher modes and pre-merger detection (07/2022)', summary: 'Research internship: studied how including higher modes affects the pre-merger detection of gravitational waves.',
        points: ['Higher harmonics refine inference of masses, spins, inclination and distance'], links: [['Research: GWs & higher modes', '../research/index.html']] },
      { id: 'thesis-lensing', anim: 'fdm', title: 'Master thesis: the dark sector with GW lensing (02/2023)', summary: 'Explored the dark sector using gravitational-wave lensing.',
        points: ['Parameter space of lensed GWs with a fuzzy-dark-matter lens', 'Extended the lensGW Python library to use PyCBC waveform templates', 'Contributing to the AEI lensing library'],
        related: ['Gravitational wave lensing: probing Fuzzy Dark Matter with LISA (JCAP, July 2025)'], links: [['Research: GW lensing', '../research/index.html']] },
    ],
  },
  syrte: {
    world: 'experience', short: 'SYRTE', name: 'SYRTE · Paris Observatory', period: '09/2022', country: 'France',
    title: 'SYRTE, Observatoire de Paris',
    summary: 'Systèmes de Référence Temps-Espace, the time and reference-systems laboratory of the Observatoire de Paris.',
    items: [
      { id: 'emri-svd', anim: 'svd', title: 'Waveform compression of EMRIs', summary: 'Worked on compressing extreme mass-ratio inspiral waveforms using Singular Value Decomposition.', points: [], links: [['Research: GW waveform compression', '../research/index.html']] },
    ],
  },
};
export const itemUrl = (id, item) => `../places/index.html?id=${id}${item ? '#' + item : ''}`;
