/*
    Copyright (C) 2018 Google Inc.
    Licensed under http://www.apache.org/licenses/LICENSE-2.0 <see LICENSE file>
*/

import * as DisplayPrefs from '../../utils/display-prefs-utils';
import * as LocalStorage from '../../utils/local-storage-utils';

describe('display-prefs-utils', () => {
  const localStorageKey = 'display_prefs';

  afterEach(() => {
    spyOn(LocalStorage, 'clear');
    DisplayPrefs.clearPreferences();
  });

  describe('getPreferences() method', () => {
    it('should create record in local storage if it not exists', () => {
      spyOn(LocalStorage, 'get').and.returnValue([]);
      spyOn(LocalStorage, 'create').and.returnValue({id: 1});

      DisplayPrefs.getTreeViewHeaders('model name');
      expect(LocalStorage.create).toHaveBeenCalledWith(localStorageKey, {});
    });

    it('should read preferences from local storage first time', () => {
      spyOn(LocalStorage, 'get').and.returnValue([{id: 1}]);
      spyOn(LocalStorage, 'create');

      DisplayPrefs.getTreeViewHeaders('model name');

      expect(LocalStorage.get).toHaveBeenCalled();
      expect(LocalStorage.create).not.toHaveBeenCalled();
    });

    it('should read preferences from cache next time', () => {
      spyOn(LocalStorage, 'get').and.returnValue([{id: 1}]);
      spyOn(LocalStorage, 'create');

      DisplayPrefs.getTreeViewHeaders('model name 1');
      DisplayPrefs.getTreeViewHeaders('model name 2');
      DisplayPrefs.getTreeViewHeaders('model name 3');

      expect(LocalStorage.get).toHaveBeenCalledTimes(1);
      expect(LocalStorage.create).not.toHaveBeenCalled();
    });
  });

  describe('getTreeViewHeaders() method', () => {
    it('should return empty array when there is no saved preferences', () => {
      let result = DisplayPrefs.getTreeViewHeaders('any model name');

      expect(result.serialize()).toEqual([]);
    });

    it('should return headers list from local storage', () => {
      let headers = ['item1', 'item2', 'item3'];
      let prefs = {
        id: 1,
        [DisplayPrefs.pageToken]: {
          tree_view_headers: {
            'any model name': {display_list: headers},
          },
        },
      };

      spyOn(LocalStorage, 'get').and.returnValue([prefs]);

      let result = DisplayPrefs.getTreeViewHeaders('any model name');
      expect(result.serialize()).toEqual(headers);
    });
  });

  describe('setTreeViewHeaders() method', () => {
    beforeEach(() => {
      let prefs = {
        id: 1,
        [DisplayPrefs.pageToken]: {
          tree_view_headers: {
            audit: {display_list: ['item1', 'item2']},
          },
        },
      };

      spyOn(LocalStorage, 'get').and.returnValue([prefs]);
      spyOn(LocalStorage, 'update');
    });

    it('should save headers for model', () => {
      let headers = ['item3', 'item4', 'item5'];
      DisplayPrefs.setTreeViewHeaders('control', headers);

      let updateArgs = LocalStorage.update.calls.argsFor(0);
      expect(updateArgs[0]).toBe(localStorageKey);
      expect(updateArgs[1]).toEqual(
        {
          id: 1,
          [DisplayPrefs.pageToken]: {
            tree_view_headers: {
              audit: {display_list: ['item1', 'item2']},
              control: {display_list: headers},
            },
          },
        });
    });

    it('should update headers for already saved model', () => {
      let headers = ['item3', 'item4', 'item5'];
      DisplayPrefs.setTreeViewHeaders('audit', headers);

      let updateArgs = LocalStorage.update.calls.argsFor(0);
      expect(updateArgs[0]).toBe(localStorageKey);
      expect(updateArgs[1]).toEqual(
        {
          id: 1,
          [DisplayPrefs.pageToken]: {
            tree_view_headers: {
              audit: {display_list: headers},
            },
          },
        });
    });
  });
});
