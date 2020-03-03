const path = require('path');
const fs = require('fs');
const FabricCAServices = require('fabric-ca-client');
const { FileSystemWallet } = require('fabric-network');

const existsOrCreateDir = dir => !fs.existsSync(path.join(dir)) && fs.mkdirSync(dir);

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
  return new FabricCAServices(caInfo.url, { trustedRoots: caTLSCACerts, verify: false }, caInfo.caName);
}

function getWallet() {
  const walletPath = path.join(process.cwd(), 'wallet');
  existsOrCreateDir(walletPath);
  console.log(`Wallet path: ${walletPath}`);
  return new FileSystemWallet(walletPath);
}

module.exports = {
  existsOrCreateDir,
  getCCPath,
  getCC,
  getCA,
  getWallet,
};
