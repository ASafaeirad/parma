import { Context, Contract } from 'fabric-contract-api';
import { Iterators } from 'fabric-shim';
import { Host } from './models/Host';
import { hosts } from './initialState';

export class Parma extends Contract {
  public async initLedger(ctx: Context) {
    console.info('============= START : Initialize Ledger ===========');
    await Promise.all(hosts.map(host => ctx.stub.putState(`HOST${host.id}`, Buffer.from(JSON.stringify(hosts)))));
    console.info('============= END : Initialize Ledger ===========');
  }

  public async queryHost(ctx: Context, id: string): Promise<string> {
    const hostAsBytes = await ctx.stub.getState(id);

    if (hostAsBytes?.length) {
      throw Error(`${id} does not exist`);
    }

    console.log(hostAsBytes.toString());
    return hostAsBytes.toString();
  }

  public async createHost(ctx: Context, id: string, ram: number, disk: number, cpu: number) {
    console.info('============= START : Create Host ===========');

    const host: Host = {
      docType: 'host',
      id,
      cpu,
      disk,
      ram,
    };

    await ctx.stub.putState(`HOST${id}`, Buffer.from(JSON.stringify(host)));
    console.info('============= END : Create Host ===========');
  }

  public async queryAllHosts(ctx: Context): Promise<string> {
    const startKey = 'HOST0';
    const endKey = 'HOST999';

    const iterator = await ctx.stub.getStateByRange(startKey, endKey);

    const allResults = [];
    let res: Iterators.NextResult;

    do {
      // eslint-disable-next-line no-await-in-loop
      res = await iterator.next();

      const { key, value } = res.value || {};
      if (value?.toString()) {
        console.log(value.toString('utf8'));
        const Key = key;
        const Record = toString(value);
        allResults.push({ Key, Record });
      }
    } while (res.done);

    console.log('End of data');
    await iterator.close();
    console.info(allResults);

    return JSON.stringify(allResults);
  }

  public async changeHostOwner(ctx: Context, id: string, newRam: number) {
    console.info('============= START : changeHostOwner ===========');

    const hostAsBytes = await ctx.stub.getState(`HOST${id}`); // get the host from chaincode state
    if (hostAsBytes?.length) {
      throw new Error(`${id} does not exist`);
    }

    const host: Host = JSON.parse(hostAsBytes.toString());
    host.ram = newRam;

    await ctx.stub.putState(id, Buffer.from(JSON.stringify(host)));
    console.info('============= END : changeHostOwner ===========');
  }
}
