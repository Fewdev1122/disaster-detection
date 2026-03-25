import crypto from "crypto";
import supabase from "../config/supabase.js";

const BASE_URL = "https://api-gateway.gistda.or.th/api/2.0/resources/features";

function buildUrl(period, params = {}) {
  let endpointPath = "";

  if (period === "flood-freq") {
    endpointPath = "flood-freq";
  } else {
    endpointPath = `flood/${period}`;
  }

  const url = new URL(`${BASE_URL}/${endpointPath}`);

  Object.entries(params).forEach(([key, value]) => {
    if (value !== undefined && value !== null && value !== "") {
      url.searchParams.set(key, value);
    }
  });

  url.searchParams.set("api_key", process.env.GISTDA_API_KEY);

  return url.toString();
}

async function fetchFloodFeatures(period, params = {}) {
  const url = buildUrl(period, {
    limit: params.limit ?? 100,
    offset: params.offset ?? 0,
    pv_idn: params.pv_idn,
    ap_idn: params.ap_idn,
    tb_idn: params.tb_idn,
    bbox: params.bbox,
  });

  console.log("Flood URL:", url.replace(process.env.GISTDA_API_KEY, "***"));

  const response = await fetch(url, {
    headers: {
      accept: "application/json",
    },
  });

  if (!response.ok) {
    const text = await response.text();
    throw new Error(`GISTDA flood API error ${response.status}: ${text}`);
  }

  return await response.json();
}

function makeFeatureHash(period, feature, observedAt) {
  const raw = JSON.stringify({
    period,
    observedAt,
    geometry: feature.geometry,
    properties: feature.properties || {},
  });

  return crypto.createHash("sha256").update(raw).digest("hex");
}

function normalizeFeature(period, feature, observedAt) {
  const props = feature.properties || {};

  return {
    source: "gistda",
    period,
    pv_idn: props.pv_idn || props.PV_IDN || null,
    ap_idn: props.ap_idn || props.AP_IDN || null,
    tb_idn: props.tb_idn || props.TB_IDN || null,
    geom_type: feature.geometry?.type || null,
    geometry: feature.geometry,
    properties: props,
    observed_at: observedAt || null,
    feature_hash: makeFeatureHash(period, feature, observedAt),
  };
}

export async function saveFloodToDatabase({
  period = "1day",
  pv_idn,
  ap_idn,
  tb_idn,
  bbox,
  limit = 100,
  offset = 0,
} = {}) {
  if (!process.env.GISTDA_API_KEY) {
    throw new Error("Missing GISTDA_API_KEY");
  }

  const data = await fetchFloodFeatures(period, {
    pv_idn,
    ap_idn,
    tb_idn,
    bbox,
    limit,
    offset,
  });

  const features = Array.isArray(data.features) ? data.features : [];
  const observedAt = data.timeStamp || new Date().toISOString();

  if (features.length === 0) {
    return {
      inserted: 0,
      skipped: 0,
      observedAt,
      total: 0,
    };
  }

  const rows = features.map((feature) =>
    normalizeFeature(period, feature, observedAt)
  );

  const { data: insertedRows, error } = await supabase
    .from("flood_areas")
    .upsert(rows, { onConflict: "feature_hash" })
    .select("id");

  if (error) {
    throw new Error(`Supabase insert error: ${error.message}`);
  }

  return {
    inserted: insertedRows?.length || 0,
    skipped: rows.length - (insertedRows?.length || 0),
    observedAt,
    total: rows.length,
  };
}

export async function getFloodFromApi({
  period = "1day",
  pv_idn,
  ap_idn,
  tb_idn,
  bbox,
  limit = 100,
  offset = 0,
} = {}) {
  return fetchFloodFeatures(period, {
    pv_idn,
    ap_idn,
    tb_idn,
    bbox,
    limit,
    offset,
  });
}