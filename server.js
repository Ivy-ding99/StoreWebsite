/*********************************************************************************

WEB322 – Assignment 05
I declare that this assignment is my own work in accordance with Seneca  Academic Policy.  No part *  of this assignment has been copied manually or electronically from any other source (including 3rd party web sites) or distributed to other students.

Name: _Hui Ding
Student ID: 119835221
Date: 2023-07-21
Cyclic Web App URL: https://ruby-better-hummingbird.cyclic.app/About
GitHub Repository URL: https://github.com/Ivy-ding99/web322-app.git


********************************************************************************/ 

const path = require('path');
const express = require('express');
const app = express();
const blogServer = require('./blog-service');
const multer = require("multer");
const cloudinary = require('cloudinary').v2;
const streamifier = require('streamifier');
var HTTP_PORT = process.env.PORT || 8080;

const exphbs = require('express-handlebars');
const Handlebars = require('handlebars');
const upload = multer(); 

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



// Setup a route to redirect to the default about page
app.get('/', function (req, res) {
  res.redirect('/blog');});

// Setup the about route

app.get('/about', function (req, res) {
  res.render('about', {
    //layout: 'main',
    style: 'style-for-about',
    content: 'content-for-about'
  });
});

// Add route to process the submitted category data

app.post('/categories/add', (req, res) => {
  console.log(req.body); // Add this line to log the req.body object
  const categoryData = {
    category: req.body.category
  };

  blogServer.addCategory(categoryData)
    .then(() => {
      res.redirect('/categories'); // Redirect to the categories view
    })
    .catch(() => {
      res.status(500).send('Unable to add category'); // Error occurred, return 500 status code
    });
});

// Public-facing route: /blog


app.get("/blog", async (req, res) => {
  // Declare an object to store properties for the view
  let viewData = {};

  try {
    // declare empty array to hold "Item" objects
    let items = [];

    // if there's a "category" query, filter the returned items by category
    if (req.query.category) {
      // Obtain the published "items" by category
      items = await blogServer.getPublishedItemsByCategory(req.query.category);
    } else {
      // Obtain the published "items"
      items = await blogServer.getPublishedItems();
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
    let categories = await blogServer.getCategories();
    // store the "categories" data in the viewData object (to be passed to the view)
    viewData.categories = categories;
  } catch (err) {
    viewData.categoriesMessage = "no results";  }

  // render the "blog" view with all of the data (viewData)
  res.render("blog", { data: viewData });
});

//Shop/:id Route
app.get('/blog/:id', async (req, res) => {

  // Declare an object to store properties for the view
  let viewData = {};

  try{

      // declare empty array to hold "Item" objects
      let items = [];

      // if there's a "category" query, filter the returned items by category
      if(req.query.category){
          // Obtain the published "items" by category
          items = await blogServer.getPublishedItemsByCategory(req.query.category);
      }else{
          // Obtain the published "items"
          items = await blogServer.getPublishedItems();
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
      viewData.Item= await blogServer.getItemById(req.params.id);
  }catch(err){
      viewData.message = "no results"; 
  }

  try{
      // Obtain the full list of "categories"
      let categories = await blogServer.getCategories();

      // store the "categories" data in the viewData object (to be passed to the view)
      viewData.categories = categories;
  }catch(err){
      viewData.categoriesMessage = "no results"
  }

  // render the "blog" view with all of the data (viewData)
  res.render("blog", {data: viewData})
});

// Route: /items
app.get('/items', (req, res) => {
  const category = parseInt(req.query.category);
  const minDate = req.query.minDate;

  if (category) {
    blogServer.getItemsByCategory(category)
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
    blogServer.getItemsByMinDate(minDate)
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
    blogServer.getAllItems()
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
app.get('/Item/:id',(req,res)=>{
  const itemId = parseInt(req.params.id);
blogServer.getItemById(itemId)
.then((Item) => {
  res.json(Item);
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
app.get('/categories', (req, res) => {
  blogServer.getCategories()
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




app.post('/items/add', upload.single("featureImage"), (req, res) => {
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
      body: req.body.body,
      published: (req.body.published) ? true : false
    };
    
    blogServer.addCategory(itemData)
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

// GET route for adding an item
app.get('/items/add', (req, res) => {
  blogServer.getCategories()
    .then((categories) => {
      res.render('addItem', { categories: categories });
    })
    .catch(() => {
      res.render('addItem', { categories: [] });
    });
});






// Add route to delete a category by id
app.get('/categories/delete/:id', (req, res) => {
  const categoryId = req.params.id;

  // Call the deleteCategoryById function from your blog-service
  blogServer.deleteCategoryById(categoryId)
    .then(() => {
      res.redirect('/categories'); // Redirect to the categories view
    })
    .catch(() => {
      res.status(500).send('Unable to Remove Category / Category not found'); // Error occurred, return 500 status code
    });
});

// Add route to delete a Item by id
app.get('/items/delete/:id', (req, res) => {
  const itemId = req.params.id;

  // Call the deleteItemById function 
  blogServer.deleteItemById(itemId)
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
// Call the initialize() method from store-service.js to load data
// Call this function after http server starts
function onHttpStart() {
  console.log(`Express http server listening on ${HTTP_PORT}`);
}
blogServer.initialize()
  .then(() => {
    // Start the server only if initialization is successful
    app.listen(HTTP_PORT, onHttpStart);
  })
  .catch((err) => {
    // Output the error to the console if initialization fails
    console.error('Error initializing data:', err);
  });