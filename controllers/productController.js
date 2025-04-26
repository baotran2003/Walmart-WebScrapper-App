const Product = require("../models/product");
const puppeteer = require("puppeteer"); // Tự động hóa trình duyệt để thu thập dữ liệu từ các URL sản phẩm.
const scraper = require("../utils/scraper");

module.exports = {
    getDashboard: (req, res) => {
        Product.find({}).then((products) => {
            res.render("./admin/dashboard", { products: products });
        });
    },

    getNewProduct: async (req, res) => {
        try {
            let url = req.query.search;
            if (url) {
                let browser = await puppeteer.launch({ headless: false });
                const page = await browser.newPage();

                // Call func scrapeData để collect data từ URL
                let result = await scraper.scrapeData(url, page);

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
    },

    postNewProduct: (req, res) => {
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
    },

    getSearchProduct: (req, res) => {
        let userSku = req.query.sku;
        if (userSku) {
            Product.findOne({ sku: userSku })
                .then((product) => {
                    if (!product) {
                        req.flash("error_msg", "Product does not exist in the database.");
                        return res.redirect("/product/search");
                    }
                    res.render("./admin/search", { productData: product });
                })
                .catch((err) => {
                    req.flash("error_msg", "Error" + err);
                    res.redirect("/product/new");
                });
        } else {
            res.render("./admin/search", { productData: "" });
        }
    },

    getInStockProducts: (req, res) => {
        Product.find({ newStock: "In stock" })
            .then((products) => {
                res.render("./admin/instock", { products: products });
            })
            .catch((err) => {
                req.flash("error_msg", "Error: " + err);
                res.redirect("/dashboard");
            });
    },

    getUpdatedProducts: (req, res) => {
        Product.find({ updateStatus: "Updated" })
            .then((products) => {
                res.render("./admin/updatedproducts", { products: products });
            })
            .catch((err) => {
                req.flash("Error: " + err);
                res.redirect("/dashboard");
            });
    },

    getNotUpdatedProducts: (req, res) => {
        Product.find({ updateStatus: "Not Updated" })
            .then((products) => {
                res.render("./admin/notupdatedproducts", { products: products });
            })
            .catch((err) => {
                req.flash("Error: " + err);
                res.redirect("/dashboard");
            });
    },

    getOutOfStockProducts: (req, res) => {
        Product.find({ newStock: "Out of stock" })
            .then((products) => {
                res.render("./admin/outofstock", { products: products });
            })
            .catch((err) => {
                req.flash("Error: " + err);
                res.redirect("/dashboard");
            });
    },

    getPriceChangedProducts: (req, res) => {
        Product.find({})
            .then((products) => {
                res.render("./admin/pricechanged", { products: products });
            })
            .catch((err) => {
                req.flash("error_msg", "Error:" + err);
                res.redirect("/dashboard");
            });
    },

    getBackInStockProducts: (req, res) => {
        Product.find({ $and: [{ oldStock: "Out of stock" }, { newStock: "In stock" }] })
            .then((products) => {
                res.render("./admin/backinstock", { products: products });
            })
            .catch((err) => {
                req.flash("error_msg", "Error: " + err);
                res.redirect("/dashboard");
            });
    },

    postUpdateProducts: async (req, res) => {
        try {
            res.render("./admin/update", { message: "update started." });
            Product.find({})
                .then(async (products) => {
                    for (let i = 0; i < products.length; i++) {
                        Product.updateOne(
                            { url: products[i].url },
                            {
                                $set: {
                                    oldPrice: products[i].newPrice,
                                    oldStock: products[i].newStock,
                                    updateStatus: "Not Updated",
                                },
                            }
                        ).then((products) => {});
                    }

                    let browser = await puppeteer.launch({ headless: false });
                    const page = await browser.newPage();

                    for (let i = 0; i < products.length; i++) {
                        let result = await scraper.scrapeData(products[i].url, page);
                        Product.updateOne(
                            { url: products[i].url },
                            {
                                $set: {
                                    title: result.title,
                                    newPrice: result.price,
                                    newStock: result.stock,
                                    updateStatus: "Updated",
                                },
                            }
                        ).then((products) => {});
                    }

                    browser.close();
                })
                .catch((err) => {
                    req.flash("error_msg", "Error: " + err);
                    res.redirect("/dashboard");
                });
        } catch (err) {
            req.flash("error_msg", "Error: " + err);
            res.redirect("/dashboard");
        }
    },

    deleteProduct: (req, res) => {
        let searchQuery = { _id: req.params.id };

        Product.deleteOne(searchQuery)
            .then((product) => {
                req.flash("success_msg", "Product deleted successfully.");
                res.redirect("/dashboard");
            })
            .catch((err) => {
                req.flash("error_msg", "Error: " + err);
                res.redirect("/dashboard");
            });
    },
};
