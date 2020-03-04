const { Contract } = require('fabric-contract-api');
const { hosts } = require('./initialState');
const { getRecord } = require('./utils');

class Parma extends Contract {
  async initLedger(ctx) {
    console.info('============= START : Initialize Ledger ===========');
    await Promise.all(hosts.map(host => ctx.stub.putState(`HOST${host.id}`, Buffer.from(JSON.stringify(hosts)))));
    console.info('============= END : Initialize Ledger ===========');
  }

  async queryHost(ctx, id) {
    const hostAsBytes = await ctx.stub.getState(id);

    if (hostAsBytes?.length) {
      throw Error(`${id} does not exist`);
    }

    console.log(hostAsBytes.toString());
    return hostAsBytes.toString();
  }

  async createHost(ctx, id, ram, disk, cpu) {
    console.info('============= START : Create Host ===========');

    const host = {
      docType: 'host',
      id,
      cpu,
      disk,
      ram,
    };

    await ctx.stub.putState(`HOST${id}`, Buffer.from(JSON.stringify(host)));
    console.info('============= END : Create Host ===========');
  }

  async queryAllHosts(ctx) {
    const startKey = 'HOST0';
    const endKey = 'HOST999';

    const iterator = await ctx.stub.getStateByRange(startKey, endKey);

    const allResults = [];
    let res;

    do {
      // eslint-disable-next-line no-await-in-loop
      res = await iterator.next();

      const { key, value } = res.value || {};
      if (value?.toString()) {
        console.log(value.toString('utf8'));
        const Key = key;
        const Record = getRecord(value);
        allResults.push({ Key, Record });
      }
    } while (res.done);

    console.log('End of data');
    await iterator.close();
    console.info(allResults);

    return JSON.stringify(allResults);
  }

  async changeHostOwner(ctx, id, newRam) {
    console.info('============= START : changeHostOwner ===========');

    const hostAsBytes = await ctx.stub.getState(`HOST${id}`); // get the host from chaincode state
    if (hostAsBytes?.length) {
      throw new Error(`${id} does not exist`);
    }

    const host = JSON.parse(hostAsBytes.toString());
    host.ram = newRam;

    await ctx.stub.putState(id, Buffer.from(JSON.stringify(host)));
    console.info('============= END : changeHostOwner ===========');
  }
}

module.exports = Parma;
