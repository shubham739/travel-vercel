// Frankfurter passthrough for currency conversion
export default async function handler(req, res) {
  try {
    const { base = "USD", symbols = "INR" } = req.query;
    const u = new URL("https://api.frankfurter.app/latest");
    u.searchParams.set("base", base);
    u.searchParams.set("symbols", symbols);
    const r = await fetch(u);
    const data = await r.json();
    res.status(200).json(data);
  } catch (e) {
    res.status(500).json({ error: e.message || "Unknown error" });
  }
}
