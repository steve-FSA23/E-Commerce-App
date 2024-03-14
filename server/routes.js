const express = require("express");
const router = express.Router();

const {
    createUser,
    createProduct,
    createFavorite,
    fetchUsers,
    fetchProducts,
    fetchFavorites,
    destroyFavorite,
    authenticate,
    findUserWithToken,
} = require("./db");

// validation function
const validateRequiredFields = (req, res, next) => {
    const { username, password, email } = req.body;
    if (!username || !password || !email) {
        return res
            .status(400)
            .send({ error: "Username, password, and email are required." });
    }
    next();
};

// isLoggedIn middleware
const isLoggedIn = async (req, res, next) => {
    try {
        req.user = await findUserWithToken(req.headers.authorization);
        next();
    } catch (ex) {
        next(ex);
    }
};

// Error handling middleware
const errorHandler = (err, req, res, next) => {
    console.error("Error:", err);
    res.status(err.status || 500).send({
        error: err.message || "Internal Server Error",
    });
};

//Create new user
router.post("/users/signup", validateRequiredFields, async (req, res, next) => {
    try {
        const {
            username,
            password,
            email,
            address,
            phone_number,
            billing_info,
            is_admin,
        } = req.body;

        // Create the user in the database
        const newUser = await createUser({
            username,
            password,
            email,
            address,
            phone_number,
            billing_info,
            is_admin,
        });
        res.status(201).send({
            message: "User created successfully.",
            data: [newUser],
        });
    } catch (error) {
        console.error("Error creating user:", error);
        next(error);
    }
});

// Create new product
router.post("/products/create", async (req, res, next) => {
    try {
        const { name, description, price, photo_url } = req.body;

        // validate input data
        if (!name || !description || !price || !photo_url) {
            return res.status(400).json({
                error: "A product name, description, price, and photo_url is a required field",
            });
        }
        // Create the product in the database
        const newProduct = await createProduct({
            name,
            description,
            price,
            photo_url,
        });

        res.status(201).send({
            message: "Product created successfully.",
            data: [newProduct],
        });
    } catch (error) {
        console.error("Error creating product:", error);
        next(error);
    }
});

// Create favoite product
router.post("/users/:userId/favorites", async (req, res, next) => {
    try {
        if (req.params.userId !== req.user.user_id) {
            const error = Error("not authorized");
            error.status = 401;
            throw error;
        }
        res.status(201).send(
            await createFavorite({
                user_id: req.params.userId,
                product_id: req.body.product_id,
            })
        );
    } catch (ex) {
        next(ex);
    }
});

// Login user
router.post("/auth/login", async (req, res, next) => {
    try {
        res.send(await authenticate(req.body));
    } catch (ex) {
        next(ex);
    }
});

// Authenticate user
router.get("/auth/me", isLoggedIn, async (req, res, next) => {
    try {
        res.send(req.user);
    } catch (ex) {
        next(ex);
    }
});

// Fetch products
router.get("/products", async (req, res, next) => {
    try {
        res.send(await fetchProducts());
    } catch (ex) {
        next(ex);
    }
});

// Error handling middleware
router.use(errorHandler);

module.exports = router;
