var mongoose = require('mongoose');

mongoose.connect('mongodb://avenka6794:as70rv65@ds147461.mlab.com:47461/typer', { useNewUrlParser: true });

var models = require('./models/models.js')(mongoose)

models.User.findOne({username: "avenka6794"}).then((usr)=>{
    console.log(usr)
})
