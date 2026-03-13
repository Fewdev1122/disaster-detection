import axios from "axios";

function parseCsv(csvText) {
  const lines = csvText.trim().split("\n");
  if (lines.length <= 1) return [];

  const headers = lines[0].split(",").map((h) => h.trim());

  return lines.slice(1).map((line) => {
    const values = line.split(",");
    const row = {};

    headers.forEach((header, index) => {
      row[header] = values[index]?.trim() ?? "";
    });

    return row;
  });
}

export async function getHotspotsThailand() {
  const apiKey = process.env.FIRMS_API_KEY;
  if (!apiKey) {
    throw new Error("FIRMS_API_KEY missing in .env");
  }

  const bbox = "97,5,106,21"; // ครอบประเทศไทยแบบคร่าว ๆ
  const dataset = "VIIRS_SNPP_NRT";
  const days = 1;

  const url = `https://firms.modaps.eosdis.nasa.gov/api/area/csv/${apiKey}/${dataset}/${bbox}/${days}`;

  const response = await axios.get(url, {
    responseType: "text",
    timeout: 15000,
  });

  return parseCsv(response.data);
}