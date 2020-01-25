import { X509WalletMixin } from 'fabric-network';
import { getCC, getCA, getWallet } from './utils';

async function enrollAdmin() {
  try {
    const cc = getCC('org1.connection.json');
    const ca = getCA(cc);
    const wallet = getWallet();

    const adminExists = await wallet.exists('admin');
    if (adminExists) {
      console.log('An identity for the admin user "admin" already exists in the wallet');
      return;
    }

    const enrollment = await ca.enroll({ enrollmentID: 'admin', enrollmentSecret: 'adminpw' });
    const identity = await X509WalletMixin.createIdentity('Org1MSP', enrollment.certificate, enrollment.key.toBytes());

    await wallet.import('admin', identity);

    console.log('Successfully enrolled admin user "admin" and imported it into the wallet');
  } catch (error) {
    console.error(`Failed to enroll admin user "admin": ${error}`);
    process.exit(1);
  }
}

enrollAdmin();
