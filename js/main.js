/* Bootstrap once, after every system has registered its API. */
(function (App) {
  'use strict';
  App.initControls();
  App.initMenus();
  App.initDisplay();
  App.startEngine();
})(window.INJ);
