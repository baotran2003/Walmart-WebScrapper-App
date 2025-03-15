const session = require("express-session");
const flash = require("connect-flash");
const passport = require("passport");
const localStrategy = require("passport-local").Strategy;
const User = require("../models/usermodel");

module.exports = (app) => {
    // Session configuration
    app.use(
        session({
            secret: "Just a simple login/sign up application.",
            resave: true,
            saveUninitialized: true,
        })
    );

    // Passport configuration
    app.use(passport.initialize());
    app.use(passport.session());
    passport.use(new localStrategy({ usernameField: "email" }, User.authenticate()));
    passport.serializeUser(User.serializeUser());
    passport.deserializeUser(User.deserializeUser());

    // Flash messages
    app.use(flash());

    // Global variables for flash messages and current user
    app.use((req, res, next) => {
        res.locals.success_msg = req.flash("success_msg");
        res.locals.error_msg = req.flash("error_msg");
        res.locals.error = req.flash("error");
        res.locals.currentUser = req.user;
        next();
    });
};
