import { it, expect, describe } from 'vitest';
import { Auth, FsRequest, FastSchema } from '@/index';
import { createTestFs } from '@tests/utils';

describe.sequential('FS tests', async () => {
  it('should create an instance of FastSchema', () => {
    const appUrl = 'http://localhost:8000';
    const fs = new FastSchema(appUrl);
    expect(fs).toBeInstanceOf(FastSchema);
    expect(fs.auth()).toBeInstanceOf(Auth);
    expect(fs.request()).toBeInstanceOf(FsRequest);
  });

  it('should create an instance of FastSchema with custom options', async () => {
    const fs = await createTestFs({ authKey: 'authKey' });
    expect(fs).toBeInstanceOf(FastSchema);
    expect(fs.auth()).toBeInstanceOf(Auth);
    expect(fs.request()).toBeInstanceOf(FsRequest);
  });
});
