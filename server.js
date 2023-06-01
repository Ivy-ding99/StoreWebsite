/*********************************************************************************

WEB322 – Assignment 02
I declare that this assignment is my own work in accordance with Seneca  Academic Policy.  No part *  of this assignment has been copied manually or electronically from any other source (including 3rd party web sites) or distributed to other students.

Name: _Hui Ding
Student ID: 119835221
Date: 2023-05-29
Cyclic Web App URL: _______________________________________________________
GitHub Repository URL: https://github.com/Ivy-ding99/web322-app


********************************************************************************/ 

var path = require('path');
var express = require('express');
var app = express();
var storeServer = require('./store-service');
var HTTP_PORT = process.env.PORT || 8080;

// Call this function after http server starts
function onHttpStart() {
  console.log(`Express http server listening on ${HTTP_PORT}`);
}

// "static" middleware
app.use(express.static('public'));

// Setup a route to redirect to the default about page
app.get('/', function (req, res) {
  res.redirect('/about');});

// Setup the about route
app.get('/about', function (req, res) {
  res.sendFile(path.join(__dirname, '/views/about.html'));
});

// Public-facing route: /shop
app.get("/shop", function (req, res) {
  storeServer.getPublishedItems()
    .then((items) => {
      res.json(items);
    })
    .catch((err) => {
      res.json({ message: err });
    });
});

// Route: /items
app.get('/items', (req, res)=> {
  storeServer
    .getAllItems()
    .then((items) => {
      res.json(items);
    })
    .catch((err) => {
      res.json({ message: err });
    });
});

// Route: /categories
app.get('/categories',  (req, res)=> {
  storeServer
    .getCategories()
    .then((categories) => {
      res.json(categories);
    })
    .catch((err) => {
      res.json({ message: err });
    });
});

// Handle no matching route
app.use(function (req, res) {
  res.status(404).send("Page not found");
});

// Call the initialize() method from store-service.js to load data
storeServer.initialize()
  .then(() => {
    // Start the server only if initialization is successful
    app.listen(HTTP_PORT, onHttpStart);
  })
  .catch((err) => {
    // Output the error to the console if initialization fails
    console.error('Error initializing data:', err);
  });
