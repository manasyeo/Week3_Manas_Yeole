"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.sendWeatherEmail = exports.getWeatherData = exports.saveWeatherData = exports.getWeather = exports.getCoordinates = void 0;
const axios_1 = __importDefault(require("axios"));
const userModel_1 = require("./userModel");
const pgConfig_1 = __importDefault(require("./pgConfig"));
const nodemailer_1 = __importDefault(require("nodemailer"));
const GEO_API_URL = "https://api.api-ninjas.com/v1/geocoding";
const GEO_API_KEY = "YDSdAvYrv4ITMtOTjOHlevyFqK4XdAQEAKC9dCjQ";
const WEATHER_API_URL = "https://weatherapi-com.p.rapidapi.com/current.json";
const WEATHER_API_KEY = "ff555c38c4msh4472edf3173d04cp12f438jsna3647733573f";
const WEATHER_API_HOST = "weatherapi-com.p.rapidapi.com";
const getCoordinates = (city, country) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const response = yield axios_1.default.get(GEO_API_URL, {
            params: { city, country },
            headers: { "X-Api-Key": GEO_API_KEY },
        });
        if (response.data.length === 0) {
            console.error(`No geocoding data found for ${city}, ${country}`);
            return null;
        }
        return response.data[0];
    }
    catch (error) {
        console.error(`Error fetching coordinates for ${city}, ${country}:`, error);
        return null;
    }
});
exports.getCoordinates = getCoordinates;
const getWeather = (longitude, latitude) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const response = yield axios_1.default.get(WEATHER_API_URL, {
            params: { q: `${latitude},${longitude}` },
            headers: {
                "X-RapidAPI-Key": WEATHER_API_KEY,
                "X-RapidAPI-Host": WEATHER_API_HOST,
            },
        });
        return response.data.current.condition.text;
    }
    catch (error) {
        console.error(`Error fetching weather for coordinates (${latitude}, ${longitude}):`, error);
        return null;
    }
});
exports.getWeather = getWeather;
const saveWeatherData = (city, country, weather, time, longitude, latitude) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        yield userModel_1.Weather.create({
            city,
            country,
            weather: weather || "",
            time,
            longitude,
            latitude,
        });
        console.log(`Weather data saved for ${city}, ${country}`);
    }
    catch (error) {
        console.error(`Error saving weather data for ${city}, ${country}:`, error);
    }
});
exports.saveWeatherData = saveWeatherData;
const getWeatherData = (city) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        if (city) {
            // Fetch all data related to the specified city
            const weatherData = yield userModel_1.Weather.findAll({
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
        }
        else {
            // Fetch only the latest weather conditions for all cities
            const distinctCities = yield userModel_1.Weather.findAll({
                attributes: [[pgConfig_1.default.fn("DISTINCT", pgConfig_1.default.col("city")), "city"]],
            });
            const latestWeatherData = yield Promise.all(distinctCities.map((data) => __awaiter(void 0, void 0, void 0, function* () {
                const latestData = yield userModel_1.Weather.findOne({
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
            })));
            // Filter out any null values from the results
            return latestWeatherData.filter((data) => data !== null);
        }
    }
    catch (error) {
        console.error("Error fetching weather data:", error);
        throw error;
    }
});
exports.getWeatherData = getWeatherData;
const transporter = nodemailer_1.default.createTransport({
    host: "sandbox.smtp.mailtrap.io",
    port: 2525, // You can use any email service provider
    auth: {
        user: "54b6aea8b4d4a1",
        pass: "ac29c960949b7d",
    },
    debug: true, // Show debug output
    logger: true,
});
const generateHTMLTable = (data) => {
    const rows = data
        .map((d) => `
    <tr>
      <td>${d.id}</td>
      <td>${d.city}</td>
      <td>${d.country}</td>
      <td>${new Date(d.date).toLocaleString()}</td>
      <td>${d.weather}</td>
    </tr>
  `)
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
const sendWeatherEmail = (cities) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const weatherData = yield Promise.all(cities.map((cityObj) => __awaiter(void 0, void 0, void 0, function* () {
            const data = yield (0, exports.getWeatherData)(cityObj.city);
            return data;
        })));
        // Flatten the array of arrays
        const flattenedWeatherData = weatherData.flat();
        const html = generateHTMLTable(flattenedWeatherData);
        const mailOptions = {
            from: "centra.apis@gmail.com",
            to: "manasyeole28022002@gmail.com", // Recipient email
            subject: "Weather Data",
            html,
        };
        yield transporter.sendMail(mailOptions);
        console.log("Email sent successfully");
    }
    catch (error) {
        console.error("Error sending email:", error);
        throw error;
    }
});
exports.sendWeatherEmail = sendWeatherEmail;
//# sourceMappingURL=service.js.map