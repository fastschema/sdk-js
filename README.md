# Javascript SDK for FastSchema

**Document**

https://fastschema.com/docs/sdk-js

**Installation**

```bash
npm install fastschema
```

## Login and initialize

The initialization must be done before any other operation.

```typescript
import { FastSchema } from 'fastschema';

// Create a new instance of FastSchema
const fs = new FastSchema('https://localhost:8000');

// Login
await fs.auth().login({
  login: 'admin',
  password: '123',
});

// Initialize: This must be called before any other operation
await fs.init();
```

## Schema operations

### Create schema

```typescript
await fs.schemas().create({
  name: 'tag',
  namespace: 'tags',
  label_field: 'name',
  fields: [
    {
      name: 'name',
      label: 'Name',
      type: 'string',
      sortable: true,
      filterable: true,
      unique: false,
    },
    {
      name: 'description',
      label: 'Description',
      type: 'string',
      optional: true,
    },
  ],
});
```

### Get schema

This operation will throw an error if the schema does not exist.

```typescript
const schemaTag = fs.schema('tag');
```

### Update a schema

```typescript
await fs.schemas().update('tag', {
  schema: {
    // Same as create
  },
  rename_fields: {
    // Rename fields
  },
  rename_tables: {
    // Rename tables
  },
});
```

### Delete a schema

```typescript
await fs.schemas().delete('tag');
```

## Content operations

## Get content

```typescript
fs.schema('tag').get<Tag>(params);
```

`params` can be one of the following:

- `id: number | string`: ID of the content

- A filter object that represents the following interface:

  ```typescript
  interface ListOptions {
    filter?: Filter;
    page?: number;
    limit?: number;
    sort?: string;
    select?: string;
  }
  ```

  Refer to the [Filter documentation](https://fastschema.com/docs/headless-cms/list-records.html#filter) for more information about the filter object.

### Create content

```typescript
interface Tag {
  name: string;
  description: string;
}

const createdTag = await fs.schema('tag').create<Tag>({
  name: 'Tag 01',
  description: 'A description',
});
```

### Update content

```typescript
const updated = await fs.schema('tag').update(id, {
  description: 'updated desc tag 1',
});
```

### Delete content

```typescript
await fs.schema('tag').delete(id);
```

### Upload files

```typescript
const files: File[] = [];
for (let i = 0; i < 5; i++) {
  files.push(new File([`test ${i}`], `test${i}.txt`));
}

const result = await fs.file().upload(files);
```

## Realtime

FastSchema provides a way to listen to events in real-time.
- `create`: When a new record is created
- `update`: When a record is updated
- `delete`: When a record is deleted
- `*`: Listen to all events

```typescript
const schemaTag = fs.schema('tag');

const cb1 = (data: T, event: EventType, error: Error) => {
  console.log('Event:', event, 'Data:', data, 'Error:', error);
};

const cb2 = (data: T[], event: EventType, error: Error) => {
  console.log('Event:', event, 'Data:', data, 'Error:', error);
};

const cb3 = (data: T | T[], event: EventType, error: Error) => {
  console.log('Event:', event, 'Data:', data, 'Error:', error);
};

schemaTag.on('create', cb1);
schemaTag.on('update', cb2);
schemaTag.on('delete', cb2);
schemaTag.on('*', cb3);
```

You can also listen to events for a specific record.

```typescript
schemaTag.on('create', id, cb1);
schemaTag.on('update', id, cb1);
schemaTag.on('delete', id, cb1);
```

or use the configuration events:

```typescript
schemaTag.on({
  id?: number;
  once?: boolean;
  select?: string;
  filter?: Filter;
}, cb1);
```

The configuration object can have the following properties:

- `id`: ID of the record
- `once`: If true, the callback will be called only once
- `select`: Fields to select, separated by commas. This is useful when you want to select only specific fields to reduce the payload size.
- `filter`: Filter object, used to filter the records that will trigger the event.
