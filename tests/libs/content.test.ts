import { FastSchema, FilterObject } from '@/index';
import { cleanup, createTestFs, Tag, userSchemas, waitServerReady } from '@tests/utils';
import { afterAll, beforeAll, describe, expect, it } from 'vitest';

interface FileType extends Blob {
  readonly lastModified: number;
  readonly name: string;
  readonly webkitRelativePath: string;
}

let FileObj: {
  new (fileBits: BlobPart[], fileName: string, options?: FilePropertyBag): File;
  prototype: File;
};

if (typeof File === 'undefined') {
  const stdFile = require('@web-std/file');
  FileObj = stdFile.File;
} else {
  FileObj = File;
}

let fs: FastSchema;
afterAll(async () => cleanup(fs));
beforeAll(async () => {
  fs = await createTestFs();
  await waitServerReady(fs);
  await fs.schemas().create(userSchemas['tag']);
});

describe.sequential('Content tests', async () => {
  it('should create, update, get and delete tags', async () => {
    const tags: Tag[] = [];
    for (let i = 0; i < 20; i++) {
      const name = `tag ${i + 1}`;
      const description = `description ${i + 1}`;
      tags.push(await fs.schema('tag').create<Tag>({ name, description }));
    }

    expect(tags[0]).toBeDefined();
    expect(tags[0].name).toBe('tag 1');

    const updated = await fs.schema('tag').update(tags[0].id, { description: 'updated desc tag 1' });
    expect(updated).toBeDefined();
    expect(updated?.description).toBe('updated desc tag 1');

    const allTags = await fs.schema('tag').get<Tag>();
    expect(allTags).toBeDefined();
    expect(allTags.items.length).toBe(10); // default limit is 10

    const filteredTags = await fs.schema('tag').get<Tag>({
      limit: 5,
      page: 2,
      sort: '-id',
      filter: {
        name: { $neq: 'tag 1' } as FilterObject,
      },
    });

    expect(filteredTags).toBeDefined();
    expect(filteredTags.items.length).toBe(5);
    expect(filteredTags.current_page).toBe(2);
    expect(filteredTags.per_page).toBe(5);
    expect(filteredTags.total).toBeDefined();
    expect(filteredTags.last_page).toBeDefined();

    const lastTagId = tags[tags.length - 1].id;
    const lastTag = await fs.schema('tag').get<Tag>(lastTagId);
    expect(lastTag).toBeDefined();
    expect(lastTag.id).toBe(lastTagId);
    expect(await fs.schema('tag').get<Tag>(`${lastTagId}`)).toStrictEqual(lastTag);

    for (const tag of tags) {
      await fs.schema('tag').delete(tag.id);
    }
  });

  it('should successfully upload a file', async () => {
    const files: FileType[] = [];
    for (let i = 0; i < 5; i++) {
      files.push(new FileObj([`test content ${i + 1}`], `test${i + 1}.txt`));
    }

    const result = await fs.file().upload(files);
    expect(result).toBeDefined();
    expect(result.success.length).toBe(5);
    expect(result.success[0].url).toBeDefined();

    // get list of files
    const filteredFiles = await fs.schema("file").get({
      limit: 5,
      page: 1,
      sort: '-id',
    });
    expect(filteredFiles).toBeDefined();
    expect(filteredFiles?.items.length).toBe(5);

    // get a single file
    const singleFile = await fs.schema("file").get(result.success[0].id);
    expect(singleFile).toBeDefined();
    expect(singleFile?.id).toBe(result.success[0].id);
  });
});
