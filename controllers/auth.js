module.exports = function (app, db, config, passport) {
  var prefix = config.prefix || '';

  app.get(prefix + '/auth/login', function(req, res) {
    res.render('login', { error: req.flash('error') });
  });

  app.get(prefix + '/auth/logout', function(req, res) {
    req.logout();
    res.redirect(prefix + '/auth/login');
  });

  app.post(prefix + '/auth/local', passport.authenticate('local', {
    successRedirect: prefix + '/',
    failureRedirect: prefix + '/auth/login',
    failureFlash: true
  }));
};
