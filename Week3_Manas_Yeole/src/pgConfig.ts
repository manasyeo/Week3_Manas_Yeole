import { Sequelize } from "sequelize";
const sequelize = new Sequelize({
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
export default sequelize;
