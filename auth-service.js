const mongoose = require("mongoose");
const Schema = mongoose.Schema;
const bcrypt = require('bcryptjs');
var userSchema=new Schema({
    "userName":String,
    "password":String,
    "email":String,
    "loginHistory":[{"dateTime":Date,"userAgent":String}]

});

let User;// = mongoose.model("web322_app", userSchema);
module.exports.initialize = function() {
    return new Promise(function(resolve, reject) {
        const db = mongoose.createConnection("mongodb+srv://huiding:6CNbHj6GuHiCUNUx@senecaweb.mdn3uv8.mongodb.net/AS6");

        db.on('error', (err) => {
            reject(err);
        });

        db.once('open', () => {
            User = db.model("users", userSchema);
            resolve();
        });
    });
};


// Register a new user
module.exports.registerUser = function registerUser(userData) {
    return new Promise((resolve, reject) => {
        // Check if passwords match
        if (userData.password !== userData.password2) {
            reject("Passwords do not match");
            return;
        }
        
        // Hash the password
        bcrypt.hash(userData.password, 10) // Hash the password using a Salt that was generated using 10 rounds
            .then(hash => {
                // Update the password in userData with the hashed version
                userData.password = hash;
                
                // Create a new User instance
                let newUser = new User(userData);

                // Save the user to the database
                newUser.save()
                    .then(() => {
                        resolve();
                    })
                    .catch(err => {
                        if (err.code === 11000) {
                            reject("User Name already taken");
                        } else {
                            reject(`There was an error creating the user: ${err}`);
                        }
                    });
            })
            .catch(err => {
                reject("There was an error encrypting the password");
            });
    });
};

// Check user credentials
module.exports.checkUser = function checkUser(userData) {
    return new Promise((resolve, reject) => {
        User.find({ userName: userData.userName })
            .then(users => {
                if (users.length === 0) {
                    reject(`Unable to find user: ${userData.userName}`);
                    return;
                }
                
                const user = users[0];

                bcrypt.compare(userData.password, user.password)
                    .then(result => {
                        if (result) {
                            // Passwords match, update login history and resolve
                            user.loginHistory.push({
                                dateTime: new Date().toString(),
                                userAgent: userData.userAgent
                            });

                            User.updateOne({ userName: user.userName }, { $set: { loginHistory: user.loginHistory } })
                                .then(() => {
                                    resolve(user);
                                })
                                .catch(err => {
                                    reject(`There was an error verifying the user: ${err}`);
                                });
                        } else {
                            reject(`Incorrect Password for user: ${userData.userName}`);
                        }
                    })
                    .catch(err => {
                        reject(`There was an error verifying the user: ${err}`);
                    });
            })
            .catch(err => {
                reject(`Unable to find user: ${userData.userName}`);
            });
    });
};









