#!/home/skill/.nvm/versions/node/v8.9.4/bin/node

const config = require('./config');
const { Client } = require('./utils');
// const data = require('./data.json');

Client(config)
  .query('submitJob', 'org1', '100', '200')
  .then(console.log)
  .catch(console.error);
