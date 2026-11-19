# Farefork

Compare Uber, Lyft and Waymo ride quotes, and the true totals for Uber Eats, DoorDash, Grubhub and Postmates, in one app for iOS, Android and the web.

> **Status: Milestone 4 of 7** (rides and food comparison, with your memberships applied). All prices and restaurants in this build are **simulated** by mock providers. Address search and routes are real, from public OpenStreetMap services. Every price is shown **before tip**.

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
  api/                 Hono API: quote engine, membership rules, mock providers
    src/memberships/config/2026-11-01.json   versioned membership plans and perk rules
    src/memberships/pricing.ts               applies perks to ride and food quotes
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

| Variable                        | Where                                  | Default         | Purpose                                                                                                |
| ------------------------------- | -------------------------------------- | --------------- | ------------------------------------------------------------------------------------------------------ |
| `PORT`                          | `apps/api/.env`                        | `8787`          | API port                                                                                               |
| `HOST`                          | `apps/api/.env`                        | `0.0.0.0`       | API bind address                                                                                       |
| `GEOCODER`                      | `apps/api/.env`                        | `photon`        | `photon`, or `mock` for an offline list of places                                                      |
| `ROUTER`                        | `apps/api/.env`                        | `osrm`          | `osrm`, or `estimate` for straight-line routes                                                         |
| `EAS_PROJECT_ID`                | `apps/mobile/.env` and EAS environment | none            | Expo project ID, needed for push tokens                                                                |
| `GOOGLE_SERVICES_JSON`          | EAS file variable                      | none            | Firebase config for Android push (or put `google-services.json` in `apps/mobile`, which is gitignored) |
| `PHOTON_URL`                    | `apps/api/.env`                        | public          | Photon server (self-host for production)                                                               |
| `NOMINATIM_URL`                 | `apps/api/.env`                        | public          | Nominatim server for restaurant cuisine lookups (self-host for production)                             |
| `RESTAURANTS`                   | `apps/api/.env`                        | `openstreetmap` | `sample` uses invented restaurants instead of OpenStreetMap                                            |
| `OSRM_URL`                      | `apps/api/.env`                        | public          | OSRM server (self-host for production)                                                                 |
| `GEO_USER_AGENT`                | `apps/api/.env`                        | generic         | User-Agent sent to Photon and OSRM                                                                     |
| `EXPO_PUBLIC_API_URL`           | `apps/mobile/.env`                     | auto            | Override the API base URL, for example a deployed API                                                  |
| `EXPO_PUBLIC_SUPABASE_URL`      | `apps/mobile/.env`                     | none            | Your Supabase project URL. Without it, accounts are hidden                                             |
| `EXPO_PUBLIC_SUPABASE_ANON_KEY` | `apps/mobile/.env`                     | none            | The project's public anon key. Safe in the app; row-level security protects data                       |
| `SKIP_FONT_DOWNLOAD`            | shell                                  | unset           | Skip the font download on install                                                                      |

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
- **Restaurants:** `GET /v1/food/restaurants` returns **real nearby restaurants from OpenStreetMap**, each with a cuisine photo. Menus, prices and which apps carry them are simulated. If the map services are down, it falls back to invented sample restaurants (`RESTAURANTS=sample` forces that).
- **Cart:** add items with the stepper. Adding from a different restaurant starts a new cart and says so.
- **Comparison:** `POST /v1/food/quotes` returns each app's **total before tip**: menu items (with that app's markup over in-store prices), delivery fee, service fee, small order fee and estimated tax. Tip is never included, because it's optional and up to you.
- **Ordering:** the button opens the chosen app's search for the restaurant. No delivery app accepts a cart from outside, so you add the same items there.

## Memberships (milestone 4)

- **Your plans:** turn on the plans you pay for under **Profile → Memberships**, and pick monthly or annual billing. They're stored on your device and sent with each quote request, nothing else.
- **Perk rules:** each plan lists typed rules in the catalog file: percent off rides (with a cap and ride classes), credits back on rides, delivery fee waived, and a lower service fee above an order minimum.
- **Applied before ranking:** the API applies perks before sorting, so "best price" is best for you. Cards show the standard price struck through and what the plan saves. Uber One ride credits are shown but don't lower the price, because they're paid back later.
- **Below the minimum:** food cards say how much more to add to get the perks.

