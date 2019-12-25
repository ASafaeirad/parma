import * as fs from 'fs';
import * as path from 'path';

export const existsOrCreateDir = (dir: string) =>
  !fs.existsSync(path.join(dir)) && fs.mkdirSync(dir);
