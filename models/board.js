module.exports = function (mongo, db, config, Schema) {
  var Board = new Schema({
    _id  : { type: String, requried: true, index: { unique: true } },
    name : { type: String, requried: true },
    desc : { type: String, required: true }
  });

  Board.statics.findAll = function (callback) {
    this.find().exec(function (err, docs) {
      if (callback) callback(err, docs);
    });
  };

  Board.statics.countAll = function (callback) {
    this.count().exec(function (err, count) {
      if (callback) callback(err, count);
    });
  };

  Board.statics.findById = function (id, callback) {
    this.findOne({ _id: id }).exec(function (err, doc) {
      if (callback) callback(err, doc);
    });
  };

  return Board;
};
