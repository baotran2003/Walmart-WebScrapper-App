const express = require("express");
const router = express.Router();
const authMiddleware = require("../middlewares/authMiddleware");
const productController = require("../controllers/productController");

// GET routes
router.get("/", (req, res) => {
    res.render("index");
});

router.get("/dashboard", authMiddleware.isAuthenticatedUser, productController.getDashboard);
router.get("/product/new", authMiddleware.isAuthenticatedUser, productController.getNewProduct);
router.get("/product/search", authMiddleware.isAuthenticatedUser, productController.getSearchProduct);
router.get("/products/instock", authMiddleware.isAuthenticatedUser, productController.getInStockProducts);
router.get("/products/updated", authMiddleware.isAuthenticatedUser, productController.getUpdatedProducts);
router.get("/products/notupdated", authMiddleware.isAuthenticatedUser, productController.getNotUpdatedProducts);
router.get("/products/outofstock", authMiddleware.isAuthenticatedUser, productController.getOutOfStockProducts);
router.get("/products/pricechanged", authMiddleware.isAuthenticatedUser, productController.getPriceChangedProducts);
router.get("/products/backinstock", authMiddleware.isAuthenticatedUser, productController.getBackInStockProducts);
router.get("/update", authMiddleware.isAuthenticatedUser, (req, res) => {
    res.render("./admin/update", { message: "" });
});

// POST routes
router.post("/product/new", authMiddleware.isAuthenticatedUser, productController.postNewProduct);
router.post("/update", authMiddleware.isAuthenticatedUser, productController.postUpdateProducts);

// DELETE routes
router.delete("/delete/product/:id", authMiddleware.isAuthenticatedUser, productController.deleteProduct);

// 404 route
router.get("*", (req, res) => {
    res.render("./admin/notfound");
});

module.exports = router;
