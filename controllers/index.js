module.exports = function (app, db, config, passport) {
  var prefix = config.prefix || '';

  //require('./acl')(app, db, config, passport);

  //require('./auth')(app, db, config, passport);

  app.get(prefix + '/page/:page', function (req, res) {
    req.params.page = Number(req.params.page) || 1;
    db.post.findPaged(req.params.page, function (err, posts) {
      res.render('index', { page: req.params.page, posts: posts, pagetitle: 'Page ' + req.params.page });
    });
  });

  app.post(prefix + '/:id', function (req, res) {
    db.post.findById(req.params.id, function (err, post) {
      if (!err && post) {
        var r = new db.post(req.body);
        r.op = post._id;
        r.save(function (err, reply) {
          if (!err && r) {
            post.bumped = Date.now();
            post.save(function (err, p) {
              if (!err && p) {
                if (req.files.file && req.files.file.type.match(/^image\//i)) {
                  reply.attachFile(req.files.file, function (err, r) {
                    if (!err) res.redirect(prefix + '/' + p._id + '#' + r._id);
                    else res.redirect(prefix + '/' + p._id + '#' + r._id);
                  });
                } else res.redirect(prefix + '/' + p._id + '#' + r._id);
              } else res.redirect(prefix + '/' + post._id + '#' + r._id);
            });
          } else res.redirect(prefix + '/' + post._id);
        });
      } else res.redirect(prefix + '/');
    });
  });

  app.get(prefix + '/:id', function (req, res) {
    db.post.findById(req.params.id, function (err, post) {
      if (!err && post) {
        db.post.findByOp(post._id, function (err, replies) {
          if (post.subject) res.render('thread', { post: post, replies: replies || [], pagetitle: post.subject });
          else res.render('thread', { post: post, replies: replies || [] });
        });
      } else res.redirect(prefix + '/');
    });
  });

  app.post(prefix + '/', function (req, res) {
    if (req.files.file && req.files.file.type.match(/^image\//i)) {
      var p = new db.post(req.body);
      p.save(function (err, post) {
        if (!err && post) {
            post.attachFile(req.files.file, function (err, p) {
              if (!err) res.redirect(prefix + '/' + post._id);
              else res.redirect(prefix + '/' + post._id);
            });
        } else res.redirect(prefix + '/');
      });
    } else res.redirect(prefix + '/');
  });

  app.get(prefix + '/', function (req, res) {
    db.post.findPaged(1, function (err, posts) {
      res.render('index', { page: 1, posts: posts });
    });
  });
};

