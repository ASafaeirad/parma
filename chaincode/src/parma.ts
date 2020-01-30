import { Context, Contract } from 'fabric-contract-api';
import { initialHosts } from './initialState';
import { Host } from './models/host';

function getRecord(res) {
  try {
    return JSON.parse(res.value.value.toString('utf8'));
  } catch (err) {
    console.log(err);
    return res.value.value.toString('utf8');
  }
}

export class Parma extends Contract {
  public async initLedger(ctx: Context) {
    console.info('============= START : Initialize Ledger =============');
    const hosts = initialHosts;
    const updates = hosts.map(host => ctx.stub.putState(`HOST${host.id}`, Buffer.from(JSON.stringify(host))));
    await Promise.all(updates);
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

    const iterator = ctx.stub.getStateByRange(startKey, endKey);

    const allResults = [];
    for await (const res of iterator) {
      if (res.value && res.value.values.toString()) {
        console.log(...res.value.values());
        console.log(...res.value.keys());

        const Key = res.value.keys;
        const Record = getRecord(res);
        allResults.push({ Key, Record });
      }
    }

    console.log('end of data');
    await (await iterator).close();
    console.info(allResults);
    return JSON.stringify(allResults);
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
