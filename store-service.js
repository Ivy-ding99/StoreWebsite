const fs = require('fs');
const path = require('path');

// Path to data files
const itemsFilePath = path.join(__dirname, 'data', 'items.json');
const categoriesFilePath = path.join(__dirname, 'data', 'categories.json');

// Global arrays to store data
let items = [];
let categories = [];


// Function to read and parse a JSON file
function readJSONFile(filePath) {
  return new Promise((resolve, reject) => {
    fs.readFile(filePath, 'utf8', (err, data) => {
      if (err) {
        reject(`Unable to read ${path.basename(filePath)}: ${err}`);
        return;
      }

      try {
        const parsedData = JSON.parse(data);
        resolve(parsedData);
      } catch (err) {
        reject(`Error parsing JSON file ${path.basename(filePath)}: ${err}`);
      }
    });
  });
}


// Initialize function to read and parse both JSON files
function initialize() {
  return Promise.all([
    readJSONFile(itemsFilePath),
    readJSONFile(categoriesFilePath),
  ])
    .then(([itemsData, categoriesData]) => {
      items = itemsData;
      categories = categoriesData;
      
    })
    .catch((err) => {
      console.error('Error initializing data:', err);
    });
}

// Invoke the initialize function to load the data
initialize();

function getAllItems() {
  return new Promise((resolve, reject) => {
    if (items.length === 0) {
      reject('No items found');
    } else {      
      console.log(items);
      resolve(items);
      
    }
  });
}

// get published items
function getPublishedItems() {
  return new Promise((resolve, reject) => {
    const publishedItems = items.filter((item) => item.published === true);
    if (publishedItems.length === 0) {
      reject('No published items found');
    } else {
      resolve(publishedItems);
    }
  });
}

// get all categories
function getCategories() {
  return new Promise((resolve, reject) => {
    if (categories.length === 0) {
      reject('No categories found');
    } else {
      resolve(categories);
    }
  });
}

module.exports = {
  getAllItems,
  getPublishedItems,
  getCategories,
  initialize,
};
