# Rider Hub — Firebase deployment

The repository is already configured for Firebase project `rider-hub-506306`. Do **not** run `firebase init` unless the configuration is intentionally being rebuilt.

## First deployment from your own laptop

1. Install Node.js if `npm -v` is unavailable.
2. Install Firebase CLI: `npm install -g firebase-tools`
3. Authenticate: `firebase login`
4. Clone/open this repository and run `firebase use rider-hub-506306`
5. Deploy the prepared Hosting build and the matching Firestore rules:
   `firebase deploy --only hosting,firestore:rules`

Production URL after deployment:

`https://rider-hub-506306.firebaseapp.com/`

The `web.app` alias serves the same Hosting release; Rider Hub canonicalizes it to the `firebaseapp.com` origin for mobile redirect authentication.

## Post-deploy verification order

1. Open the canonical Firebase URL on Android Chrome.
2. Sign in with Google and confirm account selection returns to Rider Hub.
3. In Firestore, confirm `/users/{uid}` and `/users/{uid}/riderhub/state` appear.
4. Change one small Rider Hub value, wait for `SYNCED`, refresh, and verify it survives.
5. Turn network off, change one value, confirm `OFFLINE`, restore network, and verify it returns to `SYNCED`.
6. Open Rider Hub on a second device, sign into the same Google account and confirm the cloud state loads.
7. Test logout/login persistence and the installed PWA.
8. Test optional Google Drive file backup separately. Its OAuth client may need the Firebase Hosting origin added to Authorized JavaScript origins.

## Existing GitHub Pages data

Browser storage is isolated by origin. Data that exists only under `thejayrut.github.io` cannot be read directly by `rider-hub-506306.firebaseapp.com`. Export it from **More → Backup / Import** on GitHub Pages, then import that JSON once on the Firebase-hosted Rider Hub before making major new changes.

## Safety

- Firebase web config and browser OAuth client IDs are public identifiers.
- Never commit service-account JSON, OAuth client secrets, private keys or passwords.
- App state is Firestore-only; Google Drive is private-file backup only.
