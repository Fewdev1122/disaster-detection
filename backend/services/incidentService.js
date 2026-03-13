import supabase from "../config/supabase.js";

export async function saveIncident({
  sourceType,
  imageUrl,
  disasterType,
  confidence,
  eventLat,
  eventLng,
  photoLat,
  photoLng,
  rescueUnitId,
  rawPrediction,
}) {
  try {
    const payload = {
      source_type: sourceType || null,
      image_url: imageUrl || null,
      disaster_type: disasterType || null,
      confidence: confidence ?? null,
      event_lat: eventLat ?? null,
      event_lng: eventLng ?? null,
      photo_lat: photoLat ?? null,
      photo_lng: photoLng ?? null,
      rescue_unit_id: rescueUnitId ?? null,
      raw_prediction: rawPrediction || null,
    };

    const { error } = await supabase.from("incidents_reports").insert(payload);

    if (error) {
      console.error("Save incident error:", error.message);
    }
  } catch (err) {
    console.error("Save incident unexpected error:", err.message);
  }
}