/** @type {import('fastschema')} */
const { FastSchema } = require('fastschema');

const tagSchemaData = {
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
};

(async () => {
  const fs = new FastSchema('http://127.0.0.1:8000');
  await fs.auth().login({
    login: 'admin',
    password: '123',
  });
  await fs.init();

  await schemaOperators(fs);
  await fs.schemas().create(tagSchemaData);
  await contentOperators(fs);
  await uploadFiles(fs);
  await realtime(fs);
  await fs.schemas().delete('tag');
  process.exit(0);
})();


/**
 * @param {FastSchema} fs 
 */
const schemaOperators = async (fs) => {
  await fs.schemas().create(tagSchemaData);
  await fs.schemas().update('tag', {
    schema: {
      ...tagSchemaData,
      name: 'tag2',
    },
  });
  const tagSchema = fs.schema('tag2');
  await fs.schemas().delete(tagSchema.name());
}

/**
 * @param {FastSchema} fs 
 */
const contentOperators = async (fs) => {
  const createdTag = await fs.schema('tag').create({
    name: 'Tag 01',
    description: 'A description',
  });

  const updated = await fs.schema('tag').update(createdTag.id, {
    description: 'updated desc tag 1',
  });

  const tags = await fs.schema('tag').get();
  console.log(tags);

  await fs.schema('tag').delete(updated.id);
}

/**
 * @param {FastSchema} fs 
 */
const uploadFiles = async (fs) => {
  const files = [];
  for (let i = 0; i < 5; i++) {
    files.push(new File([`test ${i}`], `test${i}.txt`));
  }

  const result = await fs.file().upload(files);
  console.log(result);
}


/**
 * @param {FastSchema} fs 
 */
const realtime = async (fs) => {
  fs.schema('tag').on('create', (data) => {
    console.log('create event fired', data);
  });

  const createdTag = await fs.schema('tag').create({
    name: 'Tag 02',
    description: 'A description',
  });

  console.log('created tag', createdTag);
  await new Promise(resolve => setTimeout(resolve, 100));
}
