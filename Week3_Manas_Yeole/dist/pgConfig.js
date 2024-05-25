"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const sequelize_1 = require("sequelize");
const sequelize = new sequelize_1.Sequelize({
    username: "postgres",
    host: "localhost",
    database: "testdatabase",
    password: "Manas@28",
    port: 5432,
    dialect: "postgres",
});
sequelize
    .authenticate()
    .then(() => {
    console.log("Database connection established successfully.");
})
    .catch((err) => {
    console.error("Unable to connect to the database:", err);
});
sequelize
    .sync()
    .then(() => {
    console.log("Models synchronized with the database.");
})
    .catch((err) => {
    console.error("Unable to synchronize models with the database:", err);
});
exports.default = sequelize;
//# sourceMappingURL=pgConfig.js.map