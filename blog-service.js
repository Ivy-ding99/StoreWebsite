
const Sequelize = require('sequelize');

var sequelize = new Sequelize('ttnkupls', 'ttnkupls', 'AVnV_lIHsD-__j1sMUjqwiqYNtZ4LnJR', {
  host: 'stampy.db.elephantsql.com',
  dialect: 'postgres',
  port: 5432,
  dialectOptions: {
      ssl: { rejectUnauthorized: false }
  },
  query: { raw: true }
});

//define Item Module
var Item=sequelize.define('Item',{
  
body:Sequelize.TEXT,
tile:Sequelize.STRING,
postDate:Sequelize.DATE,
featureImage:Sequelize.STRING,
published:Sequelize.BOOLEAN,
price:Sequelize.DOUBLE

});

var Category = sequelize.define('Category', {
  id: {
    type: Sequelize.INTEGER,
    primaryKey: true,
    autoIncrement: true,
    allowNull: false,
    field: 'id'
  },
  category: {
    type: Sequelize.STRING,
    field: 'category'
  },
  createdAt: {
    type: Sequelize.DATE,
    allowNull: false,
    field: 'createdAt'
  },
  updatedAt: {
    type: Sequelize.DATE,
    allowNull: false,
    field: 'updatedAt'
  }
});


//relationship
Category.hasMany(Item);
// Initialize function to read and parse both JSON files

function initialize() {
  return new Promise((resolve, reject) => {
    sequelize.sync({ force: true })
      .then(() => {
        console.log('Database synchronized');
        resolve();
      })
      .catch((error) => {
        console.error('Unable to sync the database');
        reject(error);
      });
  });
}

function getAllItems() {
  return new Promise((resolve, reject) => {
    Item.findAll()
      .then((items) => {
        if (items.length > 0) {
          resolve(items);
        } else {
          reject('No results returned');
        }
      })
      .catch((error) => {
        reject(error);
      });
  });
}

function getItemsByCategory(category) {
  return new Promise((resolve, reject) => {
    Item.findAll({
      where: { category: category }
    })
      .then((items) => {
        if (items.length > 0) {
          resolve(items);
        } else {
          reject('No results returned');
        }
      })
      .catch((error) => {
        reject(error);
      });
  });
}

function getItemsByMinDate(minDateStr) {
  return new Promise((resolve, reject) => {
    Item.findAll({
      where: {
        postDate: {
          [Op.gte]: new Date(minDateStr)
        }
      }
    })
      .then((items) => {
        if (items.length > 0) {
          resolve(items);
        } else {
          reject('No results returned');
        }
      })
      .catch((error) => {
        reject(error);
      });
  });
}

function getItemById(id) {
  return new Promise((resolve, reject) => {
    Item.findAll({
      where: { id: id }
    })
      .then((items) => {
        if (items.length > 0) {
          resolve(items[0]);
        } else {
          reject('No results returned');
        }
      })
      .catch((error) => {
        reject(error);
      });
  });
}

function addItem(itemData) {
  return new Promise((resolve, reject) => {
    itemData.published = (itemData.published) ? true : false;
    for (const prop in itemData) {
      if (itemData[prop] === '') {
        itemData[prop] = null;
      }
    }
    itemData.postDate = new Date();

    Item.create(itemData)
      .then(() => {
        resolve();
      })
      .catch((error) => {
        reject('Unable to create Item');
      });
  });
}

function getPublishedItems() {
  return new Promise((resolve, reject) => {
    Item.findAll({
      where: { published: true }
    })
      .then((items) => {
        if (items.length > 0) {
          resolve(items);
        } else {
          reject('No results returned');
        }
      })
      .catch((error) => {
        reject(error);
      });
  });
}

function getPublishedItemsByCategory(category) {
  return new Promise((resolve, reject) => {
    Item.findAll({
      where: { published: true, category: category }
    })
      .then((items) => {
        if (items.length > 0) {
          resolve(items);
        } else {
          reject('No results returned');
        }
      })
      .catch((error) => {
        reject(error);
      });
  });
}

function getCategories() {
  return new Promise((resolve, reject) => {
    Category.findAll()
      .then((categories) => {
        if (categories.length > 0) {
          resolve(categories);
        } else {
          reject('No results returned');
        }
      })
      .catch((error) => {
        reject(error);
      });
  });
}

//add Category
function addCategory(categoryData) {
  console.log(categoryData); // Check the value of categoryData here

  for (const key in categoryData) {
    if (categoryData.hasOwnProperty(key) && categoryData[key] === "") {
      categoryData[key] = null;
    }
  }

  return new Promise((resolve, reject) => {
    Category.create(categoryData)
      .then(() => {
        resolve();
      })
      .catch((error) => {
        reject("Unable to create category");
      });
  });
}



// deleteCategoryById(id) function
function deleteCategoryById(id) {
  return Category.destroy({ where: { id } })
    .then((deletedCount) => {
      if (deletedCount > 0) {
        return Promise.resolve();
      } else {
        return Promise.reject("Unable to remove category / Category not found");
      }
    })
    .catch(() => {
      return Promise.reject("Unable to remove category / Category not found");
    });
}
// deleteItemById(id) function
function deleteItemById(id) {
  return Item.destroy({ where: { id } })
    .then((deletedCount) => {
      if (deletedCount > 0) {
        // Item was deleted, resolve the promise
        return Promise.resolve();
      } else {
        // Item not found or not deleted, reject the promise
        return Promise.reject("Unable to delete Item");
      }
    })
    .catch(() => {
      // Error occurred, reject the promise
      return Promise.reject("Unable to delete Item");
    });
}
// Invoke the initialize function to load the data
//initialize();

module.exports = {
  initialize,
  getAllItems,
  getItemsByCategory,
  getItemsByMinDate,
  getItemById,
  addItem,
  getPublishedItems,
  getPublishedItemsByCategory,
  getCategories,
  addCategory,
  deleteItemById,
  deleteCategoryById
};


