# Rider Hub runtime ownership

Rider Hub is intentionally still a progressive enhancement of the original local-first app. To reduce accidental function overrides, each runtime layer now has one primary responsibility.

- `app.js` — original Rider Hub state, Banswara ride data, core render/save/import/export primitives, local IndexedDB document store, service-worker registration.
- `enhancements.js`, `phase2e-restore.js`, `phase3-live.js` — approved UI/features layered over the core app.
- `phase3-account.js` — legacy account shell, private-file UI and related utility screens. Its old authentication wording/handlers are compatibility-only.
- `phase3-public.js` — per-user local workspace adapter and the single wrapper that queues Firebase sync after `save()`.
- `cloud-sync.js` — Google Drive `appDataFolder` backup for private document attachments only. It must never upload/download Rider Hub application state.
- `firebase-ui-bridge.js` — compatibility boundary for the legacy account UI, GitHub Pages local-preview mode and update UX. It must not authenticate users or write Firestore data.
- `firebase-auth.js` — sole owner of Firebase Authentication, Firebase user identity, Firestore app-state sync, sync status, revisions and conflict resolution.
- `sw.js` — same-origin PWA shell caching only. It must never intercept Firebase Hosting's reserved `/__/` namespace or any cross-origin API request.

## Cloud data model

`/users/{firebaseUid}` stores the Firebase user profile metadata.

`/users/{firebaseUid}/riderhub/state` stores the sanitized Rider Hub application state envelope:

- `schema`
- `revision`
- `clientId`
- `state`
- `clientUpdatedAt`
- `updatedAt`

Private PDF/image/document attachments do not belong in Firestore. They remain local in IndexedDB and can optionally be backed up to the user's Google Drive `appDataFolder`.

## Conflict policy

Firestore state uses a monotonically increasing revision. A device may upload only when its last-known revision still matches the cloud revision. If another device has already changed the cloud copy, Rider Hub saves a local safety copy and asks the rider to choose **Use cloud copy** or **Keep this device**. No automatic last-write-wins overwrite is allowed after a detected conflict.

## Hosting

Production canonical origin: `https://rider-hub-506306.firebaseapp.com/`

The `web.app` alias redirects in-app to the canonical `firebaseapp.com` origin so mobile Firebase redirect authentication stays same-origin. GitHub Pages remains a fallback/local-preview deployment and is not the production mobile-auth origin.
