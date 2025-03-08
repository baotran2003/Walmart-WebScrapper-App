const express = require("express");
const router = express.Router();
const puppeteer = require("puppeteer");
const cheerio = require("cheerio");

// Requiring product model
let Product = require("../models/product");

// Checks if user is authenticated
function isAuthenticatedUser(req, res, next) {
    if (req.isAuthenticated()) {
        return next();
    }
    req.flash("error_msg", "Please Login First to access this page.");
    res.redirect("/login");
}

let browser;

// Scrape function
async function scrapeData(url, page) {
    try {
        await page.goto(url, { waitUntil: "load", timeout: 0 });
        const html = await page.evaluate(() => document.body.innerHTML); //Lấy data từ trang web để xử lý với Cheerio
        const $ = await cheerio.load(html);

        let title = $("h1").text();
        let price = $("span[itemprop='price']").first().text();

        let seller = "";
        let checkSeller = $("a[link-identifier='item']");
        if (checkSeller) {
            seller = checkSeller.text();
        }

        let outOfStock = "";
        let checkOutOfStock = $("span.w_yTSq");
        if (checkOutOfStock) {
            outOfStock = checkOutOfStock.text();
        }

        let deliveryNotAvailable = "";
        let checkDeliveryNotAvailable = $(".fulfillment-Delivery-intent");
        if (checkDeliveryNotAvailable) {
            deliveryNotAvailable = checkDeliveryNotAvailable.text();
        }

        let stock = "";

        if (
            seller.includes("walmart") ||
            outOfStock.includes("Out of Stock") ||
            deliveryNotAvailable.includes("Delivery not available")
        ) {
            stock = "Out of stock";
        } else {
            stock = "In stock";
        }

        return {
            url,
            title,
            price,
            stock,
        };
    } catch (error) {
        console.log("Error: " + error);
    }
}

// GET routes starts here
router.get("/product/new", isAuthenticatedUser, async (req, res) => {
    try {
        let url = req.query.search;
        if (url) {
            browser = await puppeteer.launch({ headless: false });
            const page = await browser.newPage();
            let result = await scrapeData(url, page);

            let productData = {
                title: result.title,
                price: result.price,
                stock: result.stock,
                productUrl: result.url,
            };
            res.render("./admin/newproduct", { productData: productData });
            browser.close();
        } else {
            let productData = {
                title: "",
                price: "",
                stock: "",
                productUrl: "",
            };
            res.render("./admin/newproduct", { productData: productData });
        }
    } catch (error) {
        req.flash("error_msg", "Error: " + error);
        res.redirect("/product/new");
    }
});

// POST routes start here
router.post("/product/new", isAuthenticatedUser, (req, res) => {
    let { title, price, stock, url, sku } = req.body;

    let newProduct = {
        title: title,
        newPrice: price,
        oldPrice: price,
        newStock: stock,
        oldStock: stock,
        sku: sku,
        company: "Walmart",
        url: url,
        updateStatus: "Updated",
    };

    Product.findOne({ sku: sku }).then((product) => {
        if (product) {
            req.flash("error_msg", "Product already exist in the database.");
            return res.redirect("/product/new");
        }

        Product.create(newProduct)
            .then((product) => {
                req.flash("success_msg", "Product created successfully in the database.");
                res.redirect("/product/new");
            })
            .catch((err) => {
                req.flash("error_msg", "Error: " + err);
                res.redirect("/product/new");
            });
    });
});

module.exports = router;
