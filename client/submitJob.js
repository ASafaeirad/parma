#!/home/skill/.config/nvm/versions/node/v13.9.0/bin/node

const config = require('./config');
const Client = require('./client');

const client = new Client(config);

client
  .query('submitJob', 'org1', '100', '200')
  .then(console.log)
  .catch(console.error);
