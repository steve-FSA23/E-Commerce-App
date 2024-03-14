const pg = require("pg");
require("dotenv").config();
const client = new pg.Client(process.env.DATABASE_URL);

const uuid = require("uuid");
const bcrypt = require("bcrypt");
const jwt = require("jsonwebtoken");
const JWT = process.env.JWT;

const createTables = async () => {
    const SQL = `
    DROP TABLE IF EXISTS favorites;
    DROP TABLE IF EXISTS cartItems;
    DROP TABLE IF EXISTS carts;
    DROP TABLE IF EXISTS products;
    DROP TABLE IF EXISTS users CASCADE;

    CREATE TABLE users(
      user_id UUID PRIMARY KEY,
      username VARCHAR(20) UNIQUE NOT NULL,
      password VARCHAR(255) NOT NULL,
      email VARCHAR(100) UNIQUE NOT NULL,
      address TEXT,
      phone_number VARCHAR(20),
      billing_info TEXT,
      is_admin BOOLEAN DEFAULT false
    );

    CREATE TABLE products(
      product_id UUID PRIMARY KEY,
      name VARCHAR(50) NOT NULL,
      description TEXT,
      price DECIMAL(10,2) NOT NULL,
      photo_url TEXT
    );
    
    CREATE TABLE favorites(
      favorite_id UUID PRIMARY KEY,
      user_id UUID REFERENCES users(user_id) NOT NULL,
      product_id UUID REFERENCES products(product_id) NOT NULL,
      CONSTRAINT unique_user_id_and_product_id UNIQUE (user_id, product_id)
    );


    CREATE TABLE carts(
        cart_id UUID PRIMARY KEY,
        user_id UUID REFERENCES users(user_id) ON DELETE CASCADE,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    );

    CREATE TABLE cartItems(
        cartItem_id UUID PRIMARY KEY,
        cart_id UUID REFERENCES carts(cart_id) ON DELETE CASCADE,
        product_id UUID REFERENCES products(product_id) ON DELETE CASCADE,
        quantity INTEGER NOT NULL
    );

  `;
    await client.query(SQL);
};

// Creating Items
const createUser = async ({
    username,
    password,
    email,
    address,
    phone_number,
    billing_info,
    is_admin,
}) => {
    const hashedPassword = await bcrypt.hash(password, 5);
    const SQL = `
    INSERT INTO users(user_id, username, password, email, address,phone_number, billing_info, is_admin)
    VALUES ($1, $2, $3, $4, $5, $6, $7, $8) RETURNING *
    `;
    const response = await client.query(SQL, [
        uuid.v4(),
        username,
        hashedPassword,
        email,
        address,
        phone_number,
        billing_info,
        is_admin,
    ]);
    return response.rows[0];
};

const createProduct = async ({ name, description, price, photo_url }) => {
    const SQL = `
    INSERT INTO products(product_id, name, description, price, photo_url) VALUES($1, $2, $3, $4, $5) RETURNING *
  `;

    const response = await client.query(SQL, [
        uuid.v4(),
        name,
        description,
        price,
        photo_url,
    ]);

    return response.rows[0];
};

const createFavorite = async ({ user_id, product_id }) => {
    const SQL = `
  INSERT INTO favorites(favorite_id, user_id, product_id) VALUES($1, $2, $3) RETURNING *
  `;
    const response = await client.query(SQL, [uuid.v4(), user_id, product_id]);
    return response.rows[0];
};

// Authentication

const authenticate = async ({ username, password }) => {
    const SQL = `
  SELECT user_id, password
  FROM users
  WHERE username = $1
  `;
    const response = await client.query(SQL, [username]);
    if (
        !response.rows.length ||
        (await bcrypt.compare(password, response.rows[0].password)) === false
    ) {
        const error = Error("Not authorized!");
        error.status = 401;
        throw error;
    }
    const token = jwt.sign({ id: response.rows[0].user_id }, JWT);
    return token;
};

const findUserWithToken = async (token) => {
    let userId;
    try {
        const payload = await jwt.verify(token, JWT);
        userId = payload.user_id;
    } catch (ex) {
        const error = Error("not authorized");
        error.status = 401;
        throw error;
    }

    const SQL = `
  SELECT user_id, username
  FROM users
  WHERE user_id=$1
  `;

    const response = await client.query(SQL, [userId]);
    if (!response.rows.length) {
        const error = new Error("User not found");
        error.status = 401;
        throw error;
    }
    return response.rows[0];
};

// Fetching Items
const fetchUsers = async () => {
    const SQL = `
  SELECT user_id, username, email, address, phone_number FROM users;
  `;
    const response = await client.query(SQL);
    return response.rows;
};

const fetchProducts = async () => {
    const SQL = `
  SELECT * FROM products;
  `;
    const response = await client.query(SQL);
    return response.rows;
};

const fetchFavorites = async (user_id) => {
    const SQL = `
  SELECT * FROM favorites where user_id = $1
  `;
    const response = await client.query(SQL, [user_id]);
    return response.rows;
};

// Deleting Items
const destroyFavorite = async ({ user_id, favorite_id }) => {
    const SQL = `
  DELETE FROM favorites WHERE user_id=$1 AND favorite_id=$2
`;
    await client.query(SQL, [user_id, favorite_id]);
};

module.exports = {
    client,
    createTables,
    createUser,
    createProduct,
    createFavorite,
    fetchUsers,
    fetchProducts,
    fetchFavorites,
    authenticate,
    findUserWithToken,
    destroyFavorite,
};
