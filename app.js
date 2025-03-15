const express = require("express");
const app = express();
const path = require("path");
const dotenv = require("dotenv");
const mongoose = require("mongoose");
const bodyParser = require("body-parser");
const methodOverride = require("method-override");

// Load environment variables
dotenv.config({ path: "./config.env" });

// Connect to MongoDB
const connectDB = require("./config/database");
connectDB();

// Middleware
app.use(bodyParser.urlencoded({ extended: true }));
app.set("views", path.join(__dirname, "views"));
app.set("view engine", "ejs");
app.use(express.json());
app.use(express.static("public"));
app.use(methodOverride("_method"));


// Configure middleware (session, passport, flash)
const configureMiddleware = require("./config/middleware");
configureMiddleware(app);

// Routes
const userRoutes = require("./routes/users");
const adminRoutes = require("./routes/admin");
app.use(userRoutes);
app.use(adminRoutes);

// Error handling middleware
app.use((err, req, res, next) => {
    console.error(err.stack);
    res.status(500).render("error", { message: "Something went wrong!" });
});

// Start the server
const port = process.env.PORT || 3000;
app.listen(port, () => {
    console.log(`Server started on port ${port}.`);
});