var express = require('express');
var routes = require('./routes/routes.js')

var app = express();

app.use(routes);

var port = process.env.PORT || 3000;

app.listen(port, () => console.log(`App listening on port ${port}`))
