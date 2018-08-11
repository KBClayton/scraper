var db = require("../models");
const password = require("s-salt-pepper");
var check = require("./check");

module.exports = function(app) {
  // -- Post New User
  app.post("/api/users/new", function(req, res) {
    if (check.notin(req, res)) {
      return;
    }
    // Take Input from Client
    //console.log("in post route with uid "+req.session.uid)
    if (req.session.uid !== undefined) {
      console.log("do not make a new user while logged in");
      //send to home page
      return res.json({ url: "/" });
    } else {
      var newUser = req.body;
      //console.log(newUser.password);
      var namesearch = newUser.username;
      var emailsearch = newUser.email;
      //search to see if username is already taken
      db.user
        .findOne({
          where: {
            $or: [
              { username: { $eq: namesearch } },
              { email: { $eq: emailsearch } }
            ]
          }
        })
        .then(function(dbExample) {
          //console.log(dbExample);
          if (dbExample === null) {
            const user = {
              password: {
                hash: null,
                salt: null
              }
            };
            async function hashing() {
              //create hash and salt
              user.password = await password.hash(newUser.password);
              //console.log(user);
              newUser.password = user.password.hash;
              newUser.salt = user.password.salt;
              //console.log(newUser);
              db.user.create(newUser).then(function(dbExample) {
                //console.log(dbExample.dataValues.id);
                req.session.uid = dbExample.dataValues.id;
                req.session.firstName = dbExample.dataValues.firstName;
                req.session.lastName = dbExample.dataValues.lastName;
                req.session.email = dbExample.dataValues.email;
                req.session.location = dbExample.dataValues.location;
                //send to home page
                return res.json({ url: "/" });
                //return res.redirect("/");
              });
            }
            hashing();
          } else {
            console.log("That username or email is taken");
            //send to login page
            //return res.redirect('/login')
            return res.json({ error: "That username or email is taken" });
          }
        });
    }
  });

  app.put("/api/users/change", function(req, res) {
    console.log("in users/change route");
    console.log(req.body);
    updateUser = req.body;
    if (check.login(req, res)) {
      return;
    }
    emailsearch = req.body.email;
    db.user
      .findOne({
        where: {
          email: { $eq: emailsearch },
          $and: { id: { $ne: req.session.uid } }
        }
      })
      .then(function(dbExample) {
        if (dbExample === null) {
          if (
            updateUser.firstName === "" ||
            updateUser.firstName === undefined
          ) {
            updateUser.firstName = req.session.firstName;
          }
          if (updateUser.lastName === "" || updateUser.lastName === undefined) {
            updateUser.lastName = req.session.lastName;
          }
          if (updateUser.email === "" || updateUser.email === undefined) {
            updateUser.email = req.session.email;
          }
          if (updateUser.location === "" || updateUser.location === undefined) {
            updateUser.location = req.session.location;
          }
          db.user
            .update(
              {
                firstName: updateUser.firstName,
                lastName: updateUser.lastName,
                email: updateUser.email,
                location: updateUser.location
              },
              { where: { id: req.session.uid } }
            )
            .then(function(dbExample) {
              req.session.firstName = updateUser.firstName;
              req.session.lastName = updateUser.lastName;
              req.session.email = updateUser.email;
              req.session.location = updateUser.location;
              return res.json({ url: "/" });
            });
        } else {
          console.log("That email is associated with another account");
          return res.json({
            error: "That email is associated with another account"
          });
        }
      });
  });
};

// -- WHAT THE DATA LOOKS LIKE

// {username: newUser.username,
//   password: newUser.password,
//   salt: newUser.salt,
//   firstName: newUser.firstName,
//   lastName: newUser.lastName,
//   email: newUser.email,
//   location: newUser.location}
