const cheerio = require("cheerio"); // cherio parse, truy van DOM <=> JQuery

module.exports = {
    scrapeData: async function (url, page) {
        try {
            await page.goto(url, { waitUntil: "load", timeout: 0 });

            // get all html trong body
            const html = await page.evaluate(() => document.body.innerHTML);

            // load html -> cherio de use Jquery get data
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
    },
};
