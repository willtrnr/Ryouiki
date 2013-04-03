var crypto = require('crypto'),
    path = require('path'),
    gm = require('gm').subClass({ imageMagick: true }),
    fs = require('fs');

module.exports = function (mongo, db, config, Schema) {
  var Post = new Schema({
    name     : { type: String, required: true, 'default': 'Anonymous' },
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
    op       : { type: Schema.Types.ObjectId, ref: 'post' }
  });

  Post.statics.findAll = function (callback) {
    this.find().exec(function (err, docs) {
      if (callback) callback(err, docs);
    });
  };

  Post.statics.findPaged = function (page, callback) {
    this.find({ op: null }).sort({ bumped: -1 }).limit(20).skip((page - 1) * 20).exec(function (err, docs) {
      if (callback) callback(err, docs);
    });
  };

  Post.statics.findById = function (id, callback) {
    this.findOne({ _id: id }).exec(function (err, doc) {
      if (callback) callback(err, doc);
    });
  };

  Post.statics.findByOp = function (id, callback) {
    this.find({ op: id }).exec(function (err, docs) {
      if (callback) callback(err, docs);
    });
  };

  Post.methods.attachFile = function (file, callback) {
    var self = this;
    var img = gm(file.path + ((file.type == 'image/gif') ? '[0]' : ''));
    img.identify(function (err, info) {
      if (!err && info) {
        self.file.orig = file.name;
        self.file.size = file.size;
        self.file.type = info.format.toLowerCase();
        if (self.file.type == 'jpeg') self.file.type = 'jpg';
        self.file.width = info.size.width;
        self.file.height = info.size.height;
        self.file.name = self._id + '.' + self.file.type;

        img.resize((info.size.width >= info.size.height) ? config.thumbsize : 0, (info.size.width <= info.size.height) ? config.thumbsize : 0)
           .write(path.join(config.datadir, 'thumbs', self.file.name), function (err) {
          if (!err) {
            var r = fs.createReadStream(file.path);
            r.pipe(fs.createWriteStream(path.join(config.datadir, 'uploads', self.file.name)));
            r.on('error', function (err) {
              if (callback) callback(err, self);
            });
            r.on('end', function () {
              fs.unlinkSync(file.path);
              self.save(function (err, p) {
                if (callback) callback(err, p);
              });
            });
          } else if (callback) callback(err, self);
        });
      } else if (callback) callback(err, self);
    });
  };

  return Post;
};
