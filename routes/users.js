const express = require("express");
const router = express.Router();
const User = require("../models/usermodel");
const passport = require("passport");
const crypto = require("crypto");
const async = require("async");
const nodemailer = require("nodemailer");

// Checks if user is authenticated
function isAuthenticatedUser(req, res, next) {
    if (req.isAuthenticated()) {
        return next();
    }
    req.flash("error_msg", "Please Login First to access this page.");
    res.redirect("/login");
}

// Get routes
router.get("/login", (req, res) => {
    res.render("./users/login");
});

router.get("/signup", (req, res) => {
    res.render("./users/signup");
});

router.get("/logout", (req, res) => {
    req.logOut((err) => {
        if (err) {
            req.flash("error_msg", "Error: " + err);
            return res.redirect("/");
        }
        req.flash("success_msg", "You have been logged out.");
        res.redirect("/login");
    });
});

router.get("/forgot", (req, res) => {
    res.render("./users/forgot");
});

router.get("/reset/:token", (req, res) => {
    User.findOne({ resetPasswordToken: req.params.token, resetPasswordExpires: { $gt: Date.now() } })
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
});

router.get("/password/change", isAuthenticatedUser, (req, res) => {
    res.render("./users/changepassword");
});

router.get("/users/all", isAuthenticatedUser, (req, res) => {
    User.find({})
        .then((users) => {
            res.render("./users/alluser", { users: users });
        })
        .catch((err) => {
            req.flash("error_msg", "Error: " +err);
            res.redirect("/user/all")
        });
});

router.get("/edit/:id", isAuthenticatedUser, (req, res) => {
    let searchQuery = { _id: req.params.id };

    User.findOne(searchQuery)
        .then((user) => {
            res.render("./users/edituser", { user: user });
        })
        .catch((err) => {
            req.flash("error_msg", "Error: " + err);
            res.redirect("/users/all");
        });
});

// POST routes
router.post("/signup", (req, res) => {
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
});

router.post(
    "/login",
    passport.authenticate("local", {
        successRedirect: "/dashboard",
        failureRedirect: "/login",
        failureFlash: "Invalid email or password. Try Again !!!",
    })
);

// Change password
router.post("/password/change", (req, res) => {
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
});

// Routes to handle forgot password
router.post("/forgot", (req, res, next) => {
    async.waterfall(
        [
            // Bước 1: Tạo token ngẫu nhiên để reset mật khẩu
            (done) => {
                crypto.randomBytes(30, (err, buf) => {
                    let token = buf.toString("hex"); // Chuyển đổi thành chuỗi hex
                    done(err, token); // Truyền token hoặc lỗi sang bước tiếp theo
                });
            },
            // Bước 2: Tìm user và lưu token cùng thời gian hết hạn
            (token, done) => {
                User.findOne({ email: req.body.email }) // Tìm user theo email
                    .then((user) => {
                        if (!user) {
                            req.flash("error_msg", "User does not exist with this email.");
                            return res.redirect("/forgot");
                        }
                        user.resetPasswordToken = token; // Gán token cho user
                        user.resetPasswordExpires = Date.now() + 1800000; // Đặt thời gian hết hạn (30 phút)
                        user.save() // Lưu thay đổi vào database
                            .then(() => done(null, token, user)) // Thành công, truyền token và user
                            .catch((err) => done(err)); // Lỗi, truyền lỗi
                    })
                    .catch((err) => {
                        req.flash("error_msg", "Error: " + err);
                        res.redirect("/forgot");
                    });
            },
            // Bước 3: Cấu hình và gửi email chứa link reset
            (token, user) => {
                let smtpTransport = nodemailer.createTransport({
                    service: "Gmail", // Sử dụng dịch vụ Gmail
                    host: "smtp.gmail.com", // Host SMTP của Gmail
                    port: 587, // Port cho TLS
                    secure: false, // Không dùng SSL (dùng TLS)
                    auth: {
                        user: process.env.GMAIL_EMAIL,
                        pass: process.env.GMAIL_PASSWORD,
                    },
                    connectionTimeout: 10000, // Thời gian chờ kết nối (10 giây)
                    greetingTimeout: 5000, // Thời gian chờ chào hỏi (5 giây)
                });

                // console.log("SMTP Config:", {
                //     user: process.env.GMAIL_EMAIL,
                //     pass: process.env.GMAIL_PASSWORD,
                // });

                let mailOptions = {
                    to: user.email, // Địa chỉ nhận (email của user)
                    from: process.env.GMAIL_EMAIL, // Địa chỉ gửi (từ biến môi trường)
                    subject: "Recovery Email from Auth Project", // Tiêu đề email
                    text:
                        "Please click the following link to recover your password: \n\n" +
                        "http://" +
                        req.headers.host + // Host của server (ví dụ: localhost:3000)
                        "/reset/" +
                        token + // Link chứa token
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
});

// Saving new password in DB
router.post("/reset/:token", (req, res) => {
    async.waterfall(
        [
            // Bước 1: Tìm user, kiểm tra token, và đặt mật khẩu mới
            (done) => {
                // console.log("Checking token from URL:", req.params.token);
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
                                req.login(user, (err) => {
                                    if (err) {
                                        console.error("Error logging in:", err);
                                        return done(err);
                                    }
                                    // console.log("Password reset and user logged in:", user.email);
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
            // Bước 2: Gửi email xác nhận
            (user) => {
                if (!user || !user.email) {
                    console.error("No valid user or email for sending confirmation:", user);
                    req.flash("error_msg", "Failed to send confirmation email due to invalid user.");
                    return res.redirect("/login");
                }

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
                        // console.log("Email sent successfully to:", user.email);
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
});

// PUT routes
router.put("/edit/:id", (req, res) => {
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
});

// DELETE routes
router.delete("/delete/user/:id", (req, res) => {
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
});

module.exports = router;
