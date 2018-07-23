var express = require('express');
var router = express.Router();
var path = require('path');

router.get('/login', (req, res) => {
        res.sendFile('login.html', {root: path.resolve(__dirname, '../client')})
});

router.get('/signup', (req, res) => {
    res.sendFile('signup.html', {root: path.resolve(__dirname, '../client')})
});

module.exports = router;
