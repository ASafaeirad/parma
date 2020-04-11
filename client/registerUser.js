const { Gateway, X509WalletMixin } = require('fabric-network');
const { getWallet, getCCPath } = require('./utils');
const config = require('./config');

async function registerUser() {
  try {
    const ccpPath = getCCPath('org1.connection.json');
    const wallet = getWallet();

    if (await wallet.exists(config.user)) {
      console.log(
        `An identity for the user ${config.user} already exists in the wallet`,
      );
      return;
    }

    if (!(await wallet.exists(config.admin))) {
      console.log(
        `An identity for the admin user ${config.admin} does not exist in the wallet`,
      );
      return;
    }

    const gateway = new Gateway();
    await gateway.connect(ccpPath, {
      wallet,
      identity: config.admin,
      discovery: { enabled: true, asLocalhost: true },
    });

    const ca = gateway.getClient().getCertificateAuthority();
    const adminIdentity = gateway.getCurrentIdentity();

    const secret = await ca.register(
      {
        affiliation: 'org1.department1',
        enrollmentID: config.user,
        role: 'client',
      },
      adminIdentity,
    );
    const enrollment = await ca.enroll({
      enrollmentID: config.user,
      enrollmentSecret: secret,
    });

    const userIdentity = X509WalletMixin.createIdentity(
      'Org1MSP',
      enrollment.certificate,
      enrollment.key.toBytes(),
    );

    await wallet.import(config.user, userIdentity);
    console.log(
      `Successfully registered and enrolled admin user ${config.user} and imported it into the wallet`,
    );
  } catch (error) {
    console.error(`Failed to register user "user1": ${error}`);
    process.exit(1);
  }
}

registerUser();
