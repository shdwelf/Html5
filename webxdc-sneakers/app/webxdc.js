/* Offline preview shim. Delta Chat / ArcaneChat provide the real API at runtime. */
(function () {
  if (window.webxdc) return;
  window.webxdc = {
    selfAddr: "preview@local",
    selfName: "Preview",
    sendUpdate: function () {},
    setUpdateListener: function () { return Promise.resolve(); },
    sendToChat: function () { return Promise.resolve(); },
    importFiles: function () { return Promise.resolve([]); }
  };
})();
