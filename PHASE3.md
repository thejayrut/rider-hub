# Rider Hub — Phase 3

Phase 3 moves the prototype from a single large browser script to a production-oriented React + TypeScript + Vite architecture while keeping the Charcoal Ember UI and preserving existing Rider Hub data.

## What is in this branch

- React component app shell
- TypeScript domain models for bikes, rides, tasks and gear
- Legacy migration bridge that reads the existing `riderhub_v6` localStorage state
- Phase 2E-style Gear Garage and My Rides landing flow
- Optional Firebase bootstrap with Firestore persistent local cache
- GitHub Pages-compatible Vite base path
- Google Maps browser-key environment slot

## Migration order

1. Stabilize current `main` deployment.
2. Preserve/migrate local Bike, Gear, Ride and Document metadata.
3. Move screens to React components without redesigning them.
4. Add Firebase Auth and per-user ownership rules.
5. Add Firestore sync/offline persistence.
6. Add secure private document storage.
7. Add Firebase Cloud Messaging / Web Push for closed-app reminders.
8. Move sensitive API calls and DigiLocker OAuth to Cloud Functions or Cloud Run.
9. Add Google Maps traffic/routing configuration.
10. Switch GitHub Pages production build only after feature parity tests pass.

## Google Maps traffic

The browser TrafficLayer uses a Google Maps JavaScript API key. The key is expected as `VITE_GOOGLE_MAPS_API_KEY`. Because Maps JavaScript runs in the browser, the key is visible to the browser and must be protected with an HTTP referrer restriction for `https://thejayrut.github.io/*` plus API restrictions. A Google Cloud project, billing setup and key creation must be completed in the Google Cloud account; this repository does not contain a secret or unrestricted key.

## Firebase

Firebase initialization is optional until environment values are supplied. Production security depends on Auth + Firestore/Storage Security Rules, not hiding Firebase web config values.
