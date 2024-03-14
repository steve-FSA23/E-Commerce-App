const { client, createTables } = require("./db");

const express = require("express");
const routes = require("./routes");
const app = express();

app.use(express.json());
app.use(require("morgan")("dev"));
app.use("/api", routes);
require("dotenv").config();

//for deployment only
const path = require("path");

app.get("/", (req, res) =>
    res.sendFile(path.join(__dirname, "../client/dist/index.html"))
);
app.use(
    "/assets",
    express.static(path.join(__dirname, "../client/dist/assets"))
);

//Function to initialize connection to database
const init = async () => {
    const port = process.env.PORT;
    await client.connect();
    console.log("connected to database");

    // await createTables();
    // console.log("Tables Created 📊!");

    app.listen(port, () => console.log(`listening on port ${port}`));
};
init();
