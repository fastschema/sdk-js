'use client';
import { EventType, FastSchema } from 'fastschema';
import { useEffect, useState } from 'react';
import { Blog, createFs, Tag } from '../lib';

export default function Home() {
  const [fs, setFs] = useState<FastSchema>();
  const [tags, setTags] = useState<Tag[]>([]);
  const [blogs, setBlogs] = useState<Blog[]>([]);
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
      <h2>Tags List ({tags.length})</h2>
      <ul className='content-list scrollbar tags'>
        {tags.map(tag => <li key={tag.id}>
          <h3 role='none'>{tag.name}</h3>
        </li>)}
      </ul>
      <div className='hr' />
      <h2>Blogs List ({blogs.length})</h2>
      <ul className='content-list scrollbar blogs'>
        {blogs.map(blog => <li key={blog.id} className='flash'>
          <h3 role='none'>{blog.name}</h3>
        </li>)}
      </ul>
    </div>
  </main>
}
