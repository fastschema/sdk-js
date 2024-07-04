import { describe, expect, it } from 'vitest';
import { RequestError } from '@/libs/error';

describe('Error tests', async () => {
  it('should create a new RequestError instance', () => {
    const error = new RequestError('Failed to fetch');
    expect(error).toBeInstanceOf(RequestError);
    expect(error.message).toBe('Failed to fetch');
    expect(error.isNetworkError).toBe(true);
  });

  it('should create a new RequestError instance without network error', () => {
    const error = new RequestError('An error occurred');
    expect(error).toBeInstanceOf(RequestError);
    expect(error.message).toBe('An error occurred');
    expect(error.isNetworkError).toBe(false);
  });
});
