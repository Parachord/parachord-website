const PLAY_STORE = 'https://play.google.com/store/apps/details';
const ANDROID_PACKAGE = 'com.parachord.android';
const FALLBACK = 'https://parachord.com/apps';

export function storeCtaForUserAgent(ua, deepLink) {
  if (ua && /Android/i.test(ua)) {
    const referrer = encodeURIComponent(deepLink);
    return {
      href: `${PLAY_STORE}?id=${ANDROID_PACKAGE}&referrer=${referrer}`,
      label: 'Get Parachord on Google Play'
    };
  }
  // iOS, desktop, unknown — all land on /apps until iOS App Store URL exists.
  return { href: FALLBACK, label: 'Get Parachord' };
}
