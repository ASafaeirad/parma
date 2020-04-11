const path = require('path');
const fs = require('fs');
const FabricCAServices = require('fabric-ca-client');
const { FileSystemWallet } = require('fabric-network');
const { Gateway } = require('fabric-network');

const existsOrCreateDir = dir =>
  !fs.existsSync(path.join(dir)) && fs.mkdirSync(dir);

function getCCPath(peer, { context = '.' } = {}) {
  return path.resolve(__dirname, context, peer);
}

function getCC(peer, { context = '.' } = {}) {
  const ccFile = fs.readFileSync(getCCPath(peer, { context }), 'utf8');
  return JSON.parse(ccFile);
}

function getCA(cc, peer = 'ca.org1.example.com') {
  const caInfo = cc.certificateAuthorities[peer];
  const caTLSCACerts = caInfo.tlsCACerts.pem;
  return new FabricCAServices(
    caInfo.url,
    { trustedRoots: caTLSCACerts, verify: false },
    caInfo.caName,
  );
}

function getWallet() {
  const walletPath = path.join(process.cwd(), 'wallet');
  existsOrCreateDir(walletPath);
  return new FileSystemWallet(walletPath);
}

async function getContract(config) {
  const ccpPath = getCC(config.connection);
  const wallet = getWallet();

  if (!(await wallet.exists(config.user))) {
    throw new Error(
      'An identity for the user "user1" does not exist in the wallet. Run the registerUser.ts application before retrying',
    );
  }

  const gateway = new Gateway();
  await gateway.connect(ccpPath, {
    wallet,
    identity: config.user,
    discovery: { enabled: true, asLocalhost: true },
  });

  const network = await gateway.getNetwork(config.channel);
  const contract = network.getContract(config.contract);

  return contract;
}

const Client = config => ({
  query: async (...query) => {
    const contract = await getContract(config);
    const buffer = await contract.evaluateTransaction(...query);
    return buffer.toString();
  },
});

module.exports = {
  existsOrCreateDir,
  getCCPath,
  getCC,
  getCA,
  getWallet,
  getContract,
  Client,
};
