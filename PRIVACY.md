# Farefork privacy policy (draft)

_Draft for review before launch. Last updated 2026-11-19._

Farefork compares prices across ride and food delivery apps. You can use it without an account.

## What stays on your device

- Your recent places, preferences, memberships and cart.
- Your location, when you allow it. The app sends it to Farefork's API only to find places, restaurants and prices near you. The API doesn't store it.

## What we store if you sign in

- Your email address, to send sign-in codes.
- Favorites: saved routes and restaurants.
- History: bookings you confirm you made, with prices and savings.
- Price alerts: both ends of the route, your target price and your memberships. Alerts end after 7 days and are deleted 30 days later.
- Push tokens, so we can notify the phones where you allowed notifications.

Accounts are hosted on Supabase. Price alert checks run on GitHub Actions. Notifications go through Expo's push service, then Google or Apple.

## Services we use

- **OpenStreetMap services** (Photon, Nominatim, OSRM, OpenFreeMap) for maps, place search, restaurants and routes. They receive the search text and coordinates, not your account.
- **Ride and delivery apps** open when you choose to book. What happens there is covered by their own policies.

We don't sell your data, show ads or use third-party trackers.

## Your choices

- Delete your account in **Profile → Account → Delete account**. This removes your favorites, history, alerts and push tokens.
- Turn off notifications in **Profile** or in your phone's settings.

## Contact

Open an issue on the project's GitHub repository.
