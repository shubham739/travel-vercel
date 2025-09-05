// Restaurants around a city (by query), to infer price distribution (for food estimate)
export default async function handler(req, res) {
  try {
    const { city = "" } = req.query;
    if (!process.env.GOOGLE_PLACES_KEY) {
      return res.status(500).json({ error: "Missing GOOGLE_PLACES_KEY" });
    }
    if (!city) return res.status(400).json({ error: "Missing city" });
    const q = `restaurants in ${city}`;
    const u = new URL("https://maps.googleapis.com/maps/api/place/textsearch/json");
    u.searchParams.set("query", q);
    u.searchParams.set("key", process.env.GOOGLE_PLACES_KEY);
    const r = await fetch(u);
    const data = await r.json();
    const results = (data?.results || []).slice(0, 30).map(p => ({
      name: p.name,
      price_level: p.price_level ?? null,
      rating: p.rating,
      user_ratings_total: p.user_ratings_total
    }));
    res.status(200).json({ results });
  } catch (e) {
    res.status(500).json({ error: e.message || "Unknown error" });
  }
}
