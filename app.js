var highlight = require('highlight'),
    //passport = require('passport'),
    express = require('express'),
    marked = require('marked'),
    flash = require('connect-flash'),
    cons = require('consolidate'),
    http = require('http'),
    path = require('path'),
    fs = require('fs');

var config = require('./config');
var db = require('./models')(config);
var app = express();
var sessions = new express.session.MemoryStore(); // Must change for cluster-safe

//require('./auth')(passport, db, config);

if (!fs.existsSync(path.join(config.datadir, 'uploads'))) {
  fs.mkdirSync(path.join(config.datadir, 'uploads'), 0644);
}
if (!fs.existsSync(path.join(config.datadir, 'thumbs'))) {
  fs.mkdirSync(path.join(config.datadir, 'thumbs'), 0644);
}

db.board.findById(config.mainboard, function (err, board) {
  if (!err && !board) {
    board = new db.board();
    board._id = config.mainboard;
    board.name = config.mainboard;
    board.desc = config.mainboard;
    board.save(function (err, b) {
      if (err) console.log(err);
    });
  }
});

marked.setOptions({
  gfm: true,
  tables: false,
  breaks: false,
  pedantic: false,
  sanitize: true,
  smartLists: true,
  langPrefix: 'lang-',
  highlight: function (code, lang) {
    return highlight.Highlight(code);
  }
});

app.configure(function () {
  // Templating
  app.engine('jade', cons.jade);
  app.set('views', __dirname + '/views');
  app.set('view engine', 'jade');
  app.set('view options', { pretty: true });
  app.locals({
    config:    config || {},
    title:     config.title  || '',
    pagetitle: '',
    prefix:    config.prefix || '',
    marked:    marked
  });
  // Standard stuff
  app.use(express.favicon());
  app.use(express.logger('dev'));
  app.use(express.limit(config.maxsize));
  app.use(express.bodyParser({ keepExtensions: true }));
  app.use(express.methodOverride());
  // Sessions
  app.use(express.cookieParser(config.secret));
  app.use(express.session({ store: sessions, secret: config.secret, key: 'express.sid' }));
  // Flash messages
  app.use(flash());
  app.use(function (req, res, next) {
    res.locals.success = req.flash('success') || [];
    res.locals.error = req.flash('error') || [];
    next();
  });
  // Authentication
  //app.use(passport.initialize());
  //app.use(passport.session());
  //app.use(function (req, res, next) {
  //  res.locals.user = req.user;
  //  next();
  //});
  // Static files serving
  if (config.datadir != path.join(__dirname, 'public')) app.use(express['static'](config.datadir));
  app.use(express['static'](path.join(__dirname, 'public')));
  // Route serving
  app.use(app.router);
});

app.configure('development', function () {
  app.use(express.errorHandler());
});

// http://madhums.me/2012/07/19/breaking-down-app-js-file-nodejs-express-mongoose/
require('./controllers')(app, db, config, null);//passport);

http.createServer(app).listen(config.port || 3000, config.listen || '0.0.0.0', function () {
  console.log("Project " + config.title + " server listening on " + (config.listen || '0.0.0.0') + ":" + (config.port || 3000));
});

