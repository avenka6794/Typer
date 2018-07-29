module.exports = function(mongoose) {
    var userSchema = new mongoose.Schema({
        email: String,
        username: String,
        password: String,
        score: Number
    },
    { collection: 'User' });

    var User = mongoose.model('User', userSchema);

    var models = {
      User : User
    };
    return models;
}
