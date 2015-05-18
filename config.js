var path = require('path');

module.exports = {
  title     : 'Ryouiki',
  prefix    : '',
  secret    : '!N_D35U_W3_7RU$7~',
  salt      : '0P_I$_4_F46607!',
  listen    : '0.0.0.0',
  port      : Number(process.env.PORT || ((process.env.NODE_ENV == 'production') ? 80 : 3000)),
  mongodb: {
    url     : process.env.MONGODB_URL || 'mongodb://localhost:27017/boards'
  },
  datadir   : path.join(__dirname, 'public'),
  thumbsize : 128,
  maxsize   : '15mb',
  replies   : 2,
  pagesize  : 20,
  mainboard : 'nil'
};
