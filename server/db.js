const pg = require("pg");
const client = new pg.Client(
    process.env.DATABASE_URL || "postgres://localhost/ecommerce-app-db"
);
const uuid = require("uuid");
const bcrypt = require("bcrypt");
const jwt = require("jsonwebtoken");
const JWT = process.env.JWT || "shhh";
