const path = require('path');

module.exports = {
  channel: 'mychannel',
  contract: 'parma',
  user: 'user',
  admin: 'admin',
  adminPwd: 'adminpw',
  walletPath: path.resolve(__dirname, 'wallet'),
  ca: 'ca.org1.example.com',
  connection: path.resolve(
    __dirname,
    '../network/organizations/peerOrganizations/org1.example.com/connection-org1.json',
  ),
};
