async function amadeusToken() {
  const id = process.env.AMADEUS_CLIENT_ID;
  const secret = process.env.AMADEUS_CLIENT_SECRET;
  if (!id || !secret) return null;
  const r = await fetch("https://test.api.amadeus.com/v1/security/oauth2/token", {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams({ grant_type: "client_credentials", client_id: id, client_secret: secret })
  });
  if (!r.ok) return null;
  const j = await r.json();
  return j?.access_token || null;
}

async function amadeusCityCode(token, keyword) {
  const u = new URL("https://test.api.amadeus.com/v1/reference-data/locations");
  u.searchParams.set("subType", "CITY");
  u.searchParams.set("keyword", keyword);
  const r = await fetch(u, { headers: { Authorization: `Bearer ${token}` } });
  const j = await r.json();
  const first = j?.data?.[0];
  return first?.iataCode || null;
}

async function amadeusHotelOffers(token, cityCode, checkIn, checkOut, adults) {
  const u = new URL("https://test.api.amadeus.com/v3/shopping/hotel-offers");
  u.searchParams.set("cityCode", cityCode);
  u.searchParams.set("checkInDate", checkIn);
  u.searchParams.set("checkOutDate", checkOut);
  u.searchParams.set("adults", String(adults));
  u.searchParams.set("roomQuantity", "1");
  u.searchParams.set("currency", "USD"); // normalize; client can convert
  const r = await fetch(u, { headers: { Authorization: `Bearer ${token}` } });
  const j = await r.json();
  return j?.data || [];
}

export default async function handler(req, res) {
  try {
    const { city = "", checkIn = "", checkOut = "", adults = "2" } = req.query;

    // Try Amadeus mode if creds present
    if (process.env.AMADEUS_CLIENT_ID && process.env.AMADEUS_CLIENT_SECRET) {
      const token = await amadeusToken();
      if (token) {
        const cityCode = await amadeusCityCode(token, city);
        if (cityCode) {
          const offers = await amadeusHotelOffers(token, cityCode, checkIn, checkOut, Number(adults || 2));
          // Aggregate by star rating and compute median price/night
          const nightly = [];
          for (const h of offers) {
            const price = Number(h?.offers?.[0]?.price?.total || 0);
            const nights = Number(h?.offers?.[0]?.price?.variations?.average?.stayLength || 1);
            const perNight = nights ? price / nights : price;
            const rating = Number(h?.hotel?.rating || 0); // 1..5
            if (perNight > 0) nightly.push({ perNight, rating: rating || null, name: h?.hotel?.name });
          }
          nightly.sort((a,b)=>a.perNight-b.perNight);
          const median = nightly.length ? nightly[Math.floor(nightly.length/2)].perNight : null;
          const byTier = {
            "3": median ? Math.round(median*0.9) : null,
            "4": median ? Math.round(median*1.25) : null,
            "5": median ? Math.round(median*1.8) : null
          };
          return res.status(200).json({ mode: "amadeus", nightly, tiers: byTier, currency: "USD" });
        }
      }
    }

    // Fallback: approximate using Google Places restaurants price level in city
    if (!process.env.GOOGLE_PLACES_KEY) {
      return res.status(200).json({ mode: "fallback", note: "No Amadeus/Google keys; cannot estimate." });
    }
    const uu = new URL("https://maps.googleapis.com/maps/api/place/textsearch/json");
    uu.searchParams.set("query", "restaurants in " + city);
    uu.searchParams.set("key", process.env.GOOGLE_PLACES_KEY);
    const rr = await fetch(uu);
    const dj = await rr.json();
    const arr = (dj?.results || []).slice(0, 30);
    // Map restaurant price_level to hotel tiers (very rough heuristic)
    const levels = arr.map(x => x.price_level).filter(x => x !== undefined && x !== null);
    const avg = levels.length ? levels.reduce((a,b)=>a+b,0)/levels.length : 2;
    // heuristic bands in USD/night
    const base = avg<=1.5 ? 40 : avg<=2.5 ? 80 : avg<=3.5 ? 140 : 220;
    const tiers = { "3": Math.round(base*0.9), "4": Math.round(base*1.3), "5": Math.round(base*1.8) };
    res.status(200).json({ mode: "heuristic", tiers, baseRef: { avgRestaurantPriceLevel: avg }, currency: "USD" });
  } catch (e) {
    res.status(500).json({ error: e.message || "Unknown error" });
  }
}
