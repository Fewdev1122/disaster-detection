router.get("/recent", async (req, res) => {
  try {
    const limit = Number(req.query.limit || 10);

    const { data, error } = await supabase
      .from("incident_reports")
      .select("*")
      .order("created_at", { ascending: false })
      .limit(limit);

    if (error) throw error;

    res.json({ data });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});