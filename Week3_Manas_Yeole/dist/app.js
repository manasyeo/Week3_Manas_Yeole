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
const express_1 = __importDefault(require("express"));
const service_1 = require("./service");
const app = (0, express_1.default)();
const port = 8000;
app.use(express_1.default.json());
app.post("/api/SaveWeatherMapping", (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const cities = req.body;
        const weatherDataPromises = cities.map((cityObj) => __awaiter(void 0, void 0, void 0, function* () {
            const { city, country } = cityObj;
            const coordinates = yield (0, service_1.getCoordinates)(city, country);
            if (!coordinates) {
                console.error(`Coordinates not found for ${city}, ${country}`);
                return null;
            }
            const weather = yield (0, service_1.getWeather)(coordinates.longitude, coordinates.latitude);
            if (!weather) {
                console.error(`Weather not found for ${city}, ${country}`);
                return null;
            }
            const time = new Date();
            yield (0, service_1.saveWeatherData)(city, country, weather, time, coordinates.longitude, coordinates.latitude);
            return Object.assign({ city, country, weather, time }, coordinates);
        }));
        const weatherData = yield Promise.all(weatherDataPromises);
        res.status(200).json(weatherData.filter((data) => data !== null));
    }
    catch (error) {
        console.error("Error:", error);
        res.status(500).json({ message: "Internal Server Error" });
    }
}));
app.get("/api/weatherDashboard", (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const city = req.query.city;
        const weatherData = yield (0, service_1.getWeatherData)(city);
        res.status(200).json(weatherData);
    }
    catch (error) {
        console.error("Error:", error);
        res.status(500).json({ message: "Internal Server Error" });
    }
}));
app.post("/api/sendWeatherEmail", (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const cities = req.body;
        yield (0, service_1.sendWeatherEmail)(cities);
        res.status(200).json({ message: "Email sent successfully" });
    }
    catch (error) {
        console.error("Error:", error);
        res.status(500).json({ message: "Internal Server Error" });
    }
}));
app.listen(port, () => {
    console.log("Hii We are comfortable with node js");
});
//# sourceMappingURL=app.js.map