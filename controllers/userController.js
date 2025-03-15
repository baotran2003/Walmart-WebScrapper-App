const User = require("../models/usermodel");

module.exports = {
    getAllUsers: (req, res) => {
        User.find({})
            .then((users) => {
                res.render("./users/alluser", { users: users });
            })
            .catch((err) => {
                req.flash("error_msg", "Error: " + err);
                res.redirect("/user/all");
            });
    },

    getEditUser: (req, res) => {
        let searchQuery = { _id: req.params.id };

        User.findOne(searchQuery)
            .then((user) => {
                res.render("./users/edituser", { user: user });
            })
            .catch((err) => {
                req.flash("error_msg", "Error: " + err);
                res.redirect("/users/all");
            });
    },

    putEditUser: (req, res) => {
        let searchQuery = { _id: req.params.id };

        User.updateOne(searchQuery, {
            $set: {
                name: req.body.name,
                email: req.body.email,
            },
        })
            .then((user) => {
                req.flash("success_msg", "User updated successfully.");
                res.redirect("/users/all");
            })
            .catch((err) => {
                req.flash("error_msg", "Error: " + err);
                res.redirect("users/all");
            });
    },

    deleteUser: (req, res) => {
        let searchQuery = { _id: req.params.id };

        User.deleteOne(searchQuery)
            .then((user) => {
                req.flash("success_msg", "User deleted successfully.");
                res.redirect("/users/all");
            })
            .catch((err) => {
                req.flash("error_msg", "Error: " + err);
                res.redirect("users/all");
            });
    },
};
