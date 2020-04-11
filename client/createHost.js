const { Gateway } = require('fabric-network');
const { getCC, getWallet } = require('./utils');
const config = require('./config');

async function main() {
  try {
    const ccpPath = getCC('org1.connection.json');
    const wallet = getWallet();

    // Check to see if we've already enrolled the user.
    const userExists = await wallet.exists(config.user);
    if (!userExists) {
      console.log(
        'An identity for the user "user1" does not exist in the wallet',
      );
      console.log('Run the registerUser.js application before retrying');
      return;
    }

    // Create a new gateway for connecting to our peer node.
    const gateway = new Gateway();
    await gateway.connect(ccpPath, {
      wallet,
      identity: config.user,
      discovery: { enabled: true, asLocalhost: true },
    });

    // Get the network (channel) our contract is deployed to.
    const network = await gateway.getNetwork('mychannel');

    // Get the contract from the network.
    const contract = network.getContract('parma');

    await contract.submitTransaction('createHost', '12', 100, 1000, 1000);
    console.log('Transaction has been submitted');

    await gateway.disconnect();
  } catch (error) {
    console.error(`Failed to submit transaction: ${error}`);
    process.exit(1);
  }
}

main();
