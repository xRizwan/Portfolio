// Entry point for the Space page. Order matters in two places: the ship is set up before the
// launch (the launch rocket flies to wherever the ship is this frame), and the frame loop starts
// last, once everything has subscribed.
import { initFlight } from './flight';
import { startFrames } from './frame';
import { initLaunch } from './launch';
import { initCertificates, initDrift, initRise, initTilt } from './scenes';
import { initShip } from './ship';
import { initSkills } from './skills';
import { initSky } from './sky';

initSky();
const ship = initShip();
initLaunch(ship);
initRise();
initDrift();
initTilt();
initSkills();
initFlight();
initCertificates();
startFrames();
