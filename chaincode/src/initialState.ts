import { Host, Entity } from './models/host';

function addDocType<T extends Entity>(hosts: T[], docType): T[] {
  return hosts.map(host => {
    host.docType = docType;
    return host;
  });
}

const hosts: Host[] = [
  {
    id: '1',
    ram: 1000,
    pe: 2,
    owner: 'Org1',
  },
  {
    id: '2',
    ram: 2000,
    pe: 3,
    owner: 'Org2',
  },
];

export const initialHosts = addDocType<Host>(hosts, 'host');
