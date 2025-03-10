const express = require("express");
const app = express();
const path = require("path");
const dotenv = require("dotenv");
const mongoose = require("mongoose");
const bodyParser = require("body-parser");
const session = require("express-session");
const methodOverride = require("method-override");
const flash = require("connect-flash");
const passport = require("passport");
const localStrategy = require("passport-local").Strategy;

// requiring user and admin route
const userRoutes = require("./routes/users");
const adminRoutes = require("./routes/admin");

// Requiring user model
const User = require("./models/usermodel");

dotenv.config({ path: "./config.env" });

// Connect MongoDB Database
mongoose
    .connect(process.env.DATABASE)
    .then(() => {
        console.log("Connect To MongoDB Successful!");
    })
    .catch((err) => {
        console.error("Connect To MongoDB Fail !:", err);
    });

app.use(bodyParser.urlencoded({ extended: true }));
app.set("views", path.join(__dirname, "views"));
app.set("view engine", "ejs");
app.use(express.static("public"));

// middleware for session
app.use(
    session({
        secret: "Just a simple login/sign up application.",
        resave: true,
        saveUninitialized: true,
    })
);

app.use(passport.initialize());
app.use(passport.session());
passport.use(new localStrategy({ usernameField: "email" }, User.authenticate()));
passport.serializeUser(User.serializeUser());
passport.deserializeUser(User.deserializeUser());

// middleware flash messages
app.use(flash());

// middleware for method override
app.use(methodOverride("_method"));

// setting middleware globally
app.use((req, res, next) => {
    res.locals.success_msg = req.flash("success_msg");
    res.locals.error_msg = req.flash("error_msg");
    res.locals.error = req.flash("error");
    res.locals.currentUser = req.user;
    next();
});

app.use(userRoutes);
app.use(adminRoutes);

const port = process.env.PORT;
app.listen(port, () => {
    console.log("Server started on port 3000.");
});
