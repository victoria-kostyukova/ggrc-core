/*
  Copyright (C) 2020 Google Inc.
  Licensed under http://www.apache.org/licenses/LICENSE-2.0 <see LICENSE file>
*/

import canList from 'can-list';
describe('CanJS extensions', () => {
  describe('sort extension', () => {
    it('should sort strings. Do not use predicate', () => {
      let list = new canList(['b', 'd', 'a', 'c']);
      let cid = list._cid;

      let sortedList = list.sort();
      expect(sortedList._cid).toEqual(cid);
      expect(sortedList.length).toBe(4);
      expect(sortedList[0]).toEqual('a');
      expect(sortedList[1]).toEqual('b');
      expect(sortedList[2]).toEqual('c');
      expect(sortedList[3]).toEqual('d');
    });

    it('should sort DESC strings. Use predicate', () => {
      let list = new canList(['b', 'd', 'a', 'c']);
      let cid = list._cid;
      let predicate = (a, b) => a < b ? 1 : -1;

      let sortedList = list.sort(predicate);
      expect(sortedList._cid).toEqual(cid);
      expect(sortedList.length).toBe(4);
      expect(sortedList[0]).toEqual('d');
      expect(sortedList[1]).toEqual('c');
      expect(sortedList[2]).toEqual('b');
      expect(sortedList[3]).toEqual('a');
    });

    it('should sort ASC objects', () => {
      let list = new canList([
        {
          id: 3,
        }, {
          id: 5,
        }, {
          id: 1,
        },
      ]);

      let cid = list._cid;
      let predicate = (a, b) => a.id > b.id ? 1 : -1;

      let sortedList = list.sort(predicate);
      expect(sortedList._cid).toEqual(cid);
      expect(sortedList.length).toBe(3);
      expect(sortedList[0].id).toEqual(1);
      expect(sortedList[1].id).toEqual(3);
      expect(sortedList[2].id).toEqual(5);
    });

    it('should sort DESC objects', () => {
      let list = new canList([
        {
          id: 3,
        }, {
          id: 5,
        }, {
          id: 1,
        },
      ]);

      let cid = list._cid;
      let predicate = (a, b) => a.id < b.id ? 1 : -1;

      let sortedList = list.sort(predicate);
      expect(sortedList._cid).toEqual(cid);
      expect(sortedList.length).toBe(3);
      expect(sortedList[0].id).toEqual(5);
      expect(sortedList[1].id).toEqual(3);
      expect(sortedList[2].id).toEqual(1);
    });
  });
});
