'use client';
import { EventType, FastSchema } from 'fastschema';
import { useEffect, useState } from 'react';
import { CircleX } from './icons';
import { Blog, createFs, defaultBlogData, defaultTagData, Tag } from './lib';

export default function Home() {
  const [fs, setFs] = useState<FastSchema>();
  const [tags, setTags] = useState<Tag[]>([]);
  const [blogs, setBlogs] = useState<Blog[]>([]);
  const [editingTag, setEditingTag] = useState<Partial<Tag>>(defaultTagData);
  const [editingBlog, setEditingBlog] = useState<Partial<Blog>>(defaultBlogData);

  const syncTags = (data: Tag | Tag[], event: EventType) => {
    (event === 'create') && setTags(tags => [data as Tag, ...tags]);
    (event === 'update') && setTags(currentTags => {
      const index = currentTags.findIndex(t => t.id === (data as Tag[])[0].id);
      currentTags[index] = (data as Tag[])[0];
      return [...currentTags];
    });

    (event === 'delete') && setTags(currentTags => {
      const index = currentTags.findIndex(t => t.id === (data as Tag[])[0].id);
      currentTags.splice(index, 1);
      return [...currentTags];
    });
  }

  const syncBlogs = (data: Blog | Blog[], event: EventType) => {
    (event === 'create') && setBlogs(blogs => [data as Blog, ...blogs]);
    (event === 'update') && setBlogs(currentBlogs => {
      const index = currentBlogs.findIndex(p => p.id === (data as Blog[])[0].id);
      currentBlogs[index] = (data as Blog[])[0];
      return [...currentBlogs];
    });

    (event === 'delete') && setBlogs(currentBlogs => {
      const index = currentBlogs.findIndex(p => p.id === (data as Blog[])[0].id);
      currentBlogs.splice(index, 1);
      return [...currentBlogs];
    });
  }

  const saveTag = async () => {
    if (editingTag.id) {
      await fs?.schema('tag').update(editingTag.id, {
        name: editingTag.name,
        description: editingTag.description,
      });
    } else {
      await fs?.schema('tag').create(editingTag);
    }
    setEditingTag(defaultTagData);
  }

  const saveBlog = async () => {
    if (editingBlog.id) {
      await fs?.schema('blog').update(editingBlog.id, {
        name: editingBlog.name,
        content: editingBlog.content,
        tags: editingBlog.tags?.map(tag => ({ id: tag.id })),
      });
    } else {
      await fs?.schema('blog').create({
        ...editingBlog,
        tags: editingBlog.tags?.map(tag => ({ id: tag.id })),
      });
    }
    setEditingBlog(defaultBlogData);
  }

  useEffect(() => {
    (async () => {
      const fs = await createFs();
      setFs(fs);
      const tagsList = await fs.schema('tag').get<Tag>();
      setTags(tagsList?.items || []);

      const blogsList = await fs.schema('blog').get<Blog>({
        select: 'id,name,tags',
      });
      setBlogs(blogsList?.items || []);

      fs.schema('tag').on<Tag>('*', syncTags);
      fs.schema('blog').on<Blog>({
        event: '*',
        select: 'id,name,tags',
      }, syncBlogs);
    })();
  }, []);

  if (!fs) {
    return <main className='loading'></main>;
  }

  return <main>
    <div className='container'>
      <TagManager
        fs={fs}
        editingTag={editingTag}
        setEditingTag={setEditingTag}
        tags={tags}
        saveTag={saveTag}
      />
      <div className='hr' />
      <BlogManager
        fs={fs}
        editingBlog={editingBlog}
        setEditingBlog={setEditingBlog}
        tags={tags}
        blogs={blogs}
        saveBlog={saveBlog}
      />
    </div>
  </main>
}

