var crypto = require('crypto');

module.exports = function (mongo, db, config, Schema) {
  var Post = new Schema({
    name     : { type: String, required: true, 'default': 'Anonymous' },
    email    : { type: String },
    subject  : { type: String },
    date     : { type: Date, required: true, 'default': Date.now },
    bumped   : { type: Date, required: true, 'default': Date.now },
    comment  : { type: Buffer, required: true },
    file: {
      name   : { type: String },
      orig   : { type: String },
      size   : { type: Number },
      type   : { type: String },
      width  : { type: Number },
      height : { type: Number }
    },
    password : { type: String },
    op       : { type: Schema.Types.ObjectId, ref: 'post' }
  });

  Post.statics.findAll = function (callback) {
    this.find().exec(function (err, docs) {
      if (callback) callback(err, docs);
    });
  };

  Post.statics.findPaged = function (page, callback) {
    this.find({ op: null }).sort({ bumped: -1 }).limit(10).skip((page - 1) * 10).exec(function (err, docs) {
      if (callback) callback(err, docs);
    });
  };

  return Post;
};
