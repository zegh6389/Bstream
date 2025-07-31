import { gzip, unzip } from 'zlib';
import { promisify } from 'util';

const gzipPromise = promisify(gzip);
const unzipPromise = promisify(unzip);

export async function compressData(data: string): Promise<Buffer> {
  return gzipPromise(Buffer.from(data));
}

export async function decompressData(data: Buffer): Promise<string> {
  const decompressed = await unzipPromise(data);
  return decompressed.toString();
}
