(() => {
    const localHosts = new Set(["localhost", "127.0.0.1"]);
    if (!localHosts.has(window.location.hostname)) {
        return;
    }

    let lastStamp = null;

    async function checkForChanges() {
        try {
            const response = await fetch(`/__reload__?t=${Date.now()}`, { cache: "no-store" });
            if (!response.ok) {
                return;
            }

            const { stamp } = await response.json();
            if (lastStamp === null) {
                lastStamp = stamp;
                return;
            }

            if (stamp !== lastStamp) {
                window.location.reload();
            }
        } catch (_error) {
            // Ignore transient network issues while server restarts.
        }
    }

    setInterval(checkForChanges, 1000);
    checkForChanges();
})();
