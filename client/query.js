#!/home/skill/.nvm/versions/node/v8.9.4/bin/node
const { Gateway } = require('fabric-network');
const config = require('./config');
const { getCC, getWallet } = require('./utils');
// const data = require('./data.json');

async function main() {
  try {
    const ccpPath = getCC('org1.connection.json');
    const wallet = getWallet();

    const userExists = await wallet.exists(config.user);
    if (!userExists) {
      console.log(
        'An identity for the user "user1" does not exist in the wallet',
      );
      console.log('Run the registerUser.ts application before retrying');
      return;
    }

    const gateway = new Gateway();
    await gateway.connect(ccpPath, {
      wallet,
      identity: config.user,
      discovery: { enabled: true, asLocalhost: true },
    });

    const network = await gateway.getNetwork(config.channel);
    const contract = network.getContract(config.contract);

    const result = await contract.evaluateTransaction('queryAllHosts');
    console.log(result.toString());
  } catch (error) {
    console.error(`Failed to evaluate transaction: ${error}`);
    process.exit(1);
  }
}

main();
