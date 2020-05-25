const path = require('path');
const fs = require('fs');
const FabricCAServices = require('fabric-ca-client');
const { Wallets } = require('fabric-network');
const { Gateway } = require('fabric-network');

const existsOrCreateDir = dir =>
  !fs.existsSync(path.join(dir)) && fs.mkdirSync(dir);

class Client {
  constructor(config) {
    this.config = config;
    existsOrCreateDir(this.config.walletPath);
    this.readCC();
    this.getCA();
  }

  async initWallet() {
    await this.enrollAdmin();
    await this.registerUser();
  }

  readCC() {
    const ccFile = fs.readFileSync(this.config.connection, 'utf8');
    this.cc = JSON.parse(ccFile);
  }

  getCA() {
    const caInfo = this.cc.certificateAuthorities[this.config.ca];
    const caTLSCACerts = caInfo.tlsCACerts.pem;
    this.ca = new FabricCAServices(
      caInfo.url,
      { trustedRoots: caTLSCACerts, verify: false },
      caInfo.caName,
    );
  }

  async initWallet() {
    if (!this.wallet)
      this.wallet = await Wallets.newFileSystemWallet(this.config.walletPath);
  }

  async getContract() {
    await this.initWallet();
    await this.tryGetIdentity(this.config.user);

    const gateway = new Gateway();
    await gateway.connect(this.cc, {
      wallet: this.wallet,
      identity: this.config.user,
      discovery: { enabled: true, asLocalhost: true },
    });

    const network = await gateway.getNetwork(this.config.channel);
    return network.getContract(this.config.contract);
  }

  async assertUserNotExist(username) {
    if (await this.wallet.get(username)) {
      throw new Error(
        `An identity for the admin user ${username} already exists in the wallet`,
      );
    }
  }

  async tryGetIdentity(username) {
    const identity = await this.wallet.get(username);

    if (!identity) {
      console.log(
        `An identity for the admin user ${username} does not exist in the wallet`,
      );
    }

    return identity;
  }

  async enrollAdmin() {
    await this.initWallet();
    await this.assertUserNotExist(this.config.admin);

    const enrollment = await this.ca.enroll({
      enrollmentID: this.config.admin,
      enrollmentSecret: this.config.adminPwd,
    });

    const x509Identity = {
      credentials: {
        certificate: enrollment.certificate,
        privateKey: enrollment.key.toBytes(),
      },
      mspId: 'Org1MSP',
      type: 'X.509',
    };

    await this.wallet.put(this.config.admin, x509Identity);
  }

  async registerUser() {
    await this.initWallet();
    this.assertUserNotExist(this.config.user);

    const adminIdentity = await this.tryGetIdentity(this.config.admin);

    const provider = this.wallet
      .getProviderRegistry()
      .getProvider(adminIdentity.type);

    const adminUser = await provider.getUserContext(
      adminIdentity,
      this.config.admin,
    );

    const secret = await this.ca.register(
      {
        affiliation: 'org1.department1',
        enrollmentID: this.config.user,
        role: 'client',
      },
      adminUser,
    );

    const enrollment = await this.ca.enroll({
      enrollmentID: this.config.user,
      enrollmentSecret: secret,
    });

    const x509Identity = {
      credentials: {
        certificate: enrollment.certificate,
        privateKey: enrollment.key.toBytes(),
      },
      mspId: 'Org1MSP',
      type: 'X.509',
    };
    await this.wallet.put(this.config.user, x509Identity);
  }

  async query(...query) {
    const contract = await this.getContract();
    const buffer = await contract.evaluateTransaction(...query);
    return buffer.toString();
  }
}

module.exports = Client;
