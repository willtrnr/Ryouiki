var async = require('async');

module.exports = function (app, db, config, passport) {
  var prefix = config.prefix || '';

  //require('./acl')(app, db, config, passport);

  //require('./auth')(app, db, config, passport);

  app.all(prefix + '/:board/*', function (req, res, next) {
    req.params.board = req.params.board || config.mainboard;
    db.board.findById(req.params.board, function (err, board) {
      if (!err && board) {
        res.locals.board = board;
        next();
      } else {
        res.redirect(prefix + '/' + config.mainboard + '/');
      }
    });
  });

  app.post(prefix + '/:board/:id', function (req, res) {
    db.post.findById(req.params.id, function (err, post) {
      if (!err && post) {
        if (req.body.comment || (req.files.file && req.files.file.name && req.files.file.type.match(/^image\//i))) {
          var r = new db.post(req.body);
          r.board = post.board;
          r.op = post._id;
          r.save(function (err, reply) {
            if (!err && r) {
              if (!(r.name.toLowerCase() == 'sage' || r.comment.toString().toLowerCase() == 'sage')) post.bumped = Date.now();
              post.save(function (err, p) {
                if (!err && p) {
                  if (req.files.file && req.files.file.name) {
                    reply.attachFile(req.files.file, function (err, r) {
                      if (!err) {
                        req.flash('success', 'Reply posted.');
                        res.redirect(prefix + '/' + res.locals.board._id + '/' + p._id + '#' + r._id);
                      } else {
                        req.flash('error', err);
                        r.remove(function (err) {
                          if (err) req.flash('error', err);
                          res.redirect(prefix + '/' + res.locals.board._id + '/' + p._id);
                        });
                      }
                    });
                  } else {
                    req.flash('success', 'Reply posted.');
                    res.redirect(prefix + '/' + res.locals.board._id + '/' + p._id + '#' + r._id);
                  }
                } else {
                  req.flash('error', err);
                  res.redirect(prefix + '/' + res.locals.board._id + '/' + post._id);
                }
              });
            } else {
              req.flash('error', err);
              res.redirect(prefix + '/' + res.locals.board._id + '/' + post._id);
            }
          });
        } else {
          req.flash('error', 'Image or comment is required.');
          res.redirect(prefix + '/' + res.locals.board._id + '/' + post._id);
        }
      } else res.redirect(prefix + '/' + res.locals.board._id + '/');
    });
  });

  app.get(prefix + '/:board/:id', function (req, res) {
    db.post.findById(req.params.id, function (err, post) {
      if (!err && post) {
        db.post.findByOp(post._id, function (err, replies) {
          if (post.subject) res.render('thread', { post: post, replies: replies || [], pagetitle: post.subject });
          else res.render('thread', {
            post: post,
            replies: replies || []
          });
        });
      } else res.redirect(prefix + '/' + res.locals.board._id + '/');
    });
  });

  app.post(prefix + '/:board/', function (req, res) {
    if (req.body.comment || (req.files.file && req.files.file.name && req.files.file.type.match(/^image\//i))) {
      var p = new db.post(req.body);
      p.board = res.locals.board._id;
      p.save(function (err, post) {
        if (!err && post) {
          if (req.files.file && req.files.file.name) {
            post.attachFile(req.files.file, function (err, p) {
              if (!err) {
                req.flash('success', 'Thread posted.');
                res.redirect(prefix + '/' + res.locals.board._id + '/' + post._id);
              } else {
                req.flash('error', err);
                post.remove(function (err) {
                  if (err) req.flash('error', err);
                  res.redirect(prefix + '/' + res.locals.board._id + '/');
                });
              }
            });
          } else {
            req.flash('success', 'Thread posted.');
            res.redirect(prefix + '/' + res.locals.board._id + '/' + post._id);
          }
        } else {
          req.flash('error', err);
          res.redirect(prefix + '/' + res.locals.board._id + '/');
        }
      });
    } else {
      req.flash('error', 'Image or comment is required.');
      res.redirect(prefix + '/' + res.locals.board._id + '/');
    }
  });

  app.get(prefix + '/:board/', function (req, res) {
    res.locals.page = Number(req.query.p) || 1;
    db.post.countPages(res.locals.board._id, function (err, pages) {
      db.post.findPaged(res.locals.board._id, res.locals.page, function (err, posts) {
        async.each(posts, function (post, callback) {
          post.findReplies(config.replies, callback);
        }, function (err) {
          res.render('index', {
            pages: pages,
            posts: posts
          });
        });
      });
    });
  });

  app.all(prefix + '/', function (req, res) {
    res.redirect(prefix + '/' + config.mainboard + '/');
  });
};

