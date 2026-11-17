// Entry point for the Reef page. Order matters only for the intro, which tells the fish where
// the water surface is before they first draw.
import { initLife } from './life';
import { initCurrent, initIntro, initPearls, initScrollArt, initSkills } from './scenes';

initIntro();
initLife();
initScrollArt();
initSkills();
initCurrent();
initPearls();
