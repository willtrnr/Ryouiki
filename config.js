module.exports = {
  title    : 'Template',
  prefix   : '',
  secret   : 'T3MPL4T3',
  salt     : 'T3MPL4T3',
  host     : process.env.OPENSHIFT_APP_DNS || 'localhost',
  listen   : process.env.OPENSHIFT_NODEJS_IP || '0.0.0.0',
  port     : Number(process.env.OPENSHIFT_NODEJS_PORT) || ((process.env.NODE_ENV == 'production') ? 80 : 3000),
  mongodb: {
    url    : process.env.OPENSHIFT_MONGODB_DB_URL,
    db     : 'template'
  }
};
