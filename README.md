# Walmart Web Scraper App

## Overview
The Walmart Web Scraper App is a Node.js-based web application designed to scrape product data from Walmart's website, manage product information, and provide a user-friendly dashboard for authenticated users. It allows users to track product details such as title, price, stock status, and updates over time. The app includes user authentication, password management, and administrative features.

## Features
- **Web Scraping**: Scrapes product data (title, price, stock status) from Walmart URLs using Puppeteer and Cheerio.
- **User Authentication**: Secure login/signup system with Passport.js, including password reset via email (using Nodemailer).
- **Product Management**: Add, update, and delete products in a MongoDB database.
- **Dashboard**: Displays product status (in stock, out of stock, price changed, back in stock, etc.).
- **Admin Controls**: Manage users and products with CRUD operations.
- **Real-time Updates**: Automatically update product information and track changes.

## Tech Stack
- **Backend**: Node.js, Express.js
- **Frontend**: EJS templating engine
- **Database**: MongoDB (via Mongoose)
- **Scraping**: Puppeteer, Cheerio
- **Authentication**: Passport.js (local strategy)
- **Email Service**: Nodemailer (Gmail SMTP)
- **Middleware**: Custom authentication middleware
