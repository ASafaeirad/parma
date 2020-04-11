#!/home/skill/.nvm/versions/node/v8.9.4/bin/node

const config = require('./config');
const { Client } = require('./utils');

Client(config)
  .query('queryHosts')
  .then(console.log)
  .catch(console.error);
