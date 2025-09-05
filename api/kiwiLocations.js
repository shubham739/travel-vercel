// Resolve city/airport codes via Kiwi Tequila Locations API
export default async function handler(req, res) {
  try {
    const { q = "" } = req.query;
    if (!process.env.KIWI_API_KEY) {
      return res.status(500).json({ error: "Missing KIWI_API_KEY" });
    }
    const url = new URL("https://tequila-api.kiwi.com/locations/query");
    url.searchParams.set("term", q);
    url.searchParams.set("location_types", "city,airport");
    url.searchParams.set("limit", "8");
    const r = await fetch(url, { headers: { apikey: process.env.KIWI_API_KEY } });
    const data = await r.json();
    const out = (data?.locations || []).map(l => ({
      name: l.name,
      code: l.code,
      type: l.type, // city or airport
      country: l.country?.name,
      city: l.city?.name || l.name
    }));
    res.status(200).json({ results: out });
  } catch (e) {
    res.status(500).json({ error: e.message || "Unknown error" });
  }
}
