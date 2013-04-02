module.exports = function (app, db, config, passport) {
  var prefix = config.prefix || '';

  require('./auth')(app, db, config, passport);

  app.get(prefix + '/', function (req, res) {
    res.render('index');
  });
};

