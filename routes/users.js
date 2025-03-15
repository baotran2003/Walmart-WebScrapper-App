const express = require("express");
const router = express.Router();
const authMiddleware = require("../middlewares/authMiddleware");
const authController = require("../controllers/authController");
const userController = require("../controllers/userController");
const passwordController = require("../controllers/passwordController");

// GET routes
router.get("/login", authController.getLogin);
router.get("/signup", authController.getSignup);
router.get("/logout", authController.getLogout);
router.get("/forgot", passwordController.getForgotPassword);
router.get("/reset/:token", passwordController.getResetPassword);
router.get("/password/change", authMiddleware.isAuthenticatedUser, passwordController.getChangePassword);
router.get("/users/all", authMiddleware.isAuthenticatedUser, userController.getAllUsers);
router.get("/edit/:id", authMiddleware.isAuthenticatedUser, userController.getEditUser);

// POST routes
router.post("/signup", authController.postSignup);
router.post("/login", authController.postLogin);
router.post("/forgot", passwordController.postForgotPassword);
router.post("/reset/:token", passwordController.postResetPassword);
router.post("/password/change", passwordController.postChangePassword);

// PUT routes
router.put("/edit/:id", userController.putEditUser);

// DELETE routes
router.delete("/delete/user/:id", userController.deleteUser);

module.exports = router;
