export default async function handler(req, res) {
  try {
    const {
      origin,
      destination,
      departure_date,
      return_date,
      passengers = 1
    } = req.query;

    if (!origin || !destination || !departure_date) {
      return res.status(400).json({
        error: "origin, destination and departure_date are required"
      });
    }

    // Convert common city names to IATA airport/city codes
    const airportCodes = {
      baghdad: "BGW",
      istanbul: "IST",
      doha: "DOH",
      dubai: "DXB",
      abu_dhabi: "AUH",
      london: "LON",
      paris: "PAR",
      frankfurt: "FRA",
      amsterdam: "AMS",
      barcelona: "BCN",
      madrid: "MAD",
      rome: "ROM",
      milan: "MIL",
      berlin: "BER",
      stockholm: "STO",
      copenhagen: "CPH",
      toronto: "YTO",
      montreal: "YMQ",
      vancouver: "YVR",
      halifax: "YHZ"
    };

    function toIata(value) {
      const cleaned = String(value).trim().toLowerCase();

      if (airportCodes[cleaned]) {
        return airportCodes[cleaned];
      }

      return String(value).trim().toUpperCase();
    }

    const slices = [
      {
        origin: toIata(origin),
        destination: toIata(destination),
        departure_date
      }
    ];

    if (return_date) {
      slices.push({
        origin: toIata(destination),
        destination: toIata(origin),
        departure_date: return_date
      });
    }

    const passengerCount = Math.max(1, Number(passengers));

    const response = await fetch(
      "https://api.duffel.com/air/offer_requests?return_offers=true",
      {
        method: "POST",
        headers: {
          Authorization: `Bearer ${process.env.DUFFEL_API_TOKEN}`,
          "Duffel-Version": "v2",
          "Content-Type": "application/json",
          Accept: "application/json"
        },
        body: JSON.stringify({
          data: {
            slices,
            passengers: Array.from(
              { length: passengerCount },
              () => ({ type: "adult" })
            ),
            cabin_class: "economy",
            max_connections: 1
          }
        })
      }
    );

    const data = await response.json();

    if (!response.ok) {
      return res.status(response.status).json(data);
    }

    return res.status(200).json(data);

  } catch (error) {
    console.error(error);

    return res.status(500).json({
      error: error.message || "Flight search failed"
    });
  }
}
