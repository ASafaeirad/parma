const resource = docType => arr =>
  arr.map((host, id) => ({
    docType,
    ...host,
    id,
    freeCpu: host.cpu,
    freeRam: host.ram,
  }));

const hosts = [
  { cpu: 1000, ram: 5000, owner: 'org1' },
  { cpu: 1000, ram: 7000, owner: 'org2' },
];

module.exports = {
  hosts: resource('host')(hosts),
};
