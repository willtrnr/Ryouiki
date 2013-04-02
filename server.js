var express  = require('express'),
    passport = require('passport'),
    flash    = require('connect-flash'),
    cons     = require('consolidate'),
    http     = require('http'),
    path     = require('path');

var config   = require('./config');
var db       = require('./models')(config);
var app      = express();
var sessions = new express.session.MemoryStore(); // Must change for cluster-safe

require('./auth')(passport, db, config);

app.configure(function () {
  // Templating
  app.engine('jade', cons.jade);
  app.set('views', __dirname + '/views');
  app.set('view engine', 'jade');
  app.set('view options', { pretty: true });
  app.locals({
    config:    config || {},
    title:     config.title  || '',
    pagetitle: config.title  || '',
    prefix:    config.prefix || ''
  });
  // Standard stuff
  app.use(express.favicon());
  app.use(express.logger('dev'));
  app.use(express.bodyParser());
  app.use(express.methodOverride());
  // Sessions
  app.use(express.cookieParser(config.secret));
  app.use(express.session({ store: sessions, secret: config.secret, key: 'express.sid' }));
  // Flash messages
  app.use(flash());
  app.use(function (req, res, next) {
    res.locals.success = req.flash('success')[0] || null;
    res.locals.error = req.flash('error')[0] || null;
    next();
  });
  // Authentication
  app.use(passport.initialize());
  app.use(passport.session());
  app.use(function (req, res, next) {
    res.locals.user = req.user;
    next();
  });
  // Route serving
  app.use(app.router);
  app.use(express['static'](config.datadir));
  app.use(express['static'](path.join(__dirname, 'public')));
});

app.configure('development', function () {
  app.use(express.errorHandler());
});

// http://madhums.me/2012/07/19/breaking-down-app-js-file-nodejs-express-mongoose/
require('./controllers')(app, db, config, passport);

http.createServer(app).listen(config.port || 3000, config.listen || '0.0.0.0', function () {
  console.log("Project " + config.title + " server listening on " + (config.listen || '0.0.0.0') + ":" + (config.port || 3000));
});

