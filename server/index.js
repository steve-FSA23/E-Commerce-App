const { client } = require("./db");
require("dotenv").config();
const express = require("express");
const app = express();
app.use(express.json());

//for deployment only
const path = require("path");
app.get("/", (req, res) =>
    res.sendFile(path.join(__dirname, "../client/dist/index.html"))
);
app.use(
    "/assets",
    express.static(path.join(__dirname, "../client/dist/assets"))
);

const init = async () => {
    const port = process.env.PORT;
    await client.connect();
    console.log("connected to database");

    app.listen(port, () => console.log(`listening on port ${port}`));
};
init();
