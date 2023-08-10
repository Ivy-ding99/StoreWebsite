/*********************************************************************************

WEB322 – Assignment 06
I declare that this assignment is my own work in accordance with Seneca  Academic Policy.  No part *  of this assignment has been copied manually or electronically from any other source (including 3rd party web sites) or distributed to other students.

Name: _Hui Ding
Student ID: 119835221
Date: 2023-08-09
Cyclic Web App URL: https://ruby-better-hummingbird.cyclic.app/About
GitHub Repository URL: https://github.com/Ivy-ding99/web322-app.git


********************************************************************************/ 

const path = require('path');
const express = require('express');
const app = express();
const storeServer = require('./store-service');
const multer = require("multer");
const cloudinary = require('cloudinary').v2;
const streamifier = require('streamifier');
var HTTP_PORT = process.env.PORT || 8080;
const authData=require('./auth-service')

const exphbs = require('express-handlebars');
const Handlebars = require('handlebars');
const upload = multer(); 
const clientSessions=require('client-sessions');



  
// Call the initialize() method from store-service.js to load data
//our server also requires authData to be working properly, we must add its initialize method
storeServer.initialize()
.then(() => authData.initialize())
.then(() => {
    app.listen(HTTP_PORT, () => {
        console.log("app listening on: " + HTTP_PORT);
    });
}).catch((err) => {
    console.log("unable to start server: " + err);
});




// Import necessary modules and set up middleware here

storeData.initialize()
.then(() => authData.initialize())
    .then(function(){
      app.listen(HTTP_PORT, function(){
          console.log("app listening on: " + HTTP_PORT)
      });
  }).catch((err) => {
        console.log("Unable to start server: " + err);
    });
    


app.use(express.urlencoded({extended: true}));
//app.engine('.hbs', exphbs.engine({ extname: '.hbs' }));
//for adding custom "helpers"
app.engine('.hbs', exphbs.engine({ 
  extname: '.hbs',
  helpers: { 
      navLink: function(url,options){
         return ('<li class="nav-Item"><a '+(url==app.locals.activeRoute ? ' class="nav-link active" ' : ' class="nav-link" ')+ ' href="'+url+'">'+options.fn(this)+"</a></li>"); // helper without "context", ie {{#helper}} ... {{/helper}}
      },
      equal: function(lvalue,rvalue, options){
          if(arguments.length<3)
          throw new Error("Handlerbars Helper equal needs 2 parameters");
          if(lvalue!=rvalue){
            return options.inverse(this);
          }else{ return options.fn(this);}
      },
      safeHTML: function (value) {
        return new Handlebars.SafeString(value);
      }
  }
}));
app.set('view engine', '.hbs');
cloudinary.config({
  cloud_name: 'ivy-ding',
  api_key: '529833218661966',
  api_secret: 'aL6Ar89FFBVwV7AeFPzHcvqvKoU',
  secure: true
});


// "static" middleware
app.use(express.static('public'));
//Show the correct "active" Item
app.use(function(req,res,next){
  let route = req.path.substring(1);
  app.locals.activeRoute = "/" + (isNaN(route.split('/')[1]) ? route.replace(/\/(?!.*)/, "") : route.replace(/\/(.*)/, ""));
  app.locals.viewingCategory = req.query.category;
  next();
});
//
app.use(clientSessions({
  cookieName: 'session',
  secret: 'your-secret-key',
  duration: 24 * 60 * 60 * 1000, // 1 day
  activeDuration: 1000 * 60 * 5 // 5 minutes
}));
//Define the middleware to provide the "session" object to all templates:
app.use((req, res, next) => {
  res.locals.session = req.session;
  next();
});
//Define the ensureLogin middleware to protect routes:
const ensureLogin = (req, res, next) => {
  if (!req.session.user) {
      res.redirect('/login');
  } else {
      next();
  }
};
//// Apply ensureLogin middleware to routes
app.use('/items', ensureLogin);
app.use('/categories', ensureLogin);
app.use('/post', ensureLogin);
app.use('/category', ensureLogin);

// GET /login
app.get('/login', (req, res) => {
  res.render('login'); // Render the login view
});

// GET /register
app.get('/register', (req, res) => {
  res.render('register'); // Render the register view
});

