const parse = item => JSON.parse(item.toString('utf8'));

const toRecord = item => Buffer.from(JSON.stringify(item));

function tryParse(value) {
  try {
    return parse(Buffer.from(value));
  } catch (err) {
    console.log(err);
    return value;
  }
}

async function getAllResults(iterator) {
  const allResults = [];

  for await (const { key, value } of iterator) {
    allResults.push({ Key: key, Record: tryParse(value) });
  }

  return allResults;
}

async function _getAllResults(iterator, isHistory) {
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
              value: tryParse(value.value),
            }
          : {
              Key: value.key,
              value: tryParse(value.value),
            },
      );
    }

    if (res.done) {
      await iterator.close();
      return results;
    }
  }
}

module.exports = {
  tryParse,
  toRecord,
  getAllResults,
  parse,
};
