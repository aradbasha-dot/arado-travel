export default async function handler(req, res) {
  try {
    const { origin, destination, departure_date, return_date, passengers = 1 } = req.query;

    if (!origin || !destination || !departure_date) {
      return res.status(400).json({
        error: "origin, destination and departure_date are required"
      });
    }

    const slices = [
      {
        origin: origin.toUpperCase(),
        destination: destination.toUpperCase(),
        departure_date
      }
    ];

    if (return_date) {
      slices.push({
        origin: destination.toUpperCase(),
        destination: origin.toUpperCase(),
        departure_date: return_date
      });
    }

    const response = await fetch(
      "https://api.duffel.com/air/offer_requests",
      {
        method: "POST",
        headers: {
          "Authorization": `Bearer ${process.env.DUFFEL_API_TOKEN}`,
          "Duffel-Version": "v2",
          "Content-Type": "application/json",
          "Accept": "application/json"
        },
        body: JSON.stringify({
          data: {
            slices,
            passengers: Array.from(
              { length: Number(passengers) },
              () => ({ type: "adult" })
            ),
            cabin_class: "economy"
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
    return res.status(500).json({
      error: error.message
    });
  }
}