// POST /register
app.post('/register', (req, res) => {
  const userData = {
    userName: req.body.userName,
    email: req.body.email,
    password: req.body.password,
    password2: req.body.password2, 
    userAgent: req.get('User-Agent')
  };

  authData.registerUser(userData)
    .then(() => {
      res.render('register', { successMessage: 'User created' });
    })
    .catch((err) => {
      res.render('register', { errorMessage: err, userName: req.body.userName });
    });
});

// POST /login
app.post('/login', (req, res) => {
  req.body.userAgent = req.get('User-Agent');

  authData.checkUser(req.body)
    .then((user) => {
      req.session.user = {
        userName: user.userName,
        email: user.email,
        loginHistory: user.loginHistory
      };
      res.redirect('/items');
    })
    .catch((err) => {
      res.render('login', { errorMessage: err, userName: req.body.userName });
    });
});

// GET /logout
app.get('/logout', ensureLogin,(req, res) => {
  req.session.reset(); // Reset the session
  res.redirect('/'); // Redirect to the home page
});

// GET /userHistory
app.get('/userHistory', ensureLogin, (req, res) => {
  res.render('userHistory'); // Render the userHistory view
});

// Setup a route to redirect to the default about page
app.get('/', function (req, res) {
  res.redirect('/store');});

// Setup the about route

app.get('/about', function (req, res) {
  res.render('about', {
    //layout: 'main',
    style: 'style-for-about',
    content: 'content-for-about'
  });
});

// Add route to process the submitted category data

app.post('/categories/add',ensureLogin, (req, res) => {
  console.log(req.body); // Add this line to log the req.body object
  const categoryData = {
    category: req.body.category
  };

  storeServer.addCategory(categoryData)
    .then(() => {
      res.redirect('/categories'); // Redirect to the categories view
    })
    .catch(() => {
      res.status(500).send('Unable to add category'); // Error occurred, return 500 status code
    });
});

// Public-facing route: /store


app.get("/store", ensureLogin,async (req, res) => {
  // Declare an object to store properties for the view
  let viewData = {};

  try {
    // declare empty array to hold "Item" objects
    let items = [];

    // if there's a "category" query, filter the returned items by category
    if (req.query.category) {
      // Obtain the published "items" by category
      items = await storeServer.getPublishedItemsByCategory(req.query.category);
    } else {
      // Obtain the published "items"
      items = await storeServer.getPublishedItems();
        }

    // sort the published items by postDate
    items.sort((a, b) => new Date(b.postDate) - new Date(a.postDate));

    
    // store the "items" and "Item" data in the viewData object (to be passed to the view)
    viewData.items = items;
    // get the latest Item from the front of the list (element 0)
    let Item = items[0];

    viewData.Item = Item;
    
  } catch (err) {
    viewData.message = "No results";
  }

  try {
    // Obtain the full list of "categories"
    let categories = await storeServer.getCategories();
    // store the "categories" data in the viewData object (to be passed to the view)
    viewData.categories = categories;
  } catch (err) {
    viewData.categoriesMessage = "no results";  }

  // render the "store" view with all of the data (viewData)
  res.render("store", { data: viewData });
});

//store/:id Route
app.get('/store/:id', ensureLogin,async (req, res) => {

  // Declare an object to store properties for the view
  let viewData = {};

  try{

      // declare empty array to hold "Item" objects
      let items = [];

      // if there's a "category" query, filter the returned items by category
      if(req.query.category){
          // Obtain the published "items" by category
          items = await storeServer.getPublishedItemsByCategory(req.query.category);
      }else{
          // Obtain the published "items"
          items = await storeServer.getPublishedItems();
      }

      // sort the published items by postDate
      items.sort((a,b) => new Date(b.postDate) - new Date(a.postDate));

      // store the "items" and "Item" data in the viewData object (to be passed to the view)
      viewData.items = items;

  }catch(err){
      viewData.message = "no results";
  }

  try{
      // Obtain the Item by "id"
      viewData.Item= await storeServer.getItemById(req.params.id);
  }catch(err){
      viewData.message = "no results"; 
  }

  try{
      // Obtain the full list of "categories"
      let categories = await storeServer.getCategories();

      // store the "categories" data in the viewData object (to be passed to the view)
      viewData.categories = categories;
  }catch(err){
      viewData.categoriesMessage = "no results"
  }

  // render the "store" view with all of the data (viewData)
  res.render("store", {data: viewData})
});

