const mongoose = require("mongoose");
const dotenv = require("dotenv");

dotenv.config({ path: "./config.env" });

const connectDB = async () => {
    mongoose
        .connect(process.env.DATABASE_LOCAL)
        .then(() => {
            console.log("Connect To MongoDB Successful!");
        })
        .catch((err) => {
            console.error("Connect To MongoDB Fail !:", err);
        });
};

module.exports = connectDB;
