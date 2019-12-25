import * as path from 'path';
import * as fs from 'fs';
import * as FabricCAServices from 'fabric-ca-client';
import { existsOrCreateDir } from './utils'
import { FileSystemWallet, X509WalletMixin } from 'fabric-network';

function getCC(peer: string, { context = '../network' } = {}) {
  const ccPath = path.resolve(__dirname, context, peer);
  const ccFile = fs.readFileSync(ccPath, 'utf8');
  return JSON.parse(ccFile);
}

function getCA(cc: any) {
    const caInfo = cc.certificateAuthorities['ca.org1.example.com'];
    const caTLSCACerts = caInfo.tlsCACerts.pem;
    return new FabricCAServices(caInfo.url, { trustedRoots: caTLSCACerts, verify: false }, caInfo.caName);
}

function getWallet() {
    const walletPath = path.join(process.cwd(), 'wallet');
    existsOrCreateDir(walletPath);
    console.log(`Wallet path: ${walletPath}`);
    return new FileSystemWallet(walletPath);
}

async function createIdentity(ca: FabricCAServices) {
  const enrollment = await ca.enroll({ enrollmentID: 'admin', enrollmentSecret: 'adminpw' });
  return X509WalletMixin.createIdentity('Org1MSP', enrollment.certificate, enrollment.key.toBytes());
}

async function main() {
  try {
    const cc = getCC('org1.connection.json');
    const ca = getCA(cc);
    const wallet = getWallet();

    const adminExists = await wallet.exists('admin');
    if (adminExists) {
      console.log('An identity for the admin user "admin" already exists in the wallet');
      return;
    }

    const identity = await createIdentity(ca);
    await wallet.import('admin', identity);

    console.log('Successfully enrolled admin user "admin" and imported it into the wallet');
  } catch (error) {
    console.error(`Failed to enroll admin user "admin": ${error}`);
    process.exit(1);
  }
}

main();
