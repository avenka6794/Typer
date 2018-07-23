var express = require('express');
var router = express.Router();
var path = require('path');
const { check, validationResult } = require('express-validator/check');

module.exports = function (mongoose){
  var models = require('../models/models.js')(mongoose)


  router.get('/', (req, res) => {

    if(!req.session.user){
      req.session.user = "anonymous";
    }
    res.render('index', {user: req.session.user})



  })

  router.get('/login', (req, res) => {
          res.render('login');
  });


  router.post('/register', [
    check('email').isEmail().custom((val) => {
      return models.User.findOne({email: val}).then((usr) => {
        if (usr) {
          return Promise.reject('E-mail already in use');
     }
      });
    }),
    check('password').isLength({ min: 5 })
  ], (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      var err = errors.array();
      err = err.map((e) => {
        return e.param + " - " + e.msg;
      })
      return res.render('login', {error: err.join(", ")});
    }
    var user = new models.User({
      email: req.body.email,
      username: req.body.username,
      password: req.body.password,
      score: 0
    });
    user.save(function (err, user) {
      if (err) return console.error(err);
      req.session.user = req.body.username;
      res.redirect("/")
    });
  });

  router.post('/login', [
    check('username').custom((val,  { req }) => {
      return models.User.findOne({username: val, password: req.body.password}).then((usr) => {
        if (!usr) {
          return Promise.reject('Invalid Credentials');
     }
      });
    })
  ], (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      var err = errors.array();
      err = err.map((e) => {
        return e.msg;
      })
      return res.render('login', {error: err.join(", ")});
    }
  req.session.user = req.body.username;
  res.redirect("/")
  });



  return router;

}
