var LocalStrategy = require('passport-local').Strategy;

module.exports = function (passport, db, config) {
  passport.use(new LocalStrategy(function (username, password, done) {
    password = db.user.hashPassword(password);
    db.user.findByUsername(username, function (err, user) {
      if (!err && user && user.password === password) done(err, user);
      else done(err, null, { message: 'Wrong username and/or password' });
    });
  }));
};
