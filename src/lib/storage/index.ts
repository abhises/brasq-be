import { env } from '../../env.js';
import { LocalStorage } from './local.js';
import { S3Storage } from './s3.js';

export interface StorageDriver {
  name: 'local' | 's3';
  put(key: string, body: Buffer, contentType: string): Promise<string>;
  remove(key: string): Promise<void>;
}

export const storage: StorageDriver = env.storageDriver === 's3' ? new S3Storage() : new LocalStorage();
