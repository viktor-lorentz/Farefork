# Data sources and open questions

This build uses **mock providers only**. It does not scrape, does not log into any third-party account, and does not call any provider API. Every price shown is simulated.

This document lists what a real integration would need, so you can make the legal and terms-of-service decisions. Nothing here is legal advice.

## Adapter boundary

Providers sit behind interfaces on the API server. The client never sees provider credentials or pricing logic.

```ts
interface RideProvider {
  getQuotes(route: Route): Promise<RideQuote[]>;
}

interface DeliveryProvider {
  getQuote(context: { restaurant; deliverTo; distanceMeters; lines }): Promise<DeliveryQuote>;
}
```

Swapping a mock for a real source means writing one adapter. Screens and pricing code do not change.

## Rides

| Provider | Possible official path                                                                                                                                            | Open questions                                                                                                                                     |
| -------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------- |
| Uber     | Uber has had a Rides API with price estimates, but public access has been restricted for years. Deep links (`uber://?action=setPickup…`) work without an API key. | Is estimate access available to new apps? Are attribution and branding rules met? Is there an affiliate program?                                   |
| Lyft     | Lyft's public API (cost estimates, ETAs) has been closed to new developers. Deep links (`lyft://ridetype?id=…`) work.                                             | Is partner access available? What are the deep-link terms?                                                                                         |
| Waymo    | No public pricing API. The Waymo One app is the only booking path in most cities. In Austin and Atlanta, Waymo rides are booked **through the Uber app**.         | How should Waymo be shown where it is only reachable via Uber? Is a partnership required? How are service areas checked (a mock geofence for now)? |

## Food delivery

| Provider  | Possible official path                                                                                       | Open questions                                                                       |
| --------- | ------------------------------------------------------------------------------------------------------------ | ------------------------------------------------------------------------------------ |
| Uber Eats | Uber Eats has merchant and partner APIs, not a consumer quote API. Uber's affiliate program may cover links. | Can fee and total estimates be shown? What are the caching limits?                   |
| Postmates | Part of Uber. Handled as a variant of the Uber Eats adapter.                                                 | Same as Uber Eats. Is the Postmates brand still used in each market?                 |
| DoorDash  | DoorDash Drive is a merchant delivery API, not consumer menu pricing. DoorDash has an affiliate program.     | Can consumer totals be shown? Can affiliate links be combined with price comparison? |
| Grubhub   | Grubhub has partner APIs, and affiliate programs have existed.                                               | Same questions as above.                                                             |

Menu prices often differ between apps and from in-store prices. The app's "true total" is shown **before tip**: menu price, delivery fee, service fee, small-order fee and estimated tax. Each of these varies by market and membership. Tax uses a flat 8.75% estimate for now; real rates depend on the city and on whether fees are taxed.

### Restaurants, menus and photos

- **Restaurants are real places from OpenStreetMap** (ODbL, attribution shown in the app). The API lists nearby restaurants, fast food and cafes through Photon, and fills in cuisine tags through Nominatim's lookup. Results are cached per area for 24 hours. If those services fail, the API falls back to invented sample restaurants.
- **Name search** looks up restaurants by name within 15 km, so a favorite place across town still shows up.
- **When Photon is unavailable** (for example after rate limiting), restaurant search and address search fall back to Nominatim, throttled to one request per second with the newest search winning. Nominatim's policy discourages search-as-you-type, so this fallback is for development only.
- **Results are cached on disk** in `apps/api/.cache/` for 24 hours, so restarting the API doesn't refetch.
- **Public Photon and Nominatim servers are for light use.** Nominatim allows at most one request per second and forbids heavy or bulk use. Before launch, self-host them or switch to a commercial provider (`PHOTON_URL`, `NOMINATIM_URL`).
- **Menus, prices and which apps carry each restaurant are simulated**, and the app says so. Showing real restaurant names next to made-up menus and prices could mislead people or upset those restaurants. **Decide before launch** whether to keep real names, or wait for real menus from partner feeds.
- **Photos are CC0 food photos** (Rawpixel, StockSnap and WordPress Photo Directory, found through Openverse), matched by cuisine. Resized copies (720 px) are bundled in `apps/api/assets/photos` and served by the API at `/v1/photos/…`, so they load fast and don't depend on hotlinking. They aren't photos of the restaurant, and the menu page says so. Real restaurant photos need a licensed source such as Google Places Photos or Yelp Fusion, both paid and with display rules, or partner feeds.

### Order links

None of the delivery apps accept a prefilled cart from another app. The best a partner link can do is open a specific restaurant page. This build opens each app's search for the restaurant name:

| Provider  | Link used                                         |
| --------- | ------------------------------------------------- |
| Uber Eats | `https://www.ubereats.com/search?q=<name>`        |
| DoorDash  | `https://www.doordash.com/search/store/<name>/`   |
| Grubhub   | `https://www.grubhub.com/search?queryText=<name>` |
| Postmates | `https://postmates.com/search?q=<name>`           |

