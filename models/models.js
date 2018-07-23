module.exports = function(mongoose) {
    var User = new mongoose.Schema({
        email: String,
        username: String,
        password: String,
        score: Number
    });
    // declare seat covers here too
    var models = {
      User : mongoose.model('User', User)
    };
    return models;
}
