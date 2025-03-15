const passport = require("passport");
const User = require("../models/usermodel");

module.exports = {
    getLogin: (req, res) => {
        res.render("./users/login");
    },

    getSignup: (req, res) => {
        res.render("./users/signup");
    },

    postSignup: (req, res) => {
        let { name, email, password } = req.body;

        let userData = {
            name: name,
            email: email,
        };

        User.register(userData, password, (err, user) => {
            if (err) {
                req.flash("error_msg", "Error: " + err);
                res.redirect("/signup");
            }
            req.flash("success_msg", "Account created successfully.");
            res.redirect("/signup");
        });
    },

    postLogin: passport.authenticate("local", {
        successRedirect: "/dashboard",
        failureRedirect: "/login",
        failureFlash: "Invalid email or password. Try Again !!!",
    }),

    getLogout: (req, res) => {
        req.logOut((err) => {
            if (err) {
                req.flash("error_msg", "Error: " + err);
                return res.redirect("/");
            }
            req.flash("success_msg", "You have been logged out.");
            res.redirect("/login");
        });
    },
};
