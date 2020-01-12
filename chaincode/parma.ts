import { Context, Contract } from 'fabric-contract-api';
import { Host } from './models/host';

export class Parma extends Contract {
  public async initLedger(ctx: Context) {
    console.info('============= START : Initialize Ledger =============');
    const hosts: Host[] = [
      {
        id: '1',
        ram: 1000,
        pe: 2,
        owner: 'Org1',
      },
      {
        id: '2',
        ram: 2000,
        pe: 3,
        owner: 'Org2',
      },
    ];

    for (let i = 0; i < hosts.length; i++) {
      hosts[i].docType = 'host';
      await ctx.stub.putState(`HOST${i}`, Buffer.from(JSON.stringify(hosts[i])));
      console.info('Added <--> ', hosts[i]);
    }
    console.info('============= END : Initialize Ledger =============');
  }

  public async queryHosts(ctx: Context, hostNumber: string): Promise<string> {
    const hostAsBytes = await ctx.stub.getState(hostNumber); // get the host from chaincode state
    if (!hostAsBytes || hostAsBytes.length === 0) {
      throw new Error(`${hostNumber} does not exist`);
    }
    console.log(hostAsBytes.toString());
    return hostAsBytes.toString();
  }

  public async createHost(ctx: Context, id: string, ram: number, pe: number, owner: string) {
    console.info('============= START : Create Car =============');

    const host: Host = {
      docType: 'host',
      id,
      ram,
      pe,
      owner,
    };

    await ctx.stub.putState(id, Buffer.from(JSON.stringify(host)));
    console.info('============= END : Create Car =============');
  }

  public async queryAllHosts(ctx: Context): Promise<string> {
    const startKey = 'CAR0';
    const endKey = 'CAR999';

    const iterator = await ctx.stub.getStateByRange(startKey, endKey);

    const allResults = [];
    while (true) {
      const res = await iterator.next();

      if (res.value && res.value.value.toString()) {
        console.log(res.value.value.toString('utf8'));

        const Key = res.value.key;
        let Record;
        try {
          Record = JSON.parse(res.value.value.toString('utf8'));
        } catch (err) {
          console.log(err);
          Record = res.value.value.toString('utf8');
        }
        allResults.push({ Key, Record });
      }
      if (res.done) {
        console.log('end of data');
        await iterator.close();
        console.info(allResults);
        return JSON.stringify(allResults);
      }
    }
  }

  public async changeCarOwner(ctx: Context, carNumber: string, newOwner: string) {
    console.info('============= START : changeCarOwner =============');

    const carAsBytes = await ctx.stub.getState(carNumber); // get the car from chaincode state
    if (!carAsBytes || carAsBytes.length === 0) {
      throw new Error(`${carNumber} does not exist`);
    }
    const host: Host = JSON.parse(carAsBytes.toString());
    host.owner = newOwner;

    await ctx.stub.putState(carNumber, Buffer.from(JSON.stringify(host)));
    console.info('============= END : changeCarOwner =============');
  }
}
