// SHA-256 fingerprints from Parachord/parachord-android#123.
//
// These are NOT secrets — every release APK exposes its cert, and the
// debug-key value is universal across every Android developer's
// `~/.android/debug.keystore` (Google ships the same default keystore
// in the SDK). They live in source.
//
// - **Debug**: extracted via `keytool -list -v -keystore
//   ~/.android/debug.keystore -alias androiddebugkey -storepass
//   android -keypass android` on 2026-05-25. Matches the debug APK
//   the Android team sideloads via `./gradlew installDebug`.
//
// - **Release**: still placeholder. This app uses Play App Signing,
//   so the cert that matters for App Links verification is Google's
//   signing cert, NOT the upload key in the repo's CI keystore. Pull
//   from Play Console → Setup → App integrity → App signing → App
//   signing key certificate → SHA-256 certificate fingerprint, and
//   swap inline.
const ASSETLINKS = [
  {
    relation: ['delegate_permission/common.handle_all_urls'],
    target: {
      namespace: 'android_app',
      package_name: 'com.parachord.android',
      sha256_cert_fingerprints: ['REPLACE_WITH_RELEASE_SHA256_FROM_PLAY_CONSOLE']
    }
  },
  {
    relation: ['delegate_permission/common.handle_all_urls'],
    target: {
      namespace: 'android_app',
      package_name: 'com.parachord.android.debug',
      sha256_cert_fingerprints: ['BB:C4:49:AF:39:A3:AA:31:10:F8:A6:C2:E7:29:88:4E:E4:34:1B:38:E1:C3:E9:F5:9A:34:91:BF:23:ED:A0:EB']
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

const AASA = {
  applinks: {
    details: [
      {
        // appIDs stays empty until parachord-android#124 (iOS) lands.
        appIDs: [],
        components: [
          { '/': '/play',           '?': { '*': '*' } },
          { '/': '/play/*' },
          { '/': '/listen-along',   '?': { '*': '*' } },
          { '/': '/import',         '?': { '*': '*' } },
          { '/': '/queue/*' },
          { '/': '/control/*' },
          { '/': '/shuffle/*' },
          { '/': '/volume/*' },
          { '/': '/artist/*' },
          { '/': '/album/*' },
          { '/': '/playlist/*' },
          { '/': '/library*' },
          { '/': '/history*' },
          { '/': '/friend/*' },
          { '/': '/recommendations*' },
          { '/': '/playlists' },
          { '/': '/charts' },
          { '/': '/critics-picks' },
          { '/': '/settings*' },
          { '/': '/search',         '?': { '*': '*' } },
          { '/': '/chat',           '?': { '*': '*' } },
          { '/': '/home' }
        ]
      }
    ]
  }
};

export function handleAasa() {
  return new Response(JSON.stringify(AASA, null, 2), {
    status: 200,
    headers: {
      'Content-Type': 'application/json; charset=utf-8',
      'Cache-Control': 'public, max-age=3600'
    }
  });
}
