var express = require('express');

var path = require('path');
var bodyParser = require('body-parser');
var session = require('express-session');
var mustacheExpress = require('mustache-express')
var mongoose = require('mongoose');

mongoose.connect('mongodb://avenka6794:as70rv65@ds147461.mlab.com:47461/typer', { useNewUrlParser: true });

var routes = require('./routes/routes.js')(mongoose)

var app = express();

app.use(session({
  secret: 'keyboard cat',
  resave: false,
  saveUninitialized: true
}))


app.use(bodyParser.urlencoded({ extended: false }))

app.use(bodyParser.json())

app.engine('mustache', mustacheExpress());

app.set('view engine', 'mustache');

app.set('views', path.join(__dirname, 'client'));

app.use(routes);

var port = process.env.PORT || 3000;

app.listen(port, () => console.log(`App listening on port ${port}`))
