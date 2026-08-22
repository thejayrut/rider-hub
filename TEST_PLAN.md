# Rider Hub regression and production test plan

Run this sequence after a Firebase Hosting deployment. Do not use destructive test values; use a small temporary odometer/note/expense change that can be reverted.

## 1. Load and account

- Open `https://rider-hub-506306.firebaseapp.com/` on Android Chrome.
- Confirm no `about:blank` popup appears. Mobile sign-in should leave Rider Hub, show Google account selection, then return.
- Confirm the account screen shows the Google name/email/photo and app-data status.
- Reload twice and confirm the session persists.
- Log out and confirm the welcome/sign-in screen returns; sign in again.

## 2. Core UI regression

- Home renders without blank cards or duplicated navigation.
- Bike opens, odometer can be edited, maintenance and service history render.
- Gear renders owned/planned items and filters/controls still respond.
- Rides opens the Banswara card; Day 1, Day 2 and Day 3 switch correctly.
- Ride Mode opens/closes and task states can be changed.
- Notes, bike issue, content, media backup, packing, tomorrow, emergency, traffic and ride summary controls open.
- Hotel booking card still says Open booking and the map action works.
- More opens My Account, Backup / Import, Files & storage and App settings.
- Android back closes modals/ride detail before leaving the app where applicable.

## 3. Firestore sync

- Firestore contains `/users/{uid}` and `/users/{uid}/riderhub/state`.
- Change one small app value and confirm status goes `PENDING` → `SYNCING` → `SYNCED`.
- Reload and confirm the value survives.
- Verify `revision` increases after each successful upload.
- Confirm cached weather is not stored inside the cloud `state` document.

## 4. Offline

- Load the app online once, then disable network access.
- Reopen core screens and make one small change.
- Confirm the status becomes `OFFLINE` and the change survives a local reload.
- Restore the network and confirm the status returns to `SYNCED` without losing the local edit.

## 5. Two-device conflict safety

- Open the same account on Device A and Device B.
- Let both load the same revision.
- Make a change on A and wait for `SYNCED`.
- Before B reloads, make a different change on B.
- B must show `CONFLICT`; it must not silently overwrite A.
- Test **Use cloud copy** and confirm a local safety copy remains recoverable.
- Repeat and test **Keep this device**; confirm the Firestore revision increases and the selected device state becomes cloud state.

## 6. Backup/import and migration

- Export a JSON backup from the GitHub Pages/local copy before migration.
- Import it once on Firebase Hosting if the old origin contains changes not present in the starter data.
- Reload and confirm the imported data remains.
- Keep one exported JSON file until cross-device sync is verified.

## 7. Private documents / Google Drive

- App state must never be uploaded to Google Drive.
- Attach one non-sensitive test file locally and confirm it opens from IndexedDB.
- If Drive backup is enabled, connect Drive separately and back up/download the test file.
- Disconnect Drive; Firebase app-data sync should remain signed in and operational.

## 8. PWA/update behavior

- Install Rider Hub from the canonical `firebaseapp.com` URL.
- Launch it standalone and confirm the app icon/theme render correctly.
- After a later deployment, reopen Rider Hub and confirm the new service worker takes control once without a reload loop.
- While offline, core same-origin app screens/assets should load; Firebase/Google `/__/` and cross-origin API requests must never be replaced with cached Rider Hub HTML.
