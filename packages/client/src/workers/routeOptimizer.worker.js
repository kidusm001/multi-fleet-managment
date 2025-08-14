// Minimal worker placeholder to satisfy bundling. If future offloading is needed,
// move the heavy work from optimizeRoute here.
self.onmessage = (e) => {
  // Echo back data; real optimization happens in main thread for now.
  self.postMessage({ ok: true, received: e.data });
};
