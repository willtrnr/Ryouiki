module.exports = function (passport, db, config) {
  require('./local')(passport, db, config);

  passport.serializeUser(function (user, done) {
    done(null, user._id);
  });

  passport.deserializeUser(function (id, done) {
    db.user.findById(id, function (err, user) {
      done(err, user);
    });
  });
};
