/*
    Copyright (C) 2020 Google Inc.
    Licensed under http://www.apache.org/licenses/LICENSE-2.0 <see LICENSE file>
*/

import * as LocalStorage from '../../utils/local-storage-utils';

describe('local-storage utils', () => {
  let model1 = {id: 1, foo: 'bar'};
  let model2 = {id: 2, foo: 'baz'};

  describe('get() method', () => {
    beforeEach(() => {
      window.localStorage.setItem('spec_model:ids', '[1, 2]');
      window.localStorage.setItem('spec_model:1', JSON.stringify(model1));
      window.localStorage.setItem('spec_model:2', JSON.stringify(model2));
    });

    afterEach(() => {
      window.localStorage.removeItem('spec_model:ids');
      window.localStorage.removeItem('spec_model:1');
      window.localStorage.removeItem('spec_model:2');
    });

    it('should return all saved objects', () => {
      const list = LocalStorage.get('spec_model');

      expect(list.length).toBe(2);
      expect(list[0]).toEqual(model1);
      expect(list[1]).toEqual(model2);
    });

    it('should return an empty list when there is no saved objects', () => {
      const list = LocalStorage.get('any_key');

      expect(list.length).toBe(0);
    });
  });

  describe('create() method', () => {
    it('should save an object when the array of IDs is empty', () => {
      const item = LocalStorage.create('spec_model', {foo: model1.foo});

      expect(item.id).toBe(1);
      expect(item.foo).toBe(model1.foo);

      let savedItem = JSON.parse(window.localStorage.getItem('spec_model:1'));
      expect(savedItem.id).toBe(1);
      expect(savedItem.foo).toBe(model1.foo);

      let ids = JSON.parse(window.localStorage.getItem('spec_model:ids'));
      expect(ids.length).toBe(1);
      expect(ids[0]).toBe(1);

      window.localStorage.removeItem('spec_model:ids');
      window.localStorage.removeItem('spec_model:1');
    });

    it('should save an object when the array of IDs is not empty', () => {
      window.localStorage.setItem('spec_model:ids', '[1, 3]');
      window.localStorage.setItem('spec_model:1', JSON.stringify(model1));
      window.localStorage.setItem('spec_model:3', JSON.stringify(model2));

      const item = LocalStorage.create('spec_model', {foo: model1.foo});

      expect(item.id).toBe(4);
      expect(item.foo).toEqual(model1.foo);

      let savedItem = JSON.parse(window.localStorage.getItem('spec_model:4'));
      expect(savedItem.id).toBe(4);
      expect(savedItem.foo).toBe(model1.foo);

      let ids = JSON.parse(window.localStorage.getItem('spec_model:ids'));

      expect(ids.length).toBe(3);
      expect(ids).toEqual([1, 3, 4]);

      window.localStorage.removeItem('spec_model:ids');
      window.localStorage.removeItem('spec_model:1');
      window.localStorage.removeItem('spec_model:3');
      window.localStorage.removeItem('spec_model:4');
    });
  });

  describe('update() method', () => {
    it('should update object by id', () => {
      window.localStorage.setItem('spec_model:ids', '[1, 3]');
      window.localStorage.setItem('spec_model:1', JSON.stringify(model1));
      window.localStorage.setItem('spec_model:3', JSON.stringify(model2));

      const model = {id: 1, foo: 'zxc'};
      LocalStorage.update('spec_model', model);

      let savedItem = JSON.parse(window.localStorage.getItem('spec_model:1'));
      expect(savedItem).toEqual(model);
    });
  });

  describe('remove() method', () => {
    it('should remove model instance by id', () => {
      window.localStorage.setItem('spec_model:ids', '[1, 3]');
      window.localStorage.setItem('spec_model:1', JSON.stringify(model1));
      window.localStorage.setItem('spec_model:3', JSON.stringify(model2));

      LocalStorage.remove('spec_model', model1.id);

      let item = JSON.parse(window.localStorage.getItem('spec_model:1'));
      expect(item).toBeNull();

      let ids = JSON.parse(window.localStorage.getItem('spec_model:ids'));

      expect(ids.length).toBe(1);
      expect(ids[0]).toBe(3);

      window.localStorage.removeItem('spec_model:ids');
      window.localStorage.removeItem('spec_model:1');
      window.localStorage.removeItem('spec_model:3');
    });
  });

  describe('clear() method', () => {
    it('should clear all local storage when specific key is not passed', () => {
      spyOn(window.localStorage, 'clear');

      LocalStorage.clear();

      expect(window.localStorage.clear).toHaveBeenCalled();
    });

    it('should remove all data for specific key', () => {
      window.localStorage.setItem('spec_model:ids', '[1, 3]');
      window.localStorage.setItem('spec_model:1', JSON.stringify(model1));
      window.localStorage.setItem('spec_model:3', JSON.stringify(model2));

      LocalStorage.clear('spec_model');

      expect(window.localStorage.getItem('spec_model:ids')).toBeNull();
      expect(window.localStorage.getItem('spec_model:1')).toBeNull();
      expect(window.localStorage.getItem('spec_model:3')).toBeNull();
    });
  });
});