const TagManager = ({
  fs,
  editingTag,
  setEditingTag,
  tags,
  saveTag,
}: {
  fs: FastSchema,
  editingTag: Partial<Tag>,
  setEditingTag: (tag: Partial<Tag>) => void,
  tags: Tag[],
  saveTag: () => void,
}) => {
  return <div className='row'>
    <div className='column'>
      <h2>Create tag</h2>
      <form>
        <input type='hidden' name='id' value={editingTag?.id} />
        <div>
          <label htmlFor='name'>Tag Name</label>
          <input
            id='name'
            type='text'
            name='name'
            placeholder='Name'
            value={editingTag?.name}
            onChange={(e) => {
              setEditingTag({
                ...editingTag,
                name: e.target.value,
              });
            }}
          />
        </div>
        <div>
          <label htmlFor='description'>Tag Description</label>
          <input
            id='description'
            type='text'
            name='description'
            placeholder='Description'
            value={editingTag?.description}
            onChange={(e) => {
              setEditingTag({
                ...editingTag,
                description: e.target.value,
              });
            }}
          />
        </div>
        <button type='button' onClick={saveTag}>Save</button>
      </form>
    </div>
    <div className='column'>
      <div className='green-column'>
        <h2>Tags List ({tags.length})</h2>
        <ul className='content-list scrollbar tags'>
          {tags.map(tag => <li key={tag.id}>
            <h3 role='none' onClick={() => setEditingTag(tag)}>{tag.name}</h3>
            <button className='delete-btn' onClick={() => {
              if (window.confirm('Are you sure you want to delete this tag?')) {
                fs.schema('tag').delete(tag.id);
              }
            }}>
              <CircleX />
            </button>
          </li>)}
        </ul>
      </div>
    </div>
  </div>;
}

const BlogManager = ({
  fs,
  editingBlog,
  setEditingBlog,
  tags,
  blogs,
  saveBlog,
}: {
  fs: FastSchema,
  editingBlog: Partial<Blog>,
  setEditingBlog: (blog: Partial<Blog>) => void,
  tags: Tag[],
  blogs: Blog[],
  saveBlog: () => void,
}) => {
  return <div className='row'>
    <div className='column'>
      <h2>Create Blog</h2>
      <form>
        <input type='hidden' name='id' value={editingBlog?.id} />
        <div>
          <label htmlFor='name'>Blog Name</label>
          <input
            id='name'
            type='text'
            name='name'
            placeholder='Name'
            value={editingBlog?.name}
            onChange={(e) => {
              setEditingBlog({
                ...editingBlog,
                name: e.target.value,
              });
            }}
          />
        </div>
        <div>
          <label htmlFor='tags'>Blog Tags</label>
          <select
            id='tags'
            name='tags'
            className='scrollbar'
            multiple
            style={{ height: '95px' }}
            onChange={(e) => {
              const selectedTags = Array.from(e.target.selectedOptions).map(option => {
                const tagId = parseInt(option.value, 10);
                return tags.find(tag => tag.id === tagId);
              }).filter(t => t) as Tag[];
              setEditingBlog({
                ...editingBlog,
                tags: selectedTags,
              });
            }}
          >
            {tags.map(tag => <option
              key={tag.id}
              value={tag.id.toString()}
              selected={editingBlog?.tags?.some(t => t.id === tag.id)}
            >{tag.name}</option>)}
          </select>
        </div>
        <div>
          <label htmlFor='content'>Blog Content</label>
          <textarea
            id='content'
            name='content'
            placeholder='Content'
            defaultValue={editingBlog?.content}
            onChange={(e) => {
              setEditingBlog({
                ...editingBlog,
                content: e.target.value,
              });
            }}
          ></textarea>
        </div>
        <button type='button' onClick={saveBlog}>Save</button>
      </form>
    </div>
    <div className='column'>
      <div className='green-column'>
        <h2>Blogs List ({blogs.length})</h2>
        <ul className='content-list scrollbar blogs'>
          {blogs.map(blog => <li key={blog.id} className='flash'>
            <h3 role='none' onClick={() => setEditingBlog(blog)}>{blog.name}</h3>
            <button className='delete-btn' onClick={() => {
              if (window.confirm('Are you sure you want to delete this blog?')) {
                fs.schema('blog').delete(blog.id);
              }
            }}>
              <CircleX />
            </button>
          </li>)}
        </ul>
      </div>
    </div>
  </div>;
}
