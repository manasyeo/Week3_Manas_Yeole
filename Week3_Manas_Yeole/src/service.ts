import axios from "axios";
import { Weather } from "./userModel";
import sequelize from "./pgConfig";
import nodemailer from "nodemailer";

const GEO_API_URL = "https://api.api-ninjas.com/v1/geocoding";
const GEO_API_KEY = "YDSdAvYrv4ITMtOTjOHlevyFqK4XdAQEAKC9dCjQ";
const WEATHER_API_URL = "https://weatherapi-com.p.rapidapi.com/current.json";
const WEATHER_API_KEY = "ff555c38c4msh4472edf3173d04cp12f438jsna3647733573f";
const WEATHER_API_HOST = "weatherapi-com.p.rapidapi.com";

export interface Coordinates {
  latitude: number;
  longitude: number;
}

export const getCoordinates = async (
  city: string,
  country: string
): Promise<Coordinates | null> => {
  try {
    const response = await axios.get(GEO_API_URL, {
      params: { city, country },
      headers: { "X-Api-Key": GEO_API_KEY },
    });
    if (response.data.length === 0) {
      console.error(`No geocoding data found for ${city}, ${country}`);
      return null;
    }
    return response.data[0];
  } catch (error) {
    console.error(`Error fetching coordinates for ${city}, ${country}:`, error);
    return null;
  }
};

export const getWeather = async (
  longitude: number,
  latitude: number
): Promise<string | null> => {
  try {
    const response = await axios.get(WEATHER_API_URL, {
      params: { q: `${latitude},${longitude}` },
      headers: {
        "X-RapidAPI-Key": WEATHER_API_KEY,
        "X-RapidAPI-Host": WEATHER_API_HOST,
      },
    });
    return response.data.current.condition.text;
  } catch (error) {
    console.error(
      `Error fetching weather for coordinates (${latitude}, ${longitude}):`,
      error
    );
    return null;
  }
};

export const saveWeatherData = async (
  city: string,
  country: string,
  weather: string | null,
  time: Date,
  longitude: number,
  latitude: number
): Promise<void> => {
  try {
    await Weather.create({
      city,
      country,
      weather: weather || "",
      time,
      longitude,
      latitude,
    });
    console.log(`Weather data saved for ${city}, ${country}`);
  } catch (error) {
    console.error(`Error saving weather data for ${city}, ${country}:`, error);
  }
};

export const getWeatherData = async (city?: string) => {
  try {
    if (city) {
      // Fetch all data related to the specified city
      const weatherData = await Weather.findAll({
        where: { city },
        order: [["time", "DESC"]],
      });
      return weatherData.map((data) => ({
        id: data.id,
        city: data.city,
        country: data.country,
        date: data.time,
        weather: data.weather,
      }));
    } else {
      // Fetch only the latest weather conditions for all cities
      const distinctCities = await Weather.findAll({
        attributes: [[sequelize.fn("DISTINCT", sequelize.col("city")), "city"]],
      });

      const latestWeatherData = await Promise.all(
        distinctCities.map(async (data) => {
          const latestData = await Weather.findOne({
            where: { city: data.getDataValue("city") },
            order: [["time", "DESC"]],
          });
          if (latestData) {
            // Check if latestData is not null
            return {
              id: latestData.id,
              city: latestData.city,
              country: latestData.country,
              date: latestData.time,
              weather: latestData.weather,
            };
          }
          return null; // Handle case where latestData is null
        })
      );

      // Filter out any null values from the results
      return latestWeatherData.filter((data) => data !== null);
    }
  } catch (error) {
    console.error("Error fetching weather data:", error);
    throw error;
  }
};

const transporter = nodemailer.createTransport({
  host: "sandbox.smtp.mailtrap.io",
  port: 2525, // You can use any email service provider
  auth: {
    user: "54b6aea8b4d4a1",
    pass: "ac29c960949b7d",
  },
  debug: true, // Show debug output
  logger: true,
});

const generateHTMLTable = (data: any[]) => {
  const rows = data
    .map(
      (d) => `
    <tr>
      <td>${d.id}</td>
      <td>${d.city}</td>
      <td>${d.country}</td>
      <td>${new Date(d.date).toLocaleString()}</td>
      <td>${d.weather}</td>
    </tr>
  `
    )
    .join("");

  return `
    <table border="1">
      <thead>
        <tr>
          <th>ID</th>
          <th>City</th>
          <th>Country</th>
          <th>Date</th>
          <th>Weather</th>
        </tr>
      </thead>
      <tbody>
        ${rows}
      </tbody>
    </table>
  `;
};

export const sendWeatherEmail = async (
  cities: { city: string; country: string }[]
) => {
  try {
    const weatherData = await Promise.all(
      cities.map(async (cityObj) => {
        const data = await getWeatherData(cityObj.city);
        return data;
      })
    );

    // Flatten the array of arrays
    const flattenedWeatherData = weatherData.flat();

    const html = generateHTMLTable(flattenedWeatherData);

    const mailOptions = {
      from: "centra.apis@gmail.com",
      to: "manasyeole28022002@gmail.com", // Recipient email
      subject: "Weather Data",
      html,
    };

    await transporter.sendMail(mailOptions);
    console.log("Email sent successfully");
  } catch (error) {
    console.error("Error sending email:", error);
    throw error;
  }
};
