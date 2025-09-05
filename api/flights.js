// Search flights via Kiwi Tequila API (cheapest + fastest)
export default async function handler(req, res) {
  try {
    const {
      origin = "DEL",
      dest = "BKK",
      depart,
      returnDate,
      adults = "2",
      currency = "INR"
    } = req.query;

    if (!process.env.KIWI_API_KEY) {
      return res.status(500).json({ error: "Missing KIWI_API_KEY" });
    }
    if (!depart) {
      return res.status(400).json({ error: "Missing 'depart' (DD/MM/YYYY)" });
    }
    const u = new URL("https://tequila-api.kiwi.com/v2/search");
    u.searchParams.set("fly_from", origin);
    u.searchParams.set("fly_to", dest);
    u.searchParams.set("date_from", depart);
    u.searchParams.set("date_to", depart);
    if (returnDate) {
      u.searchParams.set("return_from", returnDate);
      u.searchParams.set("return_to", returnDate);
    }
    u.searchParams.set("curr", currency);
    u.searchParams.set("adults", adults);
    u.searchParams.set("limit", "30");
    u.searchParams.set("one_for_city", "1");

    const r = await fetch(u, { headers: { apikey: process.env.KIWI_API_KEY } });
    const data = await r.json();
    const offersRaw = (data?.data || []);
    const offers = offersRaw.map(o => ({
      price: o.price,
      duration: o.duration?.total,
      legs: o.route?.length || 1,
      stops: Math.max((o.route?.length || 1) - 1, 0),
      airlines: Array.from(new Set((o.route || []).map(r => r.airline))),
      deep_link: o.deep_link
    }));

    if (!offers.length) {
      return res.status(200).json({ offers: null, note: "No results" });
    }
    const cheapest = [...offers].sort((a,b) => a.price - b.price)[0];
    const fastest  = [...offers].sort((a,b) => (a.duration||9e9) - (b.duration||9e9))[0];
    res.status(200).json({ offers: { cheapest, fastest } });
  } catch (e) {
    res.status(500).json({ error: e.message || "Unknown error" });
  }
}
