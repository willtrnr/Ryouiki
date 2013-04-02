var imagick = require('imagemagick'),
    path = require('path'),
    fs = require('fs');

module.exports = function (app, db, config, passport) {
  var prefix = config.prefix || '';

  //require('./acl')(app, db, config, passport);

  require('./auth')(app, db, config, passport);

  app.post(prefix + '/:id', function (req, res) {
    // TODO: Handle reply
    res.redirect(prefix + '/' + req.params.id);
  });

  app.get(prefix + '/:id', function (req, res) {
    // TODO: Load thread
    res.redirect(prefix + '/');
  });

  app.post(prefix + '/', function (req, res) {
    var p = new db.post(req.body);
    p.save(function (err, post) {
      if (!err && post) {
        if (req.files.file && req.files.file.type.match(/^image\//i)) {
          post.file.orig = req.files.file.name;
          post.file.size = req.files.file.size;

          imagick.identify(req.files.file.path, function (err, info) {
            if (!err) {
              if (info.format == 'PNG') post.file.type = 'png';
              else if (info.format == 'GIF') post.file.type = 'gif';
              else post.file.type = 'jpg';
              post.file.name = post._id.toString() + '.' + post.file.type;

              imagick.resize({
                srcPath: req.files.file.path,
                dstPath: path.join(config.datadir, 'thumbs', post.file.name),
                width: (info.width >= info.height) ? 250 : 0,
                height: (info.width <= info.height) ? 250 : 0,
                format: post.file.type
              }, function (err, sout, serr) {
                if (!err) {
                  var r = fs.createReadStream(req.files.file.path);
                  r.pipe(fs.createWriteStream(path.join(config.datadir, 'uploads', post.file.name)));
                  r.on('end', function () {
                    fs.unlinkSync(req.files.file.path);
                    post.save(function (err, p) {
                      if (!err && post) res.redirect(prefix + '/' + p._id);
                      else res.redirect(prefix + '/' + post._id);
                    });
                  });
                } else res.redirect(prefix + '/' + post._id);
              });
            } else res.redirect(prefix + '/' + post._id);
          });
        } else res.redirect(prefix + '/' + post._id);
      } else res.redirect(prefix + '/');
    });
  });

  app.get(prefix + '/', function (req, res) {
    // TODO: Load threads
    res.render('index');
  });
};

