module.exports = {
    isAuthenticatedUser: function (req, res, next) {
        if (req.isAuthenticated()) {
            return next();
        }
        req.flash("error_msg", "Please Login First to access this page.");
        res.redirect("/login");
    },
};