With real store IDs (from an affiliate or partner program), these become direct store links.

## Memberships

Rules live in `apps/api/src/memberships/config/<version>.json` and are versioned by effective date. To change terms, add a new file with a later `effectiveFrom` instead of editing an old one. **Every price and perk in the current file is a placeholder to verify** against each provider's current terms:

| Plan      | Tiers in file                | Perks in file                                                        |
| --------- | ---------------------------- | -------------------------------------------------------------------- |
| Uber One  | $9.99/mo, or $8.00/mo yearly | 6% back as credits on rides; $0 delivery and 5% service fee over $15 |
| DashPass  | $9.99/mo, or $8.00/mo yearly | $0 delivery and 5% service fee over $12                              |
| Grubhub+  | $9.99/mo                     | $0 delivery and 8% service fee over $12                              |
| Lyft Pink | $9.99/mo, or $8.33/mo yearly | 5% off standard, comfort and XL rides, up to $15                     |

Waymo has no program. Real perks also have exceptions (some restaurants, regions, or ride types), which this build doesn't model.

## Accounts and stored data

Accounts use Supabase (auth and Postgres). Per signed-in user, it stores:

- **Email address**, for sign-in codes.
- **Favorites:** saved routes (place names, addresses and coordinates of both ends; routes from your current location store only the destination) and restaurant IDs.
- **History:** only bookings the user confirms ("Did you book it?"), with provider, product or restaurant name, the route's place names or item count, prices and savings. No coordinates. Ride and delivery apps don't let other apps read a user's trips or orders, so Farefork can't check this automatically.

Everything is protected by row-level security and removed by **Delete account**. Supabase's built-in email is for testing only; production needs your own SMTP provider, which will process users' email addresses.

## Maps and geodata

| Service                  | Use                                  | Terms to check                                                                                                                                       |
| ------------------------ | ------------------------------------ | ---------------------------------------------------------------------------------------------------------------------------------------------------- |
| Apple Maps (iOS)         | Base map through `react-native-maps` | Apple's MapKit terms                                                                                                                                 |
| Google Maps (Android)    | Base map through `react-native-maps` | Expo Go includes a key for development. A production build needs your own key and Google Maps Platform billing.                                      |
| OpenFreeMap (web)        | Vector tiles                         | Free with attribution. No SLA. Consider self-hosting or a paid provider at scale.                                                                    |
| OpenStreetMap data       | Underlying data for the web map      | ODbL attribution (shown on the map)                                                                                                                  |
| Photon / OSRM (live, M2) | Geocoding and routing                | The public demo servers have usage limits and are not for production. Self-host, or use a commercial provider. A generic User-Agent is configurable. |

### Location privacy (milestone 2)

Search text, the pickup area (rounded to about 1 km) and trip coordinates go from the app to this API, and from the API to Photon and OSRM. Nothing is stored on the server except in-memory caches (10 minutes). On the device, the app keeps recent destinations, the delivery address, the cart, and the last known location rounded to about 100 m. Before launch, decide whether to self-host these services so that trip locations never leave your infrastructure.

### Deep links to verify

| Provider | Link used                                                                                                   | To verify                                                                                                      |
| -------- | ----------------------------------------------------------------------------------------------------------- | -------------------------------------------------------------------------------------------------------------- |
| Uber     | `https://m.uber.com/ul/?action=setPickup&pickup[...]&dropoff[...]`                                          | Product preselection needs a per-city `product_id`, so it isn't sent. Check attribution rules.                 |
| Lyft     | `lyft://ridetype?id=…` in the app, else `https://lyft.com/ride?id=<ride type>&pickup[...]&destination[...]` | The ride type IDs `lyft`, `lyft_plus` and `lyft_lux` come from older docs. Extra Comfort falls back to `lyft`. |
| Waymo    | `https://waymo.com/`                                                                                        | No prefilled deep link is known. In Austin and Atlanta, Waymo trips open the Uber link instead.                |

## Trademarks and logos

Provider names and logos are trademarks of their owners. Logos are drawn from the official vector marks and are never recolored or altered. The Uber, Lyft, DoorDash and Postmates marks come from Simple Icons. The Grubhub and Waymo marks come from Wikimedia Commons; those files are tagged public domain as simple shapes, but the trademarks still apply.

Before launch, check each company's brand guidelines for comparison use, and keep the "not affiliated" notice (it is shown on the Profile screen).

## Fonts

Satoshi comes from Fontshare under the Fontshare Free Font License (FFL). Embedding it in the app is allowed. Redistributing the files is not, so they are downloaded at install time and never committed.

## Decisions for you

1. For each provider: official API, partner deal, affiliate links only, or deep links only.
2. Whether showing estimated prices without a provider agreement is acceptable.
3. Logo use in a comparison context.
4. A production map and geocoding provider, and its budget.
5. Data retention for location and trip history, before milestone 5.
