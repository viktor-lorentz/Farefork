# Farefork

Compare Uber, Lyft and Waymo ride quotes, and the true totals for Uber Eats, DoorDash, Grubhub and Postmates, in one app for iOS, Android and the web.

> **Status: Milestone 3 of 7** (rides and food comparison). All prices and restaurants in this build are **simulated** by mock providers. Address search and routes are real, from public OpenStreetMap services. Every price is shown **before tip**.

## Stack

| Area         | Choice                                                                                                        |
| ------------ | ------------------------------------------------------------------------------------------------------------- |
| App          | Expo SDK 58, React Native 0.88, Expo Router, TypeScript (strict)                                              |
| Server state | TanStack Query, with responses validated by Zod                                                               |
| Local state  | Zustand, persisted with AsyncStorage                                                                          |
| Motion       | Reanimated 4 (respects the system reduced-motion setting)                                                     |
| Icons        | Phosphor (one set, no emoji)                                                                                  |
| Type         | Satoshi, with tabular numbers on every price                                                                  |
| Maps         | Apple Maps on iOS, Google Maps on Android, MapLibre GL with OpenFreeMap tiles on the web. No API keys needed. |
| API          | Hono on Node (`apps/api`). Pricing and membership rules live here, never in the client.                       |
| Tooling      | npm workspaces, ESLint (flat config, type-aware), Prettier, Vitest, GitHub Actions CI                         |

Supabase (auth, favorites, history, savings, with row-level security on every table) arrives in milestone 5.

## Repo layout

```
apps/
  api/                 Hono API: membership catalog now, quote engine next
    src/memberships/config/2026-11-01.json   versioned membership rules
  mobile/              Expo app (iOS, Android, web)
    src/app/           routes (Expo Router)
    src/design/        tokens, theme, components (Button, ListRow, QuoteCard, Sheet, Chip, Toggle, Badge, EmptyState, …)
    src/features/      feature folders: home, map, memberships, navigation, onboarding, providers, rides, food
    src/stores/        persisted preferences, trip and recent places, cart and delivery address, last known location
packages/
  shared/              brand constants, provider ids, money formatting, shared Zod schemas
scripts/               font download, map worker copy
```

The app name lives in one place: `packages/shared/src/brand.ts`.

## Setup

Requirements: Node 24 (see `.nvmrc`; 22.18 or later works) and npm 11.

```bash
git clone https://github.com/viktor-lorentz/Farefork.git
cd Farefork
npm install
```

`npm install` runs a postinstall step that:

1. Downloads the Satoshi font from Fontshare into `apps/mobile/assets/fonts/`. The Fontshare license allows the fonts to be embedded in the app but not redistributed in a public repo, so they are gitignored. To re-download, run `npm run fonts`. To skip, set `SKIP_FONT_DOWNLOAD=1`.
2. Copies the MapLibre web worker into `apps/mobile/public/`.

## Run

```bash
npm run dev       # API on :8787 plus the Expo dev server
npm run web       # API plus the web app at http://localhost:8081
npm run android   # API plus Android (emulator or Expo Go on a device)
npm run ios       # API plus the iOS Simulator (needs Xcode)
```

On a physical phone, install **Expo Go**, run `npm run dev`, and scan the QR code. Phone and computer must be on the same Wi-Fi. The app finds the API automatically on the same host as Metro, on port 8787.

**Android emulator:** if Expo Go shows "Packager is not running" or the memberships list never loads, forward the ports:

```bash
adb reverse tcp:8081 tcp:8081 && adb reverse tcp:8787 tcp:8787
```

Then open `exp://localhost:8081` in Expo Go.

**iOS:** install Xcode from the Mac App Store, then run:

```bash
sudo xcode-select -s /Applications/Xcode.app/Contents/Developer
sudo xcodebuild -license accept
xcodebuild -runFirstLaunch
```

On a Mac with 8 GB of RAM, run only one simulator or emulator at a time.

## Environment variables

