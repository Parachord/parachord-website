const PLAY_STORE = 'https://play.google.com/store/apps/details';
const ANDROID_PACKAGE = 'com.parachord.android';
// Anchor on the marketing homepage that scrolls to the existing
// "Download Parachord" section (id="download" in index.html). The earlier
// /apps URL never existed and 404'd on the marketing site.
const FALLBACK = 'https://parachord.com/#download';

export function storeCtaForUserAgent(ua, deepLink) {
  if (ua && /Android/i.test(ua)) {
    const referrer = encodeURIComponent(deepLink);
    return {
      href: `${PLAY_STORE}?id=${ANDROID_PACKAGE}&referrer=${referrer}`,
      label: 'Get Parachord on Google Play'
    };
  }
  // iOS, desktop, unknown — all land on the homepage download section.
  // When iOS App Store URL exists, branch on iPhone|iPad|iPod here.
  return { href: FALLBACK, label: 'Get Parachord' };
}
