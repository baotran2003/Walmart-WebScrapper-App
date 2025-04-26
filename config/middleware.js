/*
Session: Một cơ chế để lưu trữ dữ liệu người dùng giữa các request. Ví dụ: Sau khi đăng nhập, ID người dùng được lưu trong session để biết người dùng đã đăng nhập trong các request sau.
Passport: Một middleware xác thực mạnh mẽ, hỗ trợ xác thực qua email/mật khẩu (local) hoặc qua các dịch vụ như Google, Facebook (OAuth).
LocalStrategy: Một chiến lược xác thực của Passport, kiểm tra thông tin đăng nhập (email/mật khẩu) so với DB.
*/

const session = require("express-session"); // quan ly session
const flash = require("connect-flash");
const passport = require("passport");   // use to authentication
const localStrategy = require("passport-local").Strategy;
const User = require("../models/usermodel");

module.exports = (app) => {
    // Session configuration: save user login information
    app.use(
        session({
            secret: "Just a simple login/sign up application.", // secret: String de enconde session
            resave: true,   // save session mỗi lần request dù không thay đổi
            saveUninitialized: true,    // save new session dù chưa có new data
        })
    );

    // Passport configuration: Init passport and activation session in passport 
    app.use(passport.initialize());
    app.use(passport.session());    // Allowed Passport use session to remember logged in users
    passport.use(new localStrategy({ usernameField: "email" }, User.authenticate()));

    // Serialize: Convert user information into session-stored format
    // User.serializeUser() xác định cách lưu ID người dùng vào session
    passport.serializeUser(User.serializeUser());

    // Ngược lại
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
