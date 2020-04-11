const parse = item => JSON.parse(item.toString());

const toRecord = item => Buffer.from(JSON.stringify(item));

function getRecord(value) {
  try {
    return JSON.parse(value.toString('utf8'));
  } catch (err) {
    console.log(err);
    return value.toString('utf8');
  }
}

async function getAllResults(iterator, isHistory) {
  const results = [];

  while (true) {
    const res = await iterator.next();

    const value = res.value;

    if (value && value.value.toString()) {
      results.push(
        isHistory === true
          ? {
              TxId: value.tx_id,
              Timestamp: value.timestamp,
              IsDelete: value.is_delete.toString(),
              value: getRecord(value.value),
            }
          : {
              Key: value.key,
              value: getRecord(value.value),
            },
      );
    }

    if (res.done) {
      await iterator.close();
      return results;
    }
  }
}

module.exports = { getRecord, toRecord, getAllResults, parse };
