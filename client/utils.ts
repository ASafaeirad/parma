import * as path from 'path';
import * as fs from 'fs';
import * as FabricCAServices from 'fabric-ca-client';
import { FileSystemWallet, X509WalletMixin } from 'fabric-network';

export const existsOrCreateDir = (dir: string) => !fs.existsSync(path.join(dir)) && fs.mkdirSync(dir);

export function getCC(peer: string, { context = '../network' } = {}) {
  const ccPath = path.resolve(__dirname, context, peer);
  const ccFile = fs.readFileSync(ccPath, 'utf8');
  return JSON.parse(ccFile);
}

export function getCA(cc: any) {
  const caInfo = cc.certificateAuthorities['ca.org1.example.com'];
  const caTLSCACerts = caInfo.tlsCACerts.pem;
  return new FabricCAServices(caInfo.url, { trustedRoots: caTLSCACerts, verify: false }, caInfo.caName);
}

export function getWallet() {
  const walletPath = path.join(process.cwd(), 'wallet');
  existsOrCreateDir(walletPath);
  console.log(`Wallet path: ${walletPath}`);
  return new FileSystemWallet(walletPath);
}
