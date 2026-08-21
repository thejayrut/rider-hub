# Rider Hub Phase 3 Architecture

## Goal

Move Rider Hub from a single-file prototype into a typed, modular, local-first motorcycle operating system without regressing Phase 2E behaviour.

## Locked product rules

- Charcoal Ember visual system remains the design baseline.
- Gear Garage must preserve the Phase 2E interaction model and inventory structure.
- Rides open at **My Rides** first; a ride detail opens only after selecting a ride.
- One master motorcycle odometer drives maintenance, fuel and ride records.
- Expense editing is transactional: draft values do not become actual spend until confirmed.
- Fuel log amounts automatically increase the Fuel expense category.
- Phone/browser Back must unwind tool sheet → Ride Mode → Ride detail → My Rides before leaving Rider Hub.
- Long navigation plans are split into controlled route parts instead of feeding too many waypoints to Google Maps.
- Hotel and identity documents never go into the public GitHub repository.
- No fake weather, traffic or road-closure data.

## Phase 3 stack

### Client

- React 19
- TypeScript
- Vite
- CSS using the existing Charcoal Ember design tokens

These are open-source dependencies and have no usage billing.

### State

`RiderHubProvider` is the Phase 3 domain store. It provides:

- local persistence
- global Undo history
- authoritative bike odometer
- task status/delay mutations
- automatic next-day progression
- confirmed expense state
- fuel → expense linkage
- ride notes, issues, checklists and emergency contacts
- editable Gear Garage

The initial migration reads existing Phase 2 localStorage data through `legacyBridge.ts` so the rider does not have to re-enter data.

### Private documents

Private PDF/image bytes use IndexedDB through `services/privateDocs.ts`.

This intentionally keeps private documents off the public GitHub Pages repository. A future cloud adapter must be authenticated and must satisfy the project's zero-cost rule before it is enabled.

### Maps / weather / route intelligence

`services/googleMaps.ts` uses a **Maps Demo Key** stored only in browser localStorage.

The repository never contains the key.

The adapter currently supports:

- live Banswara current weather
- 10-day forecast lookup
- route distance / ETA
- traffic-aware route request when the Demo Key permits it
- automatic fallback to a basic route request instead of inventing live traffic
- Google Maps URL navigation for the actual motorcycle route parts

Because the Demo Key is a prototyping credential, this integration stays behind a provider abstraction so it can be replaced without rewriting Ride Mode.

## Module boundaries

- `domain/defaultData.ts` — authoritative seed data and Banswara route plan
- `types.ts` — domain contracts
- `store/RiderHubProvider.tsx` — persistent mutations + Undo
- `services/googleMaps.ts` — Maps Demo Key provider adapter
- `services/privateDocs.ts` — private local document bytes
- `components/BikePage.tsx` — bike profile / maintenance
- `components/GearPage.tsx` — Phase 2E Gear Garage
- `components/RidesPage.tsx` — My Rides landing
- `components/RideDetail.tsx` — ride execution / Ride Mode / tools
- `components/DocumentsPage.tsx` — document vault
- `components/Modal.tsx` — mobile sheet / browser Back integration

## Migration gates before Phase 3 replaces the live site

1. Production build passes in GitHub Actions.
2. Phase 2 local data migrates without data loss.
3. Gear Garage visual and interaction parity is checked on mobile.
4. My Rides → Ride Detail → Ride Mode navigation is checked with Android Back.
5. Expenses, fuel linkage and Undo are tested.
6. Hotel PDF attachment/open flow is tested.
7. Maps Demo Key weather refresh and route fallback are tested.
8. No paid service or secret is present in source control.
9. Current stable `main` remains deployable until all above gates pass.

## Later Phase 3 work

- editable manual ride creator
- PDF → ride importer after a safe local/zero-cost extraction path is selected
- offline route-package metadata
- richer maintenance history
- ride GPS recording using device APIs
- end-of-day background notification architecture
- document sync adapter
- DigiLocker OAuth connector after official Requester onboarding
- multiple bikes and multi-user data isolation

No backend will be activated merely for convenience. Any future hosted dependency must be reviewed against `FREE_RESOURCE_POLICY.md` first.