## Accounts (milestone 5)

Sign-in, favorites, history and savings use [Supabase](https://supabase.com). The app talks to Supabase directly; row-level security lets each user read and change only their own rows. The pricing API doesn't touch accounts.

**One-time setup in the Supabase dashboard:**

1. **SQL Editor:** run `supabase/migrations/20261119000000_accounts.sql`. It creates `favorites`, `handoffs` (history), the `savings_summary` view and `delete_my_account()`.
2. **Authentication → Email Templates:** in both **Magic Link** and **Confirm signup**, show the code with `{{ .Token }}` instead of a link. The app asks for the code.
3. **Email sending:** Supabase's built-in email is rate limited and meant for testing. Before other people sign in, add your own SMTP provider under **Authentication → SMTP Settings**.

**What it does:**

- **Sign in** with an emailed code. No passwords.
- **Favorites:** the heart on a trip or a restaurant saves it. Tapping a favorite route re-prices it; a route saved from your current location stays "from where you are" and doesn't store your position.
- **History:** after you open an app from a comparison and come back, Farefork asks "Did you book it?". Only a yes is saved, with the price and what you saved. Ride and delivery apps don't share your trips with other apps, so this is the only honest way to know.
- **Savings:** compared with the average of the other apps for the same ride class or order, plus what your memberships took off. Shown in **Profile → Account**.
- **Delete account** removes the account, favorites and history.

## Deals and price alerts (milestone 6)

- **Deals:** `GET /v1/deals` returns this week's promos for every app, behind a `DealsSource` adapter. Deals your memberships unlock come first, then by estimated savings. The mock source rotates weekly and never invents promo codes.
- **Price alerts:** pick a target under any ride comparison ("Alert me when it drops"). Alerts live in Supabase (`price_alerts`), last 7 days, and pause after they hit, so you get one ping, not twenty.
- **Checking runs off your computer:** `.github/workflows/price-alerts.yml` runs every 15 minutes on GitHub Actions. It prices each alert with the same quote code as the API (`apps/api/src/alerts/cli.ts`) and sends Expo push notifications to the phones of users whose alerts hit. On the web, hits appear in the Alerts tab.

**One-time setup:**

1. **Supabase SQL Editor:** run `supabase/migrations/20261120000000_alerts.sql` (creates `price_alerts`, `push_tokens` and `register_push_token()`).
2. **GitHub secrets** (repo → Settings → Secrets and variables → Actions): `SUPABASE_URL`, and `SUPABASE_SERVICE_ROLE_KEY` from Supabase → Project Settings → API. The service role key bypasses row-level security, so it only ever goes in GitHub secrets, never in the app. Until both are set, the job skips.
3. **Push notifications (Android):** `npx eas-cli login`, then `npx eas-cli init` in `apps/mobile`, put the project ID in `apps/mobile/.env` as `EAS_PROJECT_ID`, add a Firebase Android app for `com.farefork.app` and upload its FCM V1 service account key with `npx eas-cli credentials`. Then `npx eas-cli build --profile development --platform android`. iOS needs an Apple Developer account.

GitHub pauses scheduled workflows in repos with no activity for 60 days. For a real launch, move the checker to a server or a Supabase Edge Function.

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
4. ✅ Membership pricing rules, plus tests for pricing, memberships and tier matching
5. ✅ Supabase auth (email code), favorites, history, savings tracker, real restaurants with photos
6. ✅ Deals, price alerts, push notifications (push needs the EAS and Firebase setup above)
7. ✅ Polish: accessibility labels, empty and error states, paged lists, real push toggle, privacy policy draft, store config (Android build needs `eas login`; iOS needs an Apple Developer account)

Data sourcing and legal open questions are in [DATA_SOURCES.md](DATA_SOURCES.md).
