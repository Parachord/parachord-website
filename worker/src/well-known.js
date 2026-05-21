// SHA-256 fingerprints are PLACEHOLDERS. Real values come from
// https://github.com/Parachord/parachord-android/issues/123.
// They are not secrets — every release APK exposes them — so they live
// in source. Swap inline and redeploy once #123 delivers them.
const ASSETLINKS = [
  {
    relation: ['delegate_permission/common.handle_all_urls'],
    target: {
      namespace: 'android_app',
      package_name: 'com.parachord.android',
      sha256_cert_fingerprints: ['REPLACE_WITH_RELEASE_SHA256_FROM_ISSUE_123']
    }
  },
  {
    relation: ['delegate_permission/common.handle_all_urls'],
    target: {
      namespace: 'android_app',
      package_name: 'com.parachord.android.debug',
      sha256_cert_fingerprints: ['REPLACE_WITH_DEBUG_SHA256_FROM_ISSUE_123']
    }
  }
];

export function handleAssetLinks() {
  return new Response(JSON.stringify(ASSETLINKS, null, 2), {
    status: 200,
    headers: {
      'Content-Type': 'application/json; charset=utf-8',
      'Cache-Control': 'public, max-age=3600'
    }
  });
}
