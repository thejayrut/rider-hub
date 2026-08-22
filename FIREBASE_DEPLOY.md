# Rider Hub Firebase Hosting deploy

The repository is already configured for Firebase project `rider-hub-506306`.

## First deploy from Jayrut's laptop

From a terminal:

```bash
npm install -g firebase-tools
firebase login
```

Then clone/open the Rider Hub repository and run from its root:

```bash
firebase use rider-hub-506306
firebase deploy --only hosting
```

Do not run `firebase init hosting` over the existing configuration unless you intend to replace `firebase.json`; the repository already contains the Hosting configuration.

## Production URL

Use this as the canonical Rider Hub URL after the first deploy:

`https://rider-hub-506306.firebaseapp.com/`

The `web.app` alias serves the same deployment, but Rider Hub redirects it to `firebaseapp.com` so mobile Firebase redirect authentication stays on the same auth origin.

## Authentication and data

- Firebase Authentication: Google provider
- Rider Hub app state: Firestore at `/users/{uid}/riderhub/state`
- Local/offline working state: browser local storage / existing Rider Hub local stores
- Private document attachments: local IndexedDB with optional Google Drive `appDataFolder` backup
- Google Drive no longer syncs the full Rider Hub state, preventing conflicts with Firestore.

## Existing GitHub Pages data

GitHub Pages and Firebase Hosting are different browser origins, so browser-only local storage cannot be copied automatically between them. The app's built-in base Rider Hub data is migrated into the first Firebase account on the new origin. Any additional changes that exist only in the old GitHub Pages browser storage should be exported with Rider Hub's Backup / Import tool and imported once on Firebase Hosting.

Keep the GitHub Pages deployment available until the Firebase-hosted build and migration are verified.

## After deployment

1. Open the canonical Firebase URL on Android.
2. Tap Continue with Google.
3. Confirm Google redirects back to Rider Hub and the account remains signed in after a reload.
4. Make a small Rider Hub change and verify Firestore creates `/users/<uid>/riderhub/state`.
5. Test offline: load Rider Hub once, disable the network, reopen/use core screens, then reconnect and use Sync app data.
6. Test Google Drive separately only if private document backup is needed.
