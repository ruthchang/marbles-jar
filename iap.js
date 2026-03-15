// RevenueCat IAP integration for Marble Jar
// Purchases plugin  — main SDK (purchases, entitlements, customer info)
// PurchasesUI plugin — native paywall + Customer Center

const RC_API_KEY = 'test_cFvMicCqCCrTyUDBQlBPgROMJdq'; // swap for production key before release
const RC_ENTITLEMENT_ID = 'Marble Jar Pro';

// ─── Plugin accessors ────────────────────────────────────────────────────────
// Both plugins are registered natively by Capacitor; we never need to import
// them as ES modules since this app uses plain script tags.

function rcPurchases() {
    return window.Capacitor?.Plugins?.Purchases ?? null;
}

function rcPurchasesUI() {
    return window.Capacitor?.Plugins?.PurchasesUI ?? null;
}

function rcIsAvailable() {
    return !!rcPurchases();
}

// ─── Initialise ──────────────────────────────────────────────────────────────

async function rcInit() {
    const Purchases = rcPurchases();
    if (!Purchases) return; // running in browser outside Capacitor — skip
    try {
        await Purchases.configure({ apiKey: RC_API_KEY });
        // Optionally enable verbose logging during development:
        // await Purchases.setLogLevel({ level: 'DEBUG' });
    } catch (e) {
        console.warn('[IAP] configure failed:', e);
    }
}

// ─── Entitlement check ───────────────────────────────────────────────────────

async function rcGetPremiumStatus() {
    const Purchases = rcPurchases();
    if (!Purchases) return false;
    try {
        const { customerInfo } = await Purchases.getCustomerInfo();
        return RC_ENTITLEMENT_ID in (customerInfo?.entitlements?.active ?? {});
    } catch (e) {
        console.warn('[IAP] getCustomerInfo failed:', e);
        return false;
    }
}

// ─── Paywall ─────────────────────────────────────────────────────────────────
// presentPaywallIfNeeded shows the paywall only when the user does NOT already
// have the entitlement.  RevenueCat handles the full purchase flow, receipt
// validation, and error messaging natively.
//
// Possible result.result values:
//   'PURCHASED'      — user just bought it
//   'NOT_PRESENTED'  — already had entitlement; paywall not shown
//   'CANCELLED'      — user dismissed without buying
//   'ERROR'          — something went wrong (RevenueCat surfaces its own alert)

async function rcPresentPaywall() {
    const UI = rcPurchasesUI();
    if (!UI) throw new Error('In-app purchases are only available in the iOS app.');

    const result = await UI.presentPaywallIfNeeded({
        requiredEntitlementIdentifier: RC_ENTITLEMENT_ID,
    });
    return result?.result ?? 'ERROR'; // 'PURCHASED' | 'NOT_PRESENTED' | 'CANCELLED' | 'ERROR'
}

// ─── Restore purchases ───────────────────────────────────────────────────────

async function rcRestorePurchases() {
    const Purchases = rcPurchases();
    if (!Purchases) throw new Error('Restore is only available in the iOS app.');
    const { customerInfo } = await Purchases.restorePurchases();
    return RC_ENTITLEMENT_ID in (customerInfo?.entitlements?.active ?? {});
}

// ─── Customer Center ─────────────────────────────────────────────────────────
// Gives users a self-serve screen to manage, restore, or get support for their
// purchase — required by Apple for apps with non-consumable IAP.

async function rcPresentCustomerCenter() {
    const UI = rcPurchasesUI();
    if (!UI) {
        alert('Customer Center is only available in the iOS app.');
        return;
    }
    try {
        await UI.presentCustomerCenter();
    } catch (e) {
        console.warn('[IAP] presentCustomerCenter failed:', e);
    }
}
