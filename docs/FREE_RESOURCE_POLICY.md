# Rider Hub Zero-Cost Resource Policy

Rider Hub defaults to resources that can be used at **₹0 without attaching a billable production account**.

## Required decision rule

Before adding any hosted API, database, storage provider, notification service, AI model or analytics product:

1. Determine whether billing or a payment method is required.
2. Determine whether the free allowance can be exceeded automatically.
3. Determine whether the provider can charge after the allowance is exhausted.
4. Check whether a hard quota can stop usage before cost is incurred.
5. Identify open-source/local alternatives.
6. Do not activate the paid-capable option until the rider explicitly approves the price/risk.

## Current approved baseline

| Resource | Status | Billing risk |
|---|---|---|
| React | Approved | None; open source |
| TypeScript | Approved | None; open source |
| Vite | Approved | None; open source |
| Browser localStorage | Approved | None |
| Browser IndexedDB | Approved | None |
| Service Worker / PWA APIs | Approved | None |
| Browser Geolocation / Share / History / Notification APIs | Approved | None |
| GitHub Pages for the current public repository | Approved for current prototype | No Rider Hub API usage billing; re-check GitHub plan terms if repository/account setup changes |
| Google Maps Demo Key | Approved for prototype only | No billing account; quota/feature limits can stop requests |

## Not approved automatically

- Standard Google Maps Platform key with billing enabled
- Firebase paid-capable production architecture
- Supabase/Cloudflare/other hosted services merely because they have a free tier
- commercial push-notification providers
- paid AI APIs
- paid object storage
- paid route/traffic providers

A provider with a free tier is **not automatically considered lifetime free**. Pricing can change. Hosted services are therefore treated as replaceable adapters, not core domain dependencies.

## Security rule

Never commit:

- Maps/API keys
- OAuth secrets/tokens
- booking vouchers
- licence/RC/insurance PDFs
- identity data
- private emergency/contact data

Browser keys required for client-side APIs are stored on the rider's device and should be restricted whenever the provider supports restrictions.
