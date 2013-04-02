var crypto = require('crypto');

module.exports = function (mongo, db, config, Schema) {
  var Post = new Schema({
    name     : { type: String, required: true, 'default': 'Anonymous' },
    email    : { type: String },
    subject  : { type: String },
    date     : { type: Date, required: true, 'default': Date.now },
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
    parent   : { type: Schema.Types.ObjectId, ref: 'post' }
  });

  Post.statics.findAll = function (callback) {
    this.find().exec(function (err, docs) {
      if (callback) callback(err, docs);
    });
  };

  Post.statics.findNew = function (page, callback) {
    this.find().distinct('parent').exec(function (err, bumps) {
      console.log(bumps);
    });
  };

  return Post;
};
