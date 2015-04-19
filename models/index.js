var mongoose = require('mongoose'),
    Schema   = mongoose.Schema;

module.exports = function (config) {
  var mongo = mongoose.createConnection(config.mongodb.url);

  var db = {};
  db.Board = require('./board')(mongo, db, config, Schema);
  db.User = require('./user')(mongo, db, config, Schema);
  db.Post = require('./post')(mongo, db, config, Schema);

  var models = {};
  for (var key in db) {
    models[key.toLowerCase()] = mongo.model(key.toLowerCase(), db[key]);
  }
  return models;
};
