/** Browser / static-server stub. Messenger hosts inject the real API. */
(function () {
  if (window.webxdc) return;
  const updates = [];
  window.webxdc = {
    selfAddr: "preview@local",
    selfName: "Preview",
    sendUpdate(update) {
      updates.push({ ...update, serial: updates.length + 1 });
    },
    setUpdateListener(cb) {
      updates.forEach((u) => cb(u));
      return Promise.resolve();
    },
    sendToChat() {
      return Promise.resolve();
    },
    importFiles() {
      return Promise.resolve([]);
    },
  };
})();
