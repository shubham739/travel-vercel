// Text search for POIs via Google Places
export default async function handler(req, res) {
  try {
    const { q = "" } = req.query;
    if (!process.env.GOOGLE_PLACES_KEY) {
      return res.status(500).json({ error: "Missing GOOGLE_PLACES_KEY" });
    }
    if (!q) return res.status(400).json({ error: "Missing q" });
    const u = new URL("https://maps.googleapis.com/maps/api/place/textsearch/json");
    u.searchParams.set("query", q);
    u.searchParams.set("key", process.env.GOOGLE_PLACES_KEY);
    const r = await fetch(u);
    const data = await r.json();
    const results = (data?.results || []).slice(0, 20).map(p => ({
      name: p.name,
      rating: p.rating,
      user_ratings_total: p.user_ratings_total,
      price_level: p.price_level,
      types: p.types,
      place_id: p.place_id,
      geo: p.geometry?.location,
      address: p.formatted_address
    }));
    res.status(200).json({ results });
  } catch (e) {
    res.status(500).json({ error: e.message || "Unknown error" });
  }
}
