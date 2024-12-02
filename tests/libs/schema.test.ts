import { FastSchema } from '@/index';
import { createTestFs, waitServerReady, userSchemas, cleanup } from '@tests/utils';
import { afterEach, beforeAll, describe, expect, it } from 'vitest';

let fs: FastSchema;

afterEach(async () => cleanup(fs));
beforeAll(async () => {
  fs = await createTestFs();
  await waitServerReady(fs);
  await fs.syncSchemas();
});

describe.sequential('Schema tests', async () => {
  it('should return valid schema', async () => {
    expect(fs.schema()).toBeDefined();

    const schemaUser = fs.schema('user');
    expect(schemaUser).toBeDefined();
    expect(schemaUser?.name()).toBe('user');
    expect(schemaUser?.namespace()).toBe('users');
    expect(schemaUser?.labelField()).toBeDefined();
    expect(schemaUser?.raw()).toBeDefined();
    expect(schemaUser?.fields()?.length).toBeGreaterThan(0);
    expect(schemaUser?.disableTimestamp()).toBeDefined();
    expect(schemaUser?.isSystemSchema()).toBeDefined();
    expect(schemaUser?.isJunctionSchema()).toBeDefined();

    expect(() => fs.schema('invalid')).toThrowError('schema invalid not found');
  });

  it('should create a new schema', async () => {
    const createdTagSchema = await fs.schemas().create(userSchemas['tag']);
    const tagSchema = fs.schema('tag');
    expect(createdTagSchema.name()).toBe(tagSchema?.name());
    expect(createdTagSchema.namespace()).toBe(tagSchema?.namespace());
    expect(createdTagSchema.labelField()).toBe(tagSchema?.labelField());
    const tagSchemaFields = tagSchema?.fields().filter(f => !f.is_locked).map(f => f.name);
    const createdTagFields = createdTagSchema.fields().map(f => f.name);
    expect(createdTagFields).toEqual(tagSchemaFields);
  });

  it('should fail to create a schema with the same name', async () => {
    const createdTagSchema = await fs.schemas().create(userSchemas['tag']);
    expect(createdTagSchema).toBeDefined();
    await expect(() => fs.schemas().create(userSchemas['tag'])).
      rejects.toThrowError('schema already exists');
  });

  it('should successfully update a schema', async () => {
    const fs = await createTestFs();
    await fs.schemas().create(userSchemas['tag']);
    const updateData = { ...userSchemas['tag'], label_field: 'description' };
    await fs.schemas().update('tag', { schema: updateData });
    const updatedTagSchema = fs.schema('tag');
    expect(updatedTagSchema).toBeDefined();
    expect(updatedTagSchema?.labelField()).toBe('description');
  });

  it('should successfully update a schema with a new namespace', async () => {

  });

  it('should successfully delete a schema', async () => {
    await fs.schemas().create(userSchemas['tag']);
    await fs.schemas().delete('tag');
    expect(fs.schemas().has('tag')).toBe(false);
    expect(() =>  fs.schema('tag')).toThrowError('schema tag not found');
  });
});
