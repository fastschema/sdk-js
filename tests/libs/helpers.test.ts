import { describe, expect, it } from 'vitest';
import { FilterObject, ListOptions, getContentFilterQuery, getErrorMessage, RequestError, sortObject, createObjectId } from '@/index';

describe('Helper tests', async () => {
  it('should return the error message when given a RequestError object', () => {
    const error = new RequestError('Internal Server Error');
    const errorMessage = getErrorMessage(error);
    expect(errorMessage).toBe('Internal Server Error');
  });

  it('should return the default message when given a string', () => {
    const errorMessage = getErrorMessage('An error occurred', 'Default Message');
    expect(errorMessage).toBe('An error occurred');
  });

  it('should return the correct query string when given filter parameters', () => {
    const params: ListOptions = {
      limit: 10,
      page: 2,
      sort: 'name',
      select: 'id,name',
      filter: {
        category: 'electronics',
        price: { $gte: 100 } as FilterObject,
      },
    };
    const queryString = getContentFilterQuery(params);
    const expectedQueryString = 'limit=10&page=2&sort=name&select=id%2Cname&filter=%7B%22category%22%3A%22electronics%22%2C%22price%22%3A%7B%22%24gte%22%3A100%7D%7D';
    expect(queryString).toBe(expectedQueryString);
  });

  it('should return an empty query string when no filter parameters are provided', () => {
    const queryString = getContentFilterQuery();
    expect(queryString).toBe('');
  });

  it('should sort an object alphabetically', () => {
    const testCases = [
      { input: { b: 2, a: 1 }, expected: { a: 1, b: 2 } },
      { input: { b: { y: 2, x: 1 }, a: { z: 3, y: 2 } }, expected: { a: { y: 2, z: 3 }, b: { x: 1, y: 2 } } },
      { input: { a: [3, 1, 2] }, expected: { a: [1, 2, 3] } },
      { input: { a: [{ y: 2, x: 1 }, { y: 1, x: 2 }] }, expected: { a: [{ x: 1, y: 2 }, { x: 2, y: 1 }] } },
      {
        input: {
          b: 'bbb',
          a: 'aaa',
          ks: [{ x: 'x1', y: 'y1' }, { x: 'x2', y: 'y2' }],
          cs: [{ y: 'y2', x: 'x2' }, { x: 'x1', y: 'y1' }],
          ps: [1, 9, 5, 8, 2],
          ms: [{ x: 'x2', y: 'y2' }, 9, { x: 'x1', y: 'y1' }, 5],
        },
        expected: {
          a: 'aaa',
          b: 'bbb',
          cs: [
            { x: 'x1', y: 'y1' },
            { x: 'x2', y: 'y2' },
          ],
          ks: [
            { x: 'x1', y: 'y1' },
            { x: 'x2', y: 'y2' },
          ],
          ms: [
            { x: 'x1', y: 'y1' },
            { x: 'x2', y: 'y2' },
            5,
            9,
          ],
          ps: [1, 2, 5, 8, 9],
        }
      },
      { input: {}, expected: {} },
      { input: { a: [] }, expected: { a: [] } },
      {
        input: {
          a: [
            { y: 2, x: 1, nested: { b: 2, a: 1 } },
            { y: 1, x: 2, nested: { d: 4, c: 3 } }
          ]
        },
        expected: {
          a: [
            { nested: { a: 1, b: 2 }, x: 1, y: 2 },
            { nested: { c: 3, d: 4 }, x: 2, y: 1 }
          ]
        }
      },
      {
        input: {
          a: [
            3,
            { b: 2, a: 1 },
            1,
            { d: 4, c: 3 },
            "world",
            false,
            "hello",
            true,
          ]
        },
        expected: {
          a: [
            "hello",
            "world",
            { a: 1, b: 2 },
            { c: 3, d: 4 },
            1,
            3,
            false,
            true,
          ]
        }
      }
    ];

    testCases.forEach(({ input, expected }) => {
      const result = sortObject(input);
      expect(result).toEqual(expected);
    });
  });

  it('should create a unique object ID for a given object', () => {
    const testCases = [
      { input: { b: 2, a: 1 }, expected: '{"a":1,"b":2}' },
      { input: { b: { y: 2, x: 1 }, a: { z: 3, y: 2 } }, expected: '{"a":{"y":2,"z":3},"b":{"x":1,"y":2}}' },
      { input: { a: [3, 1, 2] }, expected: '{"a":[1,2,3]}' },
      { input: { a: [{ y: 2, x: 1 }, { y: 1, x: 2 }] }, expected: '{"a":[{"x":1,"y":2},{"x":2,"y":1}]}' },
      {
        input: {
          b: 'bbb',
          a: 'aaa',
          ks: [{ x: 'x1', y: 'y1' }, { x: 'x2', y: 'y2' }],
          cs: [{ y: 'y2', x: 'x2' }, { x: 'x1', y: 'y1' }],
          ps: [1, 9, 5, 8, 2],
          ms: [{ x: 'x2', y: 'y2' }, 9, { x: 'x1', y: 'y1' }, 5],
        },
        expected: '{"a":"aaa","b":"bbb","cs":[{"x":"x1","y":"y1"},{"x":"x2","y":"y2"}],"ks":[{"x":"x1","y":"y1"},{"x":"x2","y":"y2"}],"ms":[{"x":"x1","y":"y1"},{"x":"x2","y":"y2"},5,9],"ps":[1,2,5,8,9]}'
      },
      { input: {}, expected: '{}' },
      { input: { a: [] }, expected: '{"a":[]}' },
      {
        input: {
          a: [
            { y: 2, x: 1, nested: { b: 2, a: 1 } },
            { y: 1, x: 2, nested: { d: 4, c: 3 } }
          ]
        },
        expected: '{"a":[{"nested":{"a":1,"b":2},"x":1,"y":2},{"nested":{"c":3,"d":4},"x":2,"y":1}]}'
      },
      {
        input: {
          a: [
            3,
            { b: 2, a: 1 },
            1,
            { d: 4, c: 3 },
            "world",
            false,
            "hello",
            true,
          ]
        },
        expected: '{"a":["hello","world",{"a":1,"b":2},{"c":3,"d":4},1,3,false,true]}'
      }
    ];
    testCases.forEach(({ input, expected }) => {
      const result = createObjectId(input);
      expect(result).toBe(expected);
    });
  });
});
