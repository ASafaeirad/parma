export function getRecord(value: Buffer): string {
  try {
    return JSON.parse(value.toString('utf8'));
  } catch (err) {
    console.log(err);
    return value.toString('utf8');
  }
}
