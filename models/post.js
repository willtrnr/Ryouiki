var crypto = require('crypto'),
    path = require('path'),
    time = require('time'),
    gm = require('gm').subClass({ imageMagick: true }),
    fs = require('fs');

module.exports = function (mongo, db, config, Schema) {
  function convertDate (date) {
    return new time.Date(date).setTimezone('America/Montreal');
  }

  function hashPassword (password) {
    return this.model('post').hashPassword(password);
  }

  var Post = new Schema({
    board    : { type: String,ref: 'board', required: true, 'default': 'dn', index: true },
    op       : { type: Schema.Types.ObjectId, ref: 'post', index: true },
    name     : { type: String, required: true, 'default': 'Anonymous', trim: true },
    subject  : { type: String, trim: true },
    date     : { type: Date, required: true, 'default': Date.now, get: convertDate },
    bumped   : { type: Date, required: true, 'default': Date.now },
    comment  : { type: Buffer, trim: true },
    file: {
      name   : { type: String },
      orig   : { type: String },
      size   : { type: Number },
      type   : { type: String },
      width  : { type: Number },
      height : { type: Number }
    },
    password : { type: String, set: hashPassword }
  });

  Post.virtual('url').get(function () {
    return (config.prefix + '/' + ((post.op) ? this.op + '#' : '') + this._id);
  });

  Post.statics.hashPassword = function (password) {
    if (!password) return null;
    var shasum = crypto.createHash('sha512');
    shasum.update(config.salt + password + config.salt);
    return shasum.digest('hex');
  };

  Post.statics.findAll = function (board, callback) {
    this.find({ board: board }).exec(function (err, docs) {
      if (callback) callback(err, docs);
    });
  };

  Post.statics.countAll = function (board, callback) {
    this.count({ board: board }).exec(function (err, count) {
      if (callback) callback(err, count);
    });
  };

  Post.statics.findPaged = function (board, page, callback) {
    this.find({ board: board, op: null }).sort({ bumped: -1 }).limit(config.pagesize).skip((page - 1) * config.pagesize).exec(function (err, docs) {
      if (callback) callback(err, docs);
    });
  };

  Post.statics.countPages = function (board, callback) {
    this.count({ board: board, op: null }).exec(function (err, count) {
      if (callback) callback(err, Math.ceil((count || 0) / config.pagesize));
    });
  };

  Post.statics.findById = function (id, callback) {
    this.findOne({ _id: id }).exec(function (err, doc) {
      if (callback) callback(err, doc);
    });
  };

  Post.statics.findByOp = function (id, callback) {
    this.find({ op: id }).sort({ date: 1 }).exec(function (err, docs) {
      if (callback) callback(err, docs);
    });
  };

  Post.methods.attachFile = function (file, board, callback) {
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
           .write(path.join(config.datadir, config.prefix, 'thumbs', self.file.name), function (err) {
          if (!err) {
            var r = fs.createReadStream(file.path);
            r.pipe(fs.createWriteStream(path.join(config.datadir, config.prefix, 'uploads', self.file.name)));
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

  Post.methods.findReplies = function (count, callback) {
    var self = this;
    self.countReplies(function (err, c) {
      self.model('post').find({ op: self._id }).sort({ date: -1 }).limit(count).exec(function (err, docs) {
        if (!err && docs) self.replies = docs.reverse();
        if (callback) callback(err, self.replies, c);
      });
    });
  };

  Post.methods.countReplies = function (callback) {
    var self = this;
    self.model('post').count({ op: self._id }).exec(function (err, count) {
      if (!err && (count || count === 0)) self.replycount = count;
      if (callback) callback(err, count);
    });
  };

  return Post;
};
