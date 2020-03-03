import { Host } from './models/Host';

export const hosts: Host[] = [
  { cpu: 1000, disk: 2000, ram: 4000 },
  { cpu: 1000, disk: 2000, ram: 4000 },
].map((host, index) => ({ ...host, id: index.toString(), docType: 'host' }));
