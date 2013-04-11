var async = require('async');

module.exports = function (app, db, config, passport) {
  var prefix = config.prefix || '';

  //require('./acl')(app, db, config, passport);

  //require('./auth')(app, db, config, passport);

  app.get(prefix + '/page/:page', function (req, res) {
    req.params.page = Number(req.params.page) || 1;
    db.post.countPages(function (err, pages) {
      db.post.findPaged(req.params.page, function (err, posts) {
        async.each(posts, function (post, callback) {
          post.findReplies(config.replies, callback);
        }, function (err) {
          res.render('index', {
            page: req.params.page,
            pages: pages,
            posts: posts,
            pagetitle: 'Page ' + req.params.page
          });
        });
      });
    });
  });

  app.post(prefix + '/:id', function (req, res) {
    db.post.findById(req.params.id, function (err, post) {
      if (!err && post) {
        if (req.body.comment || (req.files.file && req.files.file.name && req.files.file.type.match(/^image\//i))) {
          var r = new db.post(req.body);
          r.op = post._id;
          r.save(function (err, reply) {
            if (!err && r) {
              if (!(r.name.toLowerCase() == 'sage' || r.comment.toString().toLowerCase() == 'sage'))
                post.bumped = Date.now();
              post.save(function (err, p) {
                if (!err && p) {
                  if (req.files.file && req.files.file.name) {
                    reply.attachFile(req.files.file, function (err, r) {
                      if (!err) {
                        req.flash('success', 'Reply posted.');
                        res.redirect(prefix + '/' + p._id + '#' + r._id);
                      } else {
                        req.flash('error', err);
                        r.remove(function (err) {
                          if (err) req.flash('error', err);
                          res.redirect(prefix + '/' + p._id);
                        });
                      }
                    });
                  } else {
                    req.flash('success', 'Reply posted.');
                    res.redirect(prefix + '/' + p._id + '#' + r._id);
                  }
                } else {
                  req.flash('error', err);
                  res.redirect(prefix + '/' + post._id);
                }
              });
            } else {
              req.flash('error', err);
              res.redirect(prefix + '/' + post._id);
            }
          });
        } else {
          req.flash('error', 'Image or comment is required.');
          res.redirect(prefix + '/' + post._id);
        }
      } else res.redirect(prefix + '/');
    });
  });

  app.get(prefix + '/:id', function (req, res) {
    db.post.findById(req.params.id, function (err, post) {
      if (!err && post) {
        db.post.findByOp(post._id, function (err, replies) {
          if (post.subject) res.render('thread', { post: post, replies: replies || [], pagetitle: post.subject });
          else res.render('thread', {
            post: post,
            replies: replies || []
          });
        });
      } else res.redirect(prefix + '/');
    });
  });

  app.post(prefix + '/', function (req, res) {
    if (req.body.comment || (req.files.file && req.files.file.name && req.files.file.type.match(/^image\//i))) {
      var p = new db.post(req.body);
      p.save(function (err, post) {
        if (!err && post) {
          if (req.files.file && req.files.file.name) {
            post.attachFile(req.files.file, function (err, p) {
              if (!err) {
                req.flash('success', 'Thread posted.');
                res.redirect(prefix + '/' + post._id);
              } else {
                req.flash('error', err);
                post.remove(function (err) {
                  if (err) req.flash('error', err);
                  res.redirect(prefix + '/');
                });
              }
            });
          } else {
            req.flash('success', 'Thread posted.');
            res.redirect(prefix + '/' + post._id);
          }
        } else {
          req.flash('error', err);
          res.redirect(prefix + '/');
        }
      });
    } else {
      req.flash('error', 'Image or comment is required.');
      res.redirect(prefix + '/');
    }
  });

  app.get(prefix + '/', function (req, res) {
    db.post.countPages(function (err, pages) {
      db.post.findPaged(1, function (err, posts) {
        async.each(posts, function (post, callback) {
          post.findReplies(config.replies, callback);
        }, function (err) {
          res.render('index', {
            page: 1,
            pages: pages,
            posts: posts
          });
        });
      });
    });
  });
};

