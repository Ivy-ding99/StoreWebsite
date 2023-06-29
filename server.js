/*********************************************************************************

WEB322 – Assignment 04
I declare that this assignment is my own work in accordance with Seneca  Academic Policy.  No part *  of this assignment has been copied manually or electronically from any other source (including 3rd party web sites) or distributed to other students.

Name: _Hui Ding
Student ID: 119835221
Date: 2023-06-29
Cyclic Web App URL: https://github.com/Ivy-ding99/web322-app.git
GitHub Repository URL:https://github.com/Ivy-ding99/web322-app.git


********************************************************************************/ 

const path = require('path');
const express = require('express');
const app = express();
const storeServer = require('./store-service');
const multer = require("multer");
const cloudinary = require('cloudinary').v2;
const streamifier = require('streamifier');
var HTTP_PORT = process.env.PORT || 8080;
//const storeServer = require("./store-service");

const exphbs = require('express-handlebars');
const Handlebars = require('handlebars');


// Call this function after http server starts
function onHttpStart() {
  console.log(`Express http server listening on ${HTTP_PORT}`);
}
//app.engine('.hbs', exphbs.engine({ extname: '.hbs' }));
//for adding custom "helpers"
app.engine('.hbs', exphbs.engine({ 
  extname: '.hbs',
  helpers: { 
      navLink: function(url,options){
         return ('<li class="nav-item"><a '+(url==app.locals.activeRoute ? ' class="nav-link active" ' : ' class="nav-link" ')+ ' href="'+url+'">'+options.fn(this)+"</a></li>"); // helper without "context", ie {{#helper}} ... {{/helper}}
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

const upload = multer(); 

// "static" middleware
app.use(express.static('public'));
//Show the correct "active" item
app.use(function(req,res,next){
  let route = req.path.substring(1);
  app.locals.activeRoute = "/" + (isNaN(route.split('/')[1]) ? route.replace(/\/(?!.*)/, "") : route.replace(/\/(.*)/, ""));
  app.locals.viewingCategory = req.query.category;
  next();
});



// Setup a route to redirect to the default about page
app.get('/', function (req, res) {
  res.redirect('/shop');});

// Setup the about route

app.get('/about', function (req, res) {
  res.render('about', {
    //layout: 'main',
    style: 'style-for-about',
    content: 'content-for-about'
  });
});


// Setup the about route
app.get('/items/add', function (req, res) {
  res.render('addItem', {
    //layout: 'main',
    style: 'style-for-addItem',
    content: 'content-for-addItem'
  });
});

// Public-facing route: /shop


app.get("/shop", async (req, res) => {
  // Declare an object to store properties for the view
  let viewData = {};

  try {
    // declare empty array to hold "post" objects
    let items = [];

    // if there's a "category" query, filter the returned posts by category
    if (req.query.category) {
      // Obtain the published "posts" by category
      items = await storeServer.getPublishedItemsByCategory(req.query.category);
    } else {
      // Obtain the published "items"
      items = await storeServer.getPublishedItems();
    }

    // sort the published items by postDate
    items.sort((a, b) => new Date(b.postDate) - new Date(a.postDate));

    
    // store the "items" and "post" data in the viewData object (to be passed to the view)
    viewData.items = items;
    // get the latest post from the front of the list (element 0)
    let post = items[0];

    viewData.item = post;
    
  } catch (err) {
    viewData.message = "no results";
  }

  try {
    // Obtain the full list of "categories"
    let categories = await storeServer.getCategories();

    // store the "categories" data in the viewData object (to be passed to the view)
    viewData.categories = categories;
  } catch (err) {
    viewData.categoriesMessage = "no results";
  }

  // render the "shop" view with all of the data (viewData)
  res.render("shop", { data: viewData });
});

//Shop/:id Route
app.get('/shop/:id', async (req, res) => {

  // Declare an object to store properties for the view
  let viewData = {};

  try{

      // declare empty array to hold "item" objects
      let items = [];

      // if there's a "category" query, filter the returned posts by category
      if(req.query.category){
          // Obtain the published "posts" by category
          items = await storeServer.getPublishedItemsByCategory(req.query.category);
      }else{
          // Obtain the published "posts"
          items = await storeServer.getPublishedItems();
      }

      // sort the published items by postDate
      items.sort((a,b) => new Date(b.postDate) - new Date(a.postDate));

      // store the "items" and "item" data in the viewData object (to be passed to the view)
      viewData.items = items;

  }catch(err){
      viewData.message = "no results";
  }

  try{
      // Obtain the item by "id"
      viewData.item= await storeServer.getItemById(req.params.id);
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

  // render the "shop" view with all of the data (viewData)
  res.render("shop", {data: viewData})
});

// Route: /items
app.get('/items', (req, res) => {
  const category = parseInt(req.query.category);
  const minDate = req.query.minDate;

  if (category) {
    storeServer.getItemsByCategory(category)
      .then((items) => {
        if (items.length > 0) {
          res.render("items", { items: items });
        } else {
          res.render("posts", { message: "no results" });
        }
      })
      .catch((err) => {
        res.render("posts", { message: err });
      });
  } else if (minDate) {
    storeServer.getItemsByMinDate(minDate)
      .then((items) => {
        if (items.length > 0) {
          res.render("items", { items: items });
        } else {
          res.render("posts", { message: "no results" });
        }
      })
      .catch((err) => {
        res.render("posts", { message: err });
      });
  } else {
    storeServer.getAllItems()
      .then((items) => {
        if (items.length > 0) {
          res.render("items", { items: items });
        } else {
          res.render("posts", { message: "no results" });
        }
      })
      .catch((err) => {
        res.render("posts", { message: err });
      });
  }
});


// Public-facing route: /getItemByID
app.get('/item/:id',(req,res)=>{
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

// Route: /categories
app.get('/categories',  (req, res)=> {
  storeServer.getCategories()
    .then((categories) => {
      if(categories.length>0)
      {res.render("categories",{categories:categories});}
      else
      {res.render("categories",{message:"No result!"})}
    })
    .catch((err) => {
      res.render({ message: err });
    });
});

app.post('/items/add',upload.single("featureImage"),(req,res)=>{

  if(req.file){
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

    upload(req).then((uploaded)=>{
        processItem(uploaded.url);
    });
}else{
    processItem("");
}
 
function processItem(imageUrl){
  req.body.featureImage = imageUrl;
  
  // TODO: Process the req.body and add it as a new Item before redirecting to /items

    const itemData = {
     id:0,
      category: req.body.category,
      postDate: new Date().toISOString().split('T')[0],
      featureImage: imageUrl,
      price: req.body.price,
      title: req.body.title,
      body: req.body.body,
      published: req.body.published === 'on' ? true : false
    };
    
storeServer.addItem(itemData)
.then((addedItem) => {
  // Handle the successful addition of the item
  console.log('Item added:', addedItem);
  res.redirect('/items');
})
.catch((error) => {
  // Handle any errors that occurred during item addition
  console.error('Error adding item:', error);
  res.redirect('/items');
});
}
}
);


// Handle no matching route
app.use(function (req, res) {
  res.status(404).render('404');
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