// Route: /items
app.get('/items', ensureLogin,(req, res) => {
  const category = parseInt(req.query.category);
  const minDate = req.query.minDate;

  if (category) {
    storeServer.getItemsByCategory(category)
      .then((items) => {
        if (items.length > 0) {
          res.render("items", { items: items });
        } else {
          res.render("items", { message: "no results" });
        }
      })
      .catch((err) => {
        res.render("items", { message: err });
      });
  } else if (minDate) {
    storeServer.getItemsByMinDate(minDate)
      .then((items) => {
        if (items.length > 0) {
          res.render("items", { items: items });
        } else {
          res.render("items", { message: "no results" });
        }
      })
      .catch((err) => {
        res.render("items", { message: err });
      });
  } else {
    storeServer.getAllItems()
      .then((items) => {
        if (items.length > 0) {
          res.render("items", { items: items });
        } else {
          res.render("items", { message: "no results" });
        }
      })
      .catch((err) => {
        res.render("items", { message: err });
      });
  }
});


// Public-facing route: /getItemByID
app.get('/item/:id',ensureLogin,(req,res)=>{
  const itemId = parseInt(req.params.id);
storeServer.getItemById(itemId)
.then((item) => {
  res.json(item);
})
.catch((err) => {
  res.json({ message: err });
});
}
)

//Route:/addCategories
app.get('/categories/add', (req, res) => {
  res.render('addCategory'); // Render the addCategory view
});

// Route: /categories
app.get('/categories',ensureLogin,(req, res) => {
  storeServer.getCategories()
    .then((categories) => {
      if (categories.length > 0) {
        res.render("categories", { categories: categories });
      } else {
        res.render("categories", { message: "No results!" });
      }
    })
    .catch((err) => {
      res.render("categories", { message: err });
    });
});

//
app.get('/items/add', ensureLogin, (req, res) => {
  storeServer.getCategories()
    .then((categories) => {
      res.render('addItem', { categories: categories });
    })
    .catch((error) => {
      console.error('Error fetching categories:', error);
      res.render('addItem', { categories: [] });
    });
});
//get item from user
app.post('/items/add',ensureLogin, upload.single("featureImage"), (req, res) => {
  res.render('addItem');
  if (req.file) {
    let streamUpload = (req) => {
      return new Promise((resolve, reject) => {
        let stream = cloudinary.uploader.upload_stream(
          (error, result) => {
            if (result) {
              resolve(result);
            } else {
              reject(error);
            }
          }
        );

        streamifier.createReadStream(req.file.buffer).pipe(stream);
      });
    };

    async function upload(req) {
      let result = await streamUpload(req);
      console.log(result);
      return result;
    }

    upload(req)
      .then((uploaded) => {
        processItem(uploaded.url);
      })
      .catch((error) => {
        console.error('Error uploading file:', error);
        processItem("");
      });
  } else {
    processItem("");
  }

  function processItem(imageUrl) {
    req.body.featureImage = imageUrl;

    const itemData = {
      category: req.body.category,
      postDate: new Date().toISOString().split('T')[0],
      featureImage: imageUrl,
      title: req.body.title,
      price: req.body.price,
      body: req.body.body,
      published: (req.body.published) ? true : false
    };
    
    storeServer.addCategory(itemData)
      .then((addedCategory) => {
        console.log('Category added:', addedCategory);
        res.redirect('/categories');
      })
      .catch((error) => {
        console.error('Error adding category:', error);
        res.status(500).send('Unable to add category');
      });
      
  }
});

// Add route to delete a category by id
app.get('/categories/delete/:id',ensureLogin,(req, res) => {
  const categoryId = req.params.id;

  // Call the deleteCategoryById function from your store-service
  storeServer.deleteCategoryById(categoryId)
    .then(() => {
      res.redirect('/categories'); // Redirect to the categories view
    })
    .catch(() => {
      res.status(500).send('Unable to Remove Category / Category not found'); // Error occurred, return 500 status code
    });
});

// Add route to delete a Item by id
app.get('/items/delete/:id',ensureLogin, (req, res) => {
  const itemId = req.params.id;

  // Call the deleteItemById function 
  storeServer.deleteItemById(itemId)
    .then(() => {
      res.redirect('/items'); // Redirect to the items view
    })
    .catch(() => {
      res.status(500).send('Unable to Remove Item / Item not found'); // Error occurred, return 500 status code
    });
});



// Handle no matching route
app.use(function (req, res) {
  res.status(404).render('404');
});

// Call this function after http server starts







