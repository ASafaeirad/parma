import * as path from 'path';
import * as fs from 'fs';
import * as FabricCAServices from 'fabric-ca-client';
import { FileSystemWallet } from 'fabric-network';

export const existsOrCreateDir = (dir: string) => !fs.existsSync(path.join(dir)) && fs.mkdirSync(dir);

export function getCCPath(peer: string, { context = '../../network' } = {}) {
  return path.resolve(__dirname, context, peer);
}

export function getCC(peer: string, { context = '../../network' } = {}) {
  const ccFile = fs.readFileSync(getCCPath(peer, { context }), 'utf8');
  return JSON.parse(ccFile);
}

export function getCA(cc: any, peer = 'ca.org1.example.com') {
  const caInfo = cc.certificateAuthorities[peer];
  const caTLSCACerts = caInfo.tlsCACerts.pem;
  return new FabricCAServices(caInfo.url, { trustedRoots: caTLSCACerts, verify: false }, caInfo.caName);
}

export function getWallet() {
  const walletPath = path.join(process.cwd(), 'wallet');
  existsOrCreateDir(walletPath);
  console.log(`Wallet path: ${walletPath}`);
  return new FileSystemWallet(walletPath);
}
