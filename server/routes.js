const express = require("express");
const router = express.Router();

const {
    createUser,
    updateUser,
    deleteUser,
    createProduct,
    createFavorite,
    fetchUsers,
    fetchProducts,
    fetchFavorites,
    destroyFavorite,
    deleteProduct,
    updateProduct,
    authenticate,
    findUserWithToken,
    isAdmin,
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

// isAdminMiddleware middleware
const isAdminMiddleware = async (req, res, next) => {
    try {
        const user = req.user;

        // Check if the user is an admin
        const admin = await isAdmin(user.user_id);
        if (!admin) {
            // If not an admin, send forbidden error
            return res.status(403).json({ error: "Unauthorized" });
        }

        // User is an admin, proceed to the next middleware or route handler
        next();
    } catch (error) {
        console.error("Error checking admin status:", error);
        return res.status(500).json({ error: "Internal server error" });
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
// Fetch all users
router.get("/users", isLoggedIn, isAdminMiddleware, async (req, res, next) => {
    try {
        // Call the fetchUsers function to retrieve all users
        const users = await fetchUsers();

        res.status(200).send({
            message: "Users retrieved successfully.",
            users: users,
        });
    } catch (error) {
        console.error("Error fetching users:", error);
        next(error);
    }
});

// Update user
router.put("/user/:userId/update", isLoggedIn, async (req, res, next) => {
    try {
        const userId = req.params.userId;
        const {
            username,
            password,
            email,
            address,
            phone_number,
            billing_info,
            is_admin,
        } = req.body;

        // Check if the required fields are provided
        if (!userId) {
            return res.status(400).json({ error: "User ID is required." });
        }
        // Update the user information
        const updatedUser = await updateUser({
            userId,
            username,
            password,
            email,
            address,
            phone_number,
            billing_info,
            is_admin,
        });
        // Send the updated user object in the response
        res.status(200).json({
            message: "User updated successfully.",
            user: updatedUser,
        });
    } catch (error) {
        console.error("Error updating user:", error);
        next(error);
    }
});
// Delete User
router.delete("/user/:userId/delete", isLoggedIn, async (req, res, next) => {
    try {
        const userId = req.params.userId;

        // Call the deleteUser function to delete the user
        await deleteUser(userId);

        res.status(204).send({
            message: "User deleted successfully.",
        });
    } catch (error) {
        console.error("Error deleting user:", error);
        next(error);
    }
});

// Create new product
router.post(
    "/products/create",
    isLoggedIn,
    isAdminMiddleware,
    async (req, res, next) => {
        try {
            const { name, description, price, photo_url } = req.body;

            // validate input data
            if (!name || !description || !price || !photo_url) {
                return res.status(400).json({
                    error: "A product name, description, valid price, and photo_url is a required field",
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
    }
);

// Update product
router.put(
    "/product/:productId/update",
    isLoggedIn,
    isAdminMiddleware,
    async (req, res, next) => {
        try {
            const productId = req.params.productId;

            const { name, description, price, photo_url } = req.body;

            // Check if the required fields are provided
            if (!productId) {
                return res
                    .status(400)
                    .send({ error: "Product ID is required." });
            }

            // Update the product information by passing productId
            const updatedProduct = await updateProduct({
                product_id: productId,
                name,
                description,
                price,
                photo_url,
            });

            // Send the updated product object in the response
            res.status(200).json({
                message: "Product updated successfully.",
                product: updatedProduct,
            });
        } catch (error) {
            console.error("Error updating product:", error);
            next(error);
        }
    }
);
// Delete a product
router.delete(
    "/product/:productId/delete",
    isLoggedIn,
    isAdminMiddleware,
    async (req, res, next) => {
        try {
            const productId = req.params.productId;

            // Call the deletePrduct function to delete the product
            await deleteProduct(productId);

            res.status(204).send({
                message: "Product deleted successfully.",
            });
        } catch (error) {
            console.error("Error deleting product:", error);
            next(error);
        }
    }
);

// Create favoite product
router.post("/users/:userId/favorites", isLoggedIn, async (req, res, next) => {
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

// Fetch favorite product
router.get("/users/:userId/favorites", isLoggedIn, async (req, res, next) => {
    try {
        const userId = req.params.userId;

        // Call the fetchFavorites function to retrieve the list of favorites for the user
        const favorites = await fetchFavorites(userId);

        res.status(200).json({
            message: "Favorites retrieved successfully.",
            favorites: favorites,
        });
    } catch (error) {
        console.error("Error fetching favorites:", error);
        next(error);
    }
});

// Delete favorite product
router.delete(
    "/users/:userId/favorites/:favoriteId",
    isLoggedIn,
    async (req, res, next) => {
        try {
            const userId = req.params.userId;
            const favoriteId = req.params.favoriteId;

            // Call the destroyFavorite function to remove the favorite from the database
            await destroyFavorite({ user_id: userId, favorite_id: favoriteId });

            res.status(204).json({
                message: "Favorite deleted successfully.",
            });
        } catch (error) {
            console.error("Error deleting favorite:", error);
            next(error);
        }
    }
);

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
