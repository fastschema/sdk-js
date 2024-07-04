/**
 * @vitest-environment jsdom
 */

import { DefaultAuthStore, FastSchema, FilterObject, FsRequest } from '@/index';
import { EventCallbackArray, EventType, Realtime } from '@/libs/realtime';
import { cleanup, createTestFs, sleep, Tag, userSchemas, waitServerReady } from '@tests/utils';
import { afterAll, beforeAll, describe, expect, it } from 'vitest';

let fs: FastSchema;
afterAll(async () => cleanup(fs));
beforeAll(async () => {
  fs = await createTestFs();
  await waitServerReady(fs);
  await fs.schemas().create(userSchemas['tag']);
});

describe.sequential('Realtime tests', () => {
  it('should failed if callback is undefined', async () => {
    const schemaTag = fs.schema('tag');
    const callback = undefined as unknown as EventCallbackArray<Tag>;
    await expect(schemaTag.on('update', 1, callback)).
      rejects.
      toThrowError('Callback is required');
  });

  it('should failed with invalid realtime url', async () => {
    const appUrl = 'http://localhost';
    const authStore = new DefaultAuthStore();
    const request = new FsRequest(appUrl, {
      getAuthToken: () => authStore.getToken(),
    });



    const realtime = new Realtime(userSchemas['tag'], request);
    const callback = (_tag: Tag, _event: EventType, err: Error) => {
      expect(err).toBeDefined();
    };
    realtime.on('create', 1, callback);
  });

  it('should receive tag create event', async () => {
    const schemaTag = fs.schema('tag');
    let tagCreateFireCount = 0;
    const onTagCreate = (tag: Tag, event: EventType) => {
      tagCreateFireCount++;
      expect(event).toBe('create');
      expect(tag.name).toBeDefined();
      schemaTag.off(onTagCreate);
    };
    schemaTag.on<Tag>('create', onTagCreate);
    const createdTag = await schemaTag.create<Tag>({ name: 'tag1' });
    await schemaTag.delete(createdTag.id);
  });

  it('should receive tag update event', async () => {
    const schemaTag = fs.schema('tag')
    const onTagUpdate: EventCallbackArray<Tag> = (tags, event) => {
      expect(event).toBe('update');
      expect(tags).toBeInstanceOf(Array);
      expect(tags[0].name).toBe('tag1 updated')
      schemaTag.off(onTagUpdate);
    };

    schemaTag.on<Tag>('update', onTagUpdate);
    const createdTag = await schemaTag.create<Tag>({ name: 'tag1' });
    createdTag.name = 'tag1 updated';
    await schemaTag.update(createdTag.id, createdTag);
    await schemaTag.delete(createdTag.id);
  });

  it('should receive tag delete event', async () => {
    const schemaTag = fs.schema('tag')
    const onTagDelete: EventCallbackArray<Tag> = (tags, event) => {
      expect(event).toBe('delete');
      expect(tags).toBeInstanceOf(Array);
      expect(tags[0].name).toBe('tag1');
      schemaTag.off(onTagDelete);
    };
    schemaTag.on<Tag>('delete', onTagDelete);
    const createdTag = await schemaTag.create<Tag>({ name: 'tag1' });
    await schemaTag.delete(createdTag.id);
  });


  it('should receive tag wildcard event', async () => {
    const schemaTag = fs.schema('tag');
    const onTagWildcard = (tags: Tag | Tag[], event: EventType) => {
      if (event === 'create') {
        expect(tags).toBeInstanceOf(Object);
        expect(Array.isArray(tags)).toBe(false);
        const tag = tags as Tag;
        expect(tag.name).toBe('tag1');
      }

      if (event === 'update') {
        expect(tags).toBeInstanceOf(Array);
        expect((tags as Tag[])[0].name).toBe('tag1 updated');
      }

      if (event === 'delete') {
        expect(tags).toBeInstanceOf(Array);
        expect((tags as Tag[])[0].name).toBe('tag1 updated');
      }

      schemaTag.off(onTagWildcard);
    };
    schemaTag.on<Tag>('*', onTagWildcard);

    // create tag
    const createdTag = await schemaTag.create<Tag>({ name: 'tag1' });

    // update tag
    await schemaTag.update(createdTag.id, { name: 'tag1 updated' });

    // delete tag
    await schemaTag.delete(createdTag.id);
  });

  it('should use config object as event', async () => {
    const schemaTag = fs.schema('tag');
    const createdTag1 = await schemaTag.create<Tag>({ name: 'tag1' });
    const createdTag2 = await schemaTag.create<Tag>({ name: 'tag2' });

    const onTagUpdate = (tags: Tag[], event: EventType) => {
      expect(event).toBe('update');
      expect(tags.length).toBe(1);
      expect(tags[0].id).toBeDefined();
      expect(tags[0].name).toBeDefined();
      expect(Object.keys(tags[0])).toEqual(['id', 'name']);
      schemaTag.off(onTagUpdate);
    };

    schemaTag.on<Tag>({
      event: 'update',
      select: 'id,name',
      filter: {
        name: { $eq: 'tag1 updated' } as FilterObject,
      },
    }, onTagUpdate);

    await schemaTag.update(createdTag1.id, { name: 'tag1 updated' });
    await schemaTag.update(createdTag2.id, { name: 'tag2 updated' });
    await schemaTag.delete(createdTag1.id);
    await schemaTag.delete(createdTag2.id);
  });

  it('should receive tag update event with id', async () => {
    const schemaTag = fs.schema('tag');
    const createdTag = await schemaTag.create<Tag>({ name: 'tag1' });
    const onTagUpdate = (tag: Tag, event: EventType) => {
      expect(event).toBe('update');
      expect(tag.name).toBe('tag1 updated');
      schemaTag.off(onTagUpdate);
    };
    schemaTag.on<Tag>('update', createdTag.id, onTagUpdate);
    await schemaTag.update(createdTag.id, { name: 'tag1 updated' });
    await schemaTag.delete(createdTag.id);
  });

  it('should receive tag update with id in config object', async () => {
    let onTagUpdateCalled = false;
    const schemaTag = fs.schema('tag');
    const createdTag = await schemaTag.create<Tag>({ name: 'tag1' });
    const onTagUpdate = (tag: Tag, event: EventType) => {
      onTagUpdateCalled = true;
      expect(tag.name).toBe('tag1 updated');
      expect(event).toBe('update');
      schemaTag.off(onTagUpdate);
    };
    schemaTag.on<Tag>({
      event: 'update',
      id: createdTag.id,
    }, onTagUpdate);
    await schemaTag.update(createdTag.id, { name: 'tag1 updated' });
    await schemaTag.delete(createdTag.id);
    expect(onTagUpdateCalled).toBe(true);
  });

  it('should fire once with single item update', async () => {
    let onTagUpdateCalled = 0;
    const schemaTag = fs.schema('tag');
    const createdTag1 = await schemaTag.create<Tag>({ name: 'tag1' });
    const createdTag2 = await schemaTag.create<Tag>({ name: 'tag2' });

    const onTagUpdate = (tag: Tag, event: EventType) => {
      onTagUpdateCalled++;
      expect(event).toBe('update');
      expect(tag.name).toEqual('tag2 updated');
    };
    schemaTag.on<Tag>('update', createdTag2.id, onTagUpdate);

    await schemaTag.update(createdTag1.id, { name: 'tag1 updated' });
    await schemaTag.update(createdTag2.id, { name: 'tag2 updated' });

    await schemaTag.delete(createdTag1.id);
    await schemaTag.delete(createdTag2.id);

    await sleep(500);
    expect(onTagUpdateCalled).toBe(1);
  });

  it('should fire once with single item delete', async () => {
    let onTagDeleteCalled = 0;
    const schemaTag = fs.schema('tag');
    const createdTag1 = await schemaTag.create<Tag>({ name: 'tag1' });
    const createdTag2 = await schemaTag.create<Tag>({ name: 'tag2' });

    const onTagDelete = (tag: Tag, event: EventType) => {
      onTagDeleteCalled++;
      expect(event).toBe('delete');
      expect(tag.name).toEqual('tag2');
    };
    schemaTag.on<Tag>('delete', createdTag2.id, onTagDelete);

    await schemaTag.delete(createdTag1.id);
    await schemaTag.delete(createdTag2.id);

    await sleep(500);
    expect(onTagDeleteCalled).toBe(1);
  });

  it('should fire once with config.once', async () => {
    let onTagCreateCalled = 0;
    const schemaTag = fs.schema('tag');
    const onTagCreate = (tag: Tag, event: EventType) => {
      onTagCreateCalled++;
      expect(event).toBe('create');
      expect(tag.name).toBeDefined();
    };
    schemaTag.on<Tag>({
      event: 'create',
      once: true,
    }, onTagCreate);
    const createdTag1 = await schemaTag.create<Tag>({ name: 'tag1' });
    const createdTag2 = await schemaTag.create<Tag>({ name: 'tag2' });
    await schemaTag.delete(createdTag1.id);
    await schemaTag.delete(createdTag2.id);

    await sleep(500);
    expect(onTagCreateCalled).toBe(1);
  });
});
