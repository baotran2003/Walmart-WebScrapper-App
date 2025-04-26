/*
crypto: Tạo chuỗi ngẫu nhiên (token) để xác thực link đặt lại mật khẩu.
async: Thư viện hỗ trợ chạy các tác vụ bất đồng bộ theo thứ tự (waterfall).
nodemailer: Gửi email (link đặt lại mật khẩu, xác nhận đổi mật khẩu).
User model: Giả định sử dụng passport-local-mongoose để quản lý người dùng, hỗ trợ các hàm như setPassword.
*/

const crypto = require("crypto"); // create random token (use to reset password)
const async = require("async");
const nodemailer = require("nodemailer"); // gửi email (dùng để gửi link đặt lại mật khẩu)
const User = require("../models/usermodel");

module.exports = {
    getForgotPassword: (req, res) => {
        res.render("./users/forgot");
    },

    postForgotPassword: (req, res, next) => {
        async.waterfall(
            [
                // create random token
                (done) => {
                    crypto.randomBytes(30, (err, buf) => {
                        let token = buf.toString("hex");
                        done(err, token);
                    });
                },
                // Tìm người dùng và lưu token đặt lại mật khẩu
                (token, done) => {
                    User.findOne({ email: req.body.email })
                        .then((user) => {
                            if (!user) {
                                req.flash("error_msg", "User does not exist with this email.");
                                return res.redirect("/forgot");
                            }
                            // Lưu token đặt lại mật khẩu vào user
                            user.resetPasswordToken = token;

                            // Đặt thời gian hết hạn cho token (30 phút
                            user.resetPasswordExpires = Date.now() + 1800000;
                            user.save()
                                .then(() => done(null, token, user))
                                .catch((err) => done(err));
                        })
                        .catch((err) => {
                            req.flash("error_msg", "Error: " + err);
                            res.redirect("/forgot");
                        });
                },
                // Send email chứa link đặt lại mật khẩu
                (token, user) => {
                    // Create transporter để send email -> Gmail
                    let smtpTransport = nodemailer.createTransport({
                        service: "Gmail",
                        host: "smtp.gmail.com",
                        port: 587, // port cho TLS
                        secure: false,
                        auth: {
                            user: process.env.GMAIL_EMAIL,
                            pass: process.env.GMAIL_PASSWORD,
                        },
                        connectionTimeout: 10000, // Connect timeOut (10s)
                        greetingTimeout: 5000, // SMTP response timeOut(5s)
                    });

                    // config mail sẽ gửi
                    let mailOptions = {
                        to: user.email,
                        from: process.env.GMAIL_EMAIL,
                        subject: "Recovery Email from Auth Project",
                        text:
                            "Please click the following link to recover your password: \n\n" +
                            "http://" +
                            req.headers.host +
                            "/reset/" +
                            token +
                            "\n\n" +
                            "If you did not request this, please ignore this email.",
                    };

                    smtpTransport.sendMail(mailOptions, (err, info) => {
                        if (err) {
                            console.error("Send mail error:", err.message, "Full error:", err);
                            req.flash("error_msg", "Failed to send email: " + err.message);
                            return res.redirect("/forgot");
                        }
                        req.flash("success_msg", "Email sent with further instructions. Please check that.");
                        res.redirect("/forgot");
                    });
                },
            ],
            (err) => {
                if (err) {
                    console.error("Waterfall error:", err);
                    res.redirect("/forgot");
                }
            }
        );
    },

    // Func xử lý GET request cho trang reset password (dựa trên token)
    getResetPassword: (req, res) => {
        // Find user có token hop le và token chưa hết hạn
        User.findOne({
            resetPasswordToken: req.params.token,
            resetPasswordExpires: { $gt: Date.now() },
        })
            .then((user) => {
                if (!user) {
                    req.flash("error_msg", "Password reset token in invalid or has been expired.");
                    res.redirect("/forgot");
                }
                res.render("./users/newpassword", { token: req.params.token });
            })
            .catch((err) => {
                req.flash("error_msg", "Error: " + err);
                req.redirect("/forgot");
            });
    },

    postResetPassword: (req, res) => {
        async.waterfall(
            [
                (done) => {
                    User.findOne({
                        resetPasswordToken: req.params.token,
                        resetPasswordExpires: { $gt: Date.now() },
                    })
                        .then((user) => {
                            if (!user) {
                                req.flash("error_msg", "Password reset token is invalid or has expired.");
                                return res.redirect("/forgot");
                            }

                            if (req.body.password !== req.body.confirmpassword) {
                                req.flash("error_msg", "Passwords do not match.");
                                return res.redirect(`/reset/${req.params.token}`);
                            }

                            // update new passord for user
                            user.setPassword(req.body.password, (err) => {
                                if (err) {
                                    console.error("Error setting password:", err);
                                    req.flash("error_msg", "Error setting new password: " + err);
                                    return res.redirect(`/reset/${req.params.token}`);
                                }
                                user.resetPasswordToken = undefined;
                                user.resetPasswordExpires = undefined;
                                user.save((err) => {
                                    if (err) {
                                        console.error("Error saving user:", err);
                                        req.flash("error_msg", "Error saving user: " + err);
                                        return res.redirect(`/reset/${req.params.token}`);
                                    }
                                    // // Đăng nhập tự động cho user after reset password
                                    req.login(user, (err) => {
                                        if (err) {
                                            console.error("Error logging in:", err);
                                            return done(err);
                                        }
                                        done(null, user);
                                    });
                                });
                            });
                        })
                        .catch((err) => {
                            console.error("Database error:", err);
                            req.flash("error_msg", "Error: " + err);
                            return res.redirect("/forgot");
                        });
                },
                // Bước 2: Send email xác nhận đổi mật khẩu
                (user) => {
                    if (!user || !user.email) {
                        console.error("No valid user or email for sending confirmation:", user);
                        req.flash("error_msg", "Failed to send confirmation email due to invalid user.");
                        return res.redirect("/login");
                    }

                    // Create transporter để send email -> Gmail
                    let smtpTransport = nodemailer.createTransport({
                        service: "Gmail",
                        auth: {
                            user: process.env.GMAIL_EMAIL,
                            pass: process.env.GMAIL_PASSWORD,
                        },
                    });

                    let mailOptions = {
                        to: user.email,
                        from: process.env.GMAIL_EMAIL,
                        subject: "Your password has been changed.",
                        text:
                            "Hello, " +
                            user.email +
                            "\n\n" +
                            "This is a confirmation that the password for your account " +
                            user.email +
                            " has been changed.",
                    };

                    smtpTransport.sendMail(mailOptions, (err) => {
                        if (err) {
                            console.error("Send mail error:", err.message);
                            req.flash("error_msg", "Failed to send confirmation email.");
                        } else {
                            req.flash("success_msg", "Your password has been changed successfully.");
                        }
                        res.redirect("/login");
                    });
                },
            ],
            (err) => {
                if (err) {
                    console.error("Waterfall error:", err);
                    req.flash("error_msg", "An error occurred during password reset.");
                    res.redirect("/forgot");
                }
            }
        );
    },

    getChangePassword: (req, res) => {
        res.render("./users/changepassword");
    },

    postChangePassword: (req, res) => {
        if (req.body.password !== req.body.confirmpassword) {
            req.flash("error_msg", "Password do not match. Try again !!");
            return res.redirect("/password/change");
        }

        User.findOne({ email: req.user.email })
            .then((user) => {
                user.setPassword(req.body.password, (err) => {
                    user.save().then((user) => {
                        req.flash("success_msg", "Password changed successfully.");
                        res.redirect("/password/change");
                    });
                });
            })
            .catch((err) => {
                req.flash("error_msg", "Error: " + err);
                res.redirect("/password/change");
            });
    },
};
