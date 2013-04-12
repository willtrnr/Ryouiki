var crypto = require('crypto');

module.exports = function (mongo, db, config, Schema) {
  function hashPassword (password) {
    return this.model('user').hashPassword(password);
  }

  var User = new Schema({
    username : { type: String, index: { unique: true } },
    password : { type: String, requried: true, set: hashPassword },
    email    : { type: String, index: { unique: true } }
  });

  User.statics.hashPassword = function (password) {
    var shasum = crypto.createHash('sha512');
    shasum.update(config.salt + password + config.salt);
    return shasum.digest('hex');
  };

  User.statics.findByUsername = function (username, callback) {
    this.findOne({ username: username }).exec(function(err, doc) {
      if (callback) callback(err, doc);
    });
  };

  User.statics.findByEmail = function (email, callback) {
    this.findOne({ email: email }).exec(function(err, doc) {
      if (callback) callback(err, doc);
    });
  };

  return User;
};
