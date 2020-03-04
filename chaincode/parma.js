/*
 * SPDX-License-Identifier: Apache-2.0
 */

const { Contract } = require('fabric-contract-api');

class Parma extends Contract {
  async initLedger(ctx) {
    console.info('============= START : Initialize Ledger ===========');
    const hosts = [
      {
        color: 'blue',
        make: 'Toyota',
        model: 'Prius',
        owner: 'Tomoko',
      },
      {
        color: 'red',
        make: 'Ford',
        model: 'Mustang',
        owner: 'Brad',
      },
      {
        color: 'green',
        make: 'Hyundai',
        model: 'Tucson',
        owner: 'Jin Soo',
      },
      {
        color: 'yellow',
        make: 'Volkswagen',
        model: 'Passat',
        owner: 'Max',
      },
      {
        color: 'black',
        make: 'Tesla',
        model: 'S',
        owner: 'Adriana',
      },
      {
        color: 'purple',
        make: 'Peugeot',
        model: '205',
        owner: 'Michel',
      },
      {
        color: 'white',
        make: 'Chery',
        model: 'S22L',
        owner: 'Aarav',
      },
      {
        color: 'violet',
        make: 'Fiat',
        model: 'Punto',
        owner: 'Pari',
      },
      {
        color: 'indigo',
        make: 'Tata',
        model: 'Nano',
        owner: 'Valeria',
      },
      {
        color: 'brown',
        make: 'Holden',
        model: 'Barina',
        owner: 'Shotaro',
      },
    ];

    for (let i = 0; i < hosts.length; i++) {
      hosts[i].docType = 'host';
      await ctx.stub.putState(`HOST${i}`, Buffer.from(JSON.stringify(hosts[i])));
      console.info('Added <--> ', hosts[i]);
    }
    console.info('============= END : Initialize Ledger ===========');
  }

  async queryHost(ctx, hostNumber) {
    const hostAsBytes = await ctx.stub.getState(hostNumber); // get the host from chaincode state
    if (!hostAsBytes || hostAsBytes.length === 0) {
      throw new Error(`${hostNumber} does not exist`);
    }
    console.log(hostAsBytes.toString());
    return hostAsBytes.toString();
  }

  async createHost(ctx, hostNumber, make, model, color, owner) {
    console.info('============= START : Create Host ===========');

    const host = {
      color,
      docType: 'host',
      make,
      model,
      owner,
    };

    await ctx.stub.putState(hostNumber, Buffer.from(JSON.stringify(host)));
    console.info('============= END : Create Host ===========');
  }

  async queryAllHosts(ctx) {
    const startKey = 'HOST0';
    const endKey = 'HOST999';

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

  async changeHostOwner(ctx, hostNumber, newOwner) {
    console.info('============= START : changeHostOwner ===========');

    const hostAsBytes = await ctx.stub.getState(hostNumber); // get the host from chaincode state
    if (!hostAsBytes || hostAsBytes.length === 0) {
      throw new Error(`${hostNumber} does not exist`);
    }
    const host = JSON.parse(hostAsBytes.toString());
    host.owner = newOwner;

    await ctx.stub.putState(hostNumber, Buffer.from(JSON.stringify(host)));
    console.info('============= END : changeHostOwner ===========');
  }
}

module.exports = Parma;
