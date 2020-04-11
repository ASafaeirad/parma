const { X509WalletMixin } = require('fabric-network');
const { getCC, getCA, getWallet } = require('./utils');
const config = require('./config');

async function enrollAdmin() {
  try {
    const cc = getCC('org1.connection.json');
    const ca = getCA(cc);
    const wallet = getWallet();

    const adminExists = await wallet.exists(config.admin);
    if (adminExists) {
      console.log(
        `An identity for the admin user ${config.admin} already exists in the wallet`,
      );
      return;
    }

    const enrollment = await ca.enroll({
      enrollmentID: config.admin,
      enrollmentSecret: 'adminpw',
    });
    const identity = await X509WalletMixin.createIdentity(
      'Org1MSP',
      enrollment.certificate,
      enrollment.key.toBytes(),
    );

    await wallet.import(config.admin, identity);

    console.log(
      `Successfully enrolled admin user ${config.admin} and imported it into the wallet`,
    );
  } catch (error) {
    console.error(`Failed to enroll admin user ${config.admin}: ${error}`);
    process.exit(1);
  }
}

enrollAdmin();
