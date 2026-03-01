if ("serviceWorker" in navigator) {
  window.addEventListener("load", async () => {
    const isLocalhost =
      window.location.hostname === "localhost" ||
      window.location.hostname === "127.0.0.1";

    if (isLocalhost) {
      // Keep local dev deterministic: no service worker caching.
      const regs = await navigator.serviceWorker.getRegistrations();
      await Promise.all(regs.map((reg) => reg.unregister()));
      return;
    }

    const version = window.APP_VERSION || "dev";
    navigator.serviceWorker
      .register(`/sw.js?v=${encodeURIComponent(version)}`)
      .catch((error) => {
        console.warn("Service worker registration failed:", error);
      });
  });
}
