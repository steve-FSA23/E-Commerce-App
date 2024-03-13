const pg = require("pg");
require("dotenv").config();
const client = new pg.Client(process.env.DATABASE_URL);

const uuid = require("uuid");
const bcrypt = require("bcrypt");
const jwt = require("jsonwebtoken");
const JWT = process.env.JWT;

module.exports = { client };
