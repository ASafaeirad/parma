#!/home/skill/.config/nvm/versions/node/v13.9.0/bin/node

const config = require('./config');
const Client = require('./client');

const client = new Client(config);

client
  .initWallet()
  .then(() => {
    console.log('Wallet successfully created');
  })
  .catch(error => {
    console.error(`Failed to create wallet: ${error}`);
  });
