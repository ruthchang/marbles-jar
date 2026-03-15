// RevenueCat in-app purchase integration.
// RC_API_KEY: get this from RevenueCat dashboard → Project → Apps → iOS → Public SDK key
const RC_API_KEY = 'REVENUECAT_PUBLIC_SDK_KEY'; // TODO: replace before submission
const RC_ENTITLEMENT_ID = 'premium';
const RC_PRODUCT_ID = 'com.ickleruthiekins.marblejar.premium';

async function rcGetPlugin() {
    return window.Capacitor?.Plugins?.Purchases || null;
}

async function rcInit() {
    const Purchases = await rcGetPlugin();
    if (!Purchases) return;
    try {
        await Purchases.configure({ apiKey: RC_API_KEY });
    } catch (e) {
        console.warn('RevenueCat configure failed:', e);
    }
}

async function rcGetPremiumStatus() {
    const Purchases = await rcGetPlugin();
    if (!Purchases) return false;
    try {
        const { customerInfo } = await Purchases.getCustomerInfo();
        return !!customerInfo?.entitlements?.active?.[RC_ENTITLEMENT_ID];
    } catch (e) {
        console.warn('RevenueCat getCustomerInfo failed:', e);
        return false;
    }
}

async function rcPurchasePremium() {
    const Purchases = await rcGetPlugin();
    if (!Purchases) throw new Error('In-app purchase is only available in the iOS app.');

    const { offerings } = await Purchases.getOfferings();
    const pkg = offerings?.current?.availablePackages?.find(
        p => p.product?.productIdentifier === RC_PRODUCT_ID
    ) || offerings?.current?.availablePackages?.[0];

    if (!pkg) throw new Error('Premium product not found. Please try again later.');
    await Purchases.purchasePackage({ aPackage: pkg });
}

async function rcRestorePurchases() {
    const Purchases = await rcGetPlugin();
    if (!Purchases) throw new Error('Restore is only available in the iOS app.');
    await Purchases.restorePurchases();
}
