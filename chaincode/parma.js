const { Contract } = require('fabric-contract-api');
const { tryParse, toRecord, getAllResults, selectHost } = require('./utils');
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

  async submitJob(ctx, owner, cpuReq, memReq) {
    // TODO: get privacy
    const job = {
      owner,
      cpuReq,
      memReq,
    };

    const hosts = await selectHost(ctx, job);
    console.log(hosts);

    hosts[0].mem = hosts[0].mem - memReq;
    hosts[0].cpu = hosts[0].cpu - cpuReq;
    await ctx.stub.putState(hosts[0].id, toRecord(hosts[0]));

    return hosts[0].toString();
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

  queryHosts(ctx) {
    const hosts = ctx.stub.getStateByRange('HOST0', 'HOST999');
    return getAllResults(hosts);
  }

  async changeHostOwner(ctx, hostId, newOwner) {
    console.info('============= START : changeHostOwner ===========');
    const hostBuffer = await ctx.stub.getState(hostId);
    if (!hostBuffer || hostBuffer.length === 0) {
      throw new Error(`${hostId} does not exist`);
    }

    const host = tryParse(hostBuffer);
    host.owner = newOwner;

    await ctx.stub.putState(hostId, toRecord(host));
    console.info('============= END : changeHostOwner ===========');
  }
}

module.exports = Parma;
