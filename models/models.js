module.exports = function(mongoose) {
    var User = new Schema({
        username: String,
        password: String,
        id: String,
        score: Number
    });
    // declare seat covers here too
    var models = {
      User : mongoose.model('User', User)
    };
    return models;
}
