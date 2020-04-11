const { Contract } = require('fabric-contract-api');
const { parse, toRecord, getAllResults } = require('./utils');
const initial = require('./initialState');

class Parma extends Contract {
  async initLedger(ctx) {
    console.info('============= START : Initialize Ledger ===========');
    const hosts = initial.hosts;
    await Promise.all(
      hosts.map(({ id, ...host }) =>
        ctx.stub.putState(`HOST${id}`, toRecord(host)),
      ),
    );
    console.info('============= END : Initialize Ledger ===========');
  }

  async queryHostsByOwner(stub, owner) {
    if (!owner) {
      throw new Error('Invalid usage: Owner arg is missing');
    }

    const queryString = {
      selector: { docType: 'host', owner: owner.toLowerCase() },
    };

    const queryResults = await this.getQueryResultForQueryString(
      stub,
      JSON.stringify(queryString),
    );

    return queryResults;
  }

  async getQueryResultForQueryString(stub, queryString) {
    const resultsIterator = await stub.getQueryResult(queryString);
    const results = await this.getAllResults(resultsIterator, false);

    return toRecord(results);
  }

  async submitJob(ctx, host, pTag) {
    // get privacy

    // privacy Org1
    const job = {};
  }

  async queryHost(ctx, hostId) {
    const hostAsBytes = await ctx.stub.getState(hostId);
    if (!hostAsBytes || hostAsBytes.length === 0) {
      throw new Error(`${hostId} does not exist`);
    }
    console.log(hostAsBytes.toString());
    return hostAsBytes.toString();
  }

  async createHost(ctx, hostId, make, model, color, owner) {
    console.info('============= START : Create Host ===========');

    const host = {
      docType: 'host',
      color,
      make,
      model,
      owner,
    };

    await ctx.stub.putState(hostId, toRecord(host));
    console.info('============= END : Create Host ===========');
  }

  async queryAllHosts(ctx) {
    const startKey = 'HOST0';
    const endKey = 'HOST999';
    const iterator = await ctx.stub.getStateByRange(startKey, endKey);
    return getAllResults(iterator);
  }

  async changeHostOwner(ctx, hostId, newOwner) {
    console.info('============= START : changeHostOwner ===========');
    const hostAsBytes = await ctx.stub.getState(hostId);
    if (!hostAsBytes || hostAsBytes.length === 0) {
      throw new Error(`${hostId} does not exist`);
    }
    const host = parse(hostAsBytes);
    host.owner = newOwner;

    await ctx.stub.putState(hostId, toRecord(host));
    console.info('============= END : changeHostOwner ===========');
  }
}

module.exports = Parma;
