// SHA-256 fingerprints from Parachord/parachord-mobile#123.
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
// - **Release**: Google's signing cert from Play App Signing — pulled
//   from Play Console → `com.parachord.android` → Setup → App integrity
//   → App signing → App signing key certificate → SHA-256 on 2026-05-25.
//   NOT the upload key in the Android repo's CI keystore (that one
//   signs the AAB Google then re-signs with this cert).
const ASSETLINKS = [
  {
    relation: ['delegate_permission/common.handle_all_urls'],
    target: {
      namespace: 'android_app',
      package_name: 'com.parachord.android',
      sha256_cert_fingerprints: ['2F:32:00:79:AD:48:31:7E:3C:88:5F:42:07:D8:3A:7E:11:25:DC:8C:06:62:99:DB:98:C5:EA:C1:FC:79:5C:C9']
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
        // appIDs stays empty until parachord-mobile#124 (iOS) lands.
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