| Variable              | Where              | Default   | Purpose                                               |
| --------------------- | ------------------ | --------- | ----------------------------------------------------- |
| `PORT`                | `apps/api/.env`    | `8787`    | API port                                              |
| `HOST`                | `apps/api/.env`    | `0.0.0.0` | API bind address                                      |
| `GEOCODER`            | `apps/api/.env`    | `photon`  | `photon`, or `mock` for an offline list of places     |
| `ROUTER`              | `apps/api/.env`    | `osrm`    | `osrm`, or `estimate` for straight-line routes        |
| `PHOTON_URL`          | `apps/api/.env`    | public    | Photon server (self-host for production)              |
| `OSRM_URL`            | `apps/api/.env`    | public    | OSRM server (self-host for production)                |
| `GEO_USER_AGENT`      | `apps/api/.env`    | generic   | User-Agent sent to Photon and OSRM                    |
| `EXPO_PUBLIC_API_URL` | `apps/mobile/.env` | auto      | Override the API base URL, for example a deployed API |
| `SKIP_FONT_DOWNLOAD`  | shell              | unset     | Skip the font download on install                     |

Copy each `.env.example` to `.env` to change these. `.env` files are gitignored. Never put secret keys in `EXPO_PUBLIC_*` variables, because they ship inside the app.

## Checks

```bash
npm run typecheck
npm run lint
npm run format:check
npm test
npm run check     # all of the above
```

CI runs the same checks on every push and pull request.

## Rides (milestone 2)

- **Search:** type a pickup and a destination, or use your current location. Results come from Photon, biased toward your pickup. Recent destinations are saved on the device.
- **Route:** OSRM draws the driving route on the map. If OSRM is down, the API falls back to a straight-line estimate and the app labels it "estimated".
- **Quotes:** `POST /v1/rides/quotes` returns simulated prices for UberX, Comfort, UberXL, Uber Black, Lyft, Extra Comfort, Lyft XL, Lyft Black and Waymo. Prices come from a base fare, per-mile and per-minute rates, a booking fee, a minimum fare, and simulated surge. They stay the same within a two-minute window, so refreshing doesn't make them jump around.
- **Waymo:** offered only when both ends of the trip are inside a rough, simulated service area (San Francisco Bay Area, Phoenix, Los Angeles, plus Austin and Atlanta through Uber).
- **Booking:** on a phone, the button opens the Uber or Lyft app directly (`uber://`, `lyft://`) with pickup and destination filled in, and falls back to the web link if the app isn't installed. Waymo has no public link with a prefilled trip, so it opens the Waymo website. Booking inside this app isn't possible: the ride-request APIs are closed to new developers, and logging into your accounts would break the providers' terms.
- **Location:** if location is already allowed, the map opens on you and address search is biased toward you. Prices are before tip.

## Food (milestone 3)

- **Address:** set a delivery address, or use your current location.
- **Restaurants:** `GET /v1/food/restaurants` returns **sample restaurants** with made-up names and simulated menus, generated from a grid around the address, so the same place always shows the same list. Search by name, cuisine or dish.
- **Cart:** add items with the stepper. Adding from a different restaurant starts a new cart and says so.
- **Comparison:** `POST /v1/food/quotes` returns each app's **total before tip**: menu items (with that app's markup over in-store prices), delivery fee, service fee, small order fee and estimated tax. Tip is never included, because it's optional and up to you.
- **Ordering:** the button opens the chosen app's search for the restaurant. No delivery app accepts a cart from outside, so you add the same items there.

## Design rules

- Black and white, with a true black dark mode. The only accent is signal yellow `#FFD400`, always as a fill behind black text, and used only for best-price and deal moments.
- 8pt spacing grid. Radius scale: 4, 8, 12, 16, 24.
- Provider logos are drawn from the official vector marks, never recolored, and shown on a neutral plate.
- On desktop web the map sits on the left and the panel on the right. On phones, a bottom sheet sits over the map.
- The component gallery is under **Profile → Component gallery**.

## Milestones

1. ✅ Setup, design system, navigation shell, light and dark mode
2. ✅ Rides: geocoding, routing, mock quote providers, results sheet, deep links
3. ✅ Food: restaurant search, cart, true-total breakdown (before tip)
4. Membership pricing rules, plus tests for pricing, memberships and tier matching
5. Supabase auth (email code), favorites, history, savings tracker
6. Deals, price alerts, push notifications (needs a development build)
7. Polish

Data sourcing and legal open questions are in [DATA_SOURCES.md](DATA_SOURCES.md).
