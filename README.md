# Trip Planner Live (MVP)

A live-data **Trip Cost Estimator + Itinerary Generator** you can deploy on Vercel.
- Flights from Kiwi Tequila API (cheapest + fastest)
- Hotels from Amadeus (if keys provided) with a graceful fallback
- POIs & restaurants from Google Places
- Currency via Frankfurter
- Single-page Tailwind UI
- Serverless functions (Node) with caching-ready structure

## Quick start
1) Create a Vercel project (or run locally with `vercel dev`).
2) Set environment variables in Vercel Project Settings → Environment Variables:
   - `KIWI_API_KEY` (https://tequila.kiwi.com/portal/login)
   - `GOOGLE_PLACES_KEY` (https://console.cloud.google.com/)
   - Optional (for live hotel prices): `AMADEUS_CLIENT_ID`, `AMADEUS_CLIENT_SECRET`
3) Deploy.

### Local dev
You can test with `vercel dev` and a `.env` file (Vercel CLI will load it).

## Endpoints
- `GET /api/kiwiLocations?q=paris` → resolve city/airport codes (Kiwi Locations)
- `GET /api/flights?origin=DEL&dest=BKK&depart=13/09/2025&returnDate=18/09/2025&adults=2&currency=INR`
- `GET /api/places?q=things%20to%20do%20in%20bangkok` (Text Search top 20)
- `GET /api/placesRestaurants?city=bangkok` (restaurants sample for price levels)
- `GET /api/hotels?city=PAR&checkIn=2025-09-13&checkOut=2025-09-18&adults=2` (Amadeus if configured; else fallback estimate)
- `GET /api/exchange?base=USD&symbols=INR` → Frankfurter passthrough

## Notes
- Use your own billing/quotas for Google & Kiwi & Amadeus.
- This repo caches-ready: add KV if you want. Right now each request fetches live.
- The UI gracefully handles missing hotel API by using a heuristic estimate.

## Legal
- Use only permitted APIs and respect their TOS/attribution.
- This is an MVP and not intended as financial or booking advice.
