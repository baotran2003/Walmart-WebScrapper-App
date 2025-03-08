const express = require("express");
const router = express.Router();
const puppeteer = require("puppeteer");
const cheerio = require("cheerio");

// Requiring product model
let product = require("../models/product");

// Checks if user is authenticated
function isAuthenticatedUser(req, res, next) {
    if (req.isAuthenticated()) {
        return next();
    }
    req.flash("error_msg", "Please Login First to access this page.");
    res.redirect("/login");
}

// Scrape function
async function scrapeData(url, page) {
    try {
        await page.goto(url, { waitUntil: load, timeout: 0 });
        const html = await page.evaluate(() => document.body.innerHTML);
        const $ = await cheerio.load(html);

        let title = $("h1").text();
        let price = $("span[itemprop='price']").text();

        // title, price, sellerName, outOfStock, checkStock, url

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
            title,
            price,
            stock,
            url,
        };
    } catch (error) {
        console.log("Error: " + error);
    }
}

module.exports = router;
