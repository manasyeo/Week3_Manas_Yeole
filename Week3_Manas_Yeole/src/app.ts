import express, { Request, Response } from "express";
import {
  getCoordinates,
  getWeather,
  getWeatherData,
  saveWeatherData,
  sendWeatherEmail,
} from "./service";

const app = express();
const port = 8000;
app.use(express.json());

app.post("/api/SaveWeatherMapping", async (req, res) => {
  try {
    const cities = req.body;
    const weatherDataPromises = cities.map(
      async (cityObj: { city: string; country: string }) => {
        const { city, country } = cityObj;
        const coordinates = await getCoordinates(city, country);
        if (!coordinates) {
          console.error(`Coordinates not found for ${city}, ${country}`);
          return null;
        }

        const weather = await getWeather(
          coordinates.longitude,
          coordinates.latitude
        );
        if (!weather) {
          console.error(`Weather not found for ${city}, ${country}`);
          return null;
        }

        const time = new Date();
        await saveWeatherData(
          city,
          country,
          weather,
          time,
          coordinates.longitude,
          coordinates.latitude
        );

        return { city, country, weather, time, ...coordinates };
      }
    );

    const weatherData = await Promise.all(weatherDataPromises);
    res.status(200).json(weatherData.filter((data) => data !== null));
  } catch (error) {
    console.error("Error:", error);
    res.status(500).json({ message: "Internal Server Error" });
  }
});

app.get("/api/weatherDashboard", async (req, res) => {
  try {
    const city = req.query.city as string | undefined;
    const weatherData = await getWeatherData(city);
    res.status(200).json(weatherData);
  } catch (error) {
    console.error("Error:", error);
    res.status(500).json({ message: "Internal Server Error" });
  }
});

app.post("/api/sendWeatherEmail", async (req, res) => {
  try {
    const cities = req.body;
    await sendWeatherEmail(cities);
    res.status(200).json({ message: "Email sent successfully" });
  } catch (error) {
    console.error("Error:", error);
    res.status(500).json({ message: "Internal Server Error" });
  }
});

app.listen(port, () => {
  console.log("Hii We are comfortable with node js");
});
