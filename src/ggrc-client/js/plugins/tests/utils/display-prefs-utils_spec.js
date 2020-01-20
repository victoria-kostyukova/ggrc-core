/*
    Copyright (C) 2020 Google Inc.
    Licensed under http://www.apache.org/licenses/LICENSE-2.0 <see LICENSE file>
*/

import * as DisplayPrefs from '../../utils/display-prefs-utils';
import * as LocalStorage from '../../utils/local-storage-utils';

describe('display-prefs-utils', () => {
  const localStorageKey = 'display_prefs';

  beforeEach(() => {
    spyOn(LocalStorage, 'clear');
    DisplayPrefs.clearPreferences();
  });

  afterEach(() => {
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

  describe('getTreeViewStates() method', () => {
    it('should return empty array when there is no saved preferences', () => {
      let result = DisplayPrefs.getTreeViewStates('any model name');

      expect(result.serialize()).toEqual([]);
    });

    it('should return states list from local storage', () => {
      let states = ['item1', 'item2', 'item3'];
      let prefs = {
        id: 1,
        tree_view_states: {
          'any model name': {status_list: states},
        },
      };

      spyOn(LocalStorage, 'get').and.returnValue([prefs]);

      let result = DisplayPrefs.getTreeViewStates('any model name');
      expect(result.serialize()).toEqual(states);
    });
  });

  describe('setTreeViewStates() method', () => {
    beforeEach(() => {
      let prefs = {
        id: 1,
        tree_view_states: {
          audit: {status_list: ['item1', 'item2']},
        },
      };

      spyOn(LocalStorage, 'get').and.returnValue([prefs]);
      spyOn(LocalStorage, 'update');
    });

    it('should save statuses for model', () => {
      let states = ['item3', 'item4', 'item5'];
      DisplayPrefs.setTreeViewStates('control', states);

      let updateArgs = LocalStorage.update.calls.argsFor(0);
      expect(updateArgs[0]).toBe(localStorageKey);
      expect(updateArgs[1]).toEqual(
        {
          id: 1,
          tree_view_states: {
            audit: {status_list: ['item1', 'item2']},
            control: {status_list: states},
          },
        });
    });

    it('should update statuses for already saved model', () => {
      let states = ['item3', 'item4', 'item5'];
      DisplayPrefs.setTreeViewStates('audit', states);

      let updateArgs = LocalStorage.update.calls.argsFor(0);
      expect(updateArgs[0]).toBe(localStorageKey);
      expect(updateArgs[1]).toEqual(
        {
          id: 1,
          tree_view_states: {
            audit: {status_list: states},
          },
        });
    });
  });

  describe('getModalState() method', () => {
    it('should return null when there is no saved preferences', () => {
      let result = DisplayPrefs.getModalState('any model name');

      expect(result).toBeNull();
    });

    it('should return state from local storage', () => {
      let state = {};
      let prefs = {
        id: 1,
        modal_state: {
          'any model name': {display_state: state},
        },
      };

      spyOn(LocalStorage, 'get').and.returnValue([prefs]);

      let result = DisplayPrefs.getModalState('any model name');
      expect(result.serialize()).toEqual(state);
    });
  });

  describe('setModalState() method', () => {
    beforeEach(() => {
      let prefs = {
        id: 1,
        modal_state: {
          audit: {display_state: {prop: 111}},
        },
      };

      spyOn(LocalStorage, 'get').and.returnValue([prefs]);
      spyOn(LocalStorage, 'update');
    });

    it('should save modal state for model', () => {
      let state = {prop: 222};
      DisplayPrefs.setModalState('control', state);

      let updateArgs = LocalStorage.update.calls.argsFor(0);
      expect(updateArgs[0]).toBe(localStorageKey);
      expect(updateArgs[1]).toEqual(
        {
          id: 1,
          modal_state: {
            audit: {display_state: {prop: 111}},
            control: {display_state: state},
          },
        });
    });

    it('should update modal state for already saved model', () => {
      let state = {prop: 222};
      DisplayPrefs.setModalState('audit', state);

      let updateArgs = LocalStorage.update.calls.argsFor(0);
      expect(updateArgs[0]).toBe(localStorageKey);
      expect(updateArgs[1]).toEqual(
        {
          id: 1,
          modal_state: {
            audit: {display_state: state},
          },
        });
    });
  });

  describe('getModalState() method', () => {
    it('should return null when there is no saved preferences', () => {
      let result = DisplayPrefs.getModalState('any model name');

      expect(result).toBeNull();
    });

    it('should return state from local storage', () => {
      let state = {};
      let prefs = {
        id: 1,
        modal_state: {
          'any model name': {display_state: state},
        },
      };

      spyOn(LocalStorage, 'get').and.returnValue([prefs]);

      let result = DisplayPrefs.getModalState('any model name');
      expect(result.serialize()).toEqual(state);
    });
  });

  describe('setModalState() method', () => {
    beforeEach(() => {
      let prefs = {
        id: 1,
        modal_state: {
          audit: {display_state: {prop: 111}},
        },
      };

      spyOn(LocalStorage, 'get').and.returnValue([prefs]);
      spyOn(LocalStorage, 'update');
    });

    it('should save modal state for model', () => {
      let state = {prop: 222};
      DisplayPrefs.setModalState('control', state);

      let updateArgs = LocalStorage.update.calls.argsFor(0);
      expect(updateArgs[0]).toBe(localStorageKey);
      expect(updateArgs[1]).toEqual(
        {
          id: 1,
          modal_state: {
            audit: {display_state: {prop: 111}},
            control: {display_state: state},
          },
        });
    });

    it('should update modal state for already saved model', () => {
      let state = {prop: 222};
      DisplayPrefs.setModalState('audit', state);

      let updateArgs = LocalStorage.update.calls.argsFor(0);
      expect(updateArgs[0]).toBe(localStorageKey);
      expect(updateArgs[1]).toEqual(
        {
          id: 1,
          modal_state: {
            audit: {display_state: state},
          },
        });
    });
  });

  describe('getChildTreeDisplayList() method', () => {
    it('should return null when there is no saved preferences', () => {
      let result = DisplayPrefs.getChildTreeDisplayList('any model name');

      expect(result).toBeNull();
    });

    it('should return display list from local storage', () => {
      let displayList = ['item1', 'item2'];
      let prefs = {
        id: 1,
        tree_view: {
          child_tree_display_list: {
            'any model name': {display_list: displayList},
          },
        },
      };

      spyOn(LocalStorage, 'get').and.returnValue([prefs]);

      let result = DisplayPrefs.getChildTreeDisplayList('any model name');
      expect(result.serialize()).toEqual(displayList);
    });
  });

  describe('setChildTreeDisplayList() method', () => {
    beforeEach(() => {
      let prefs = {
        id: 1,
        tree_view: {
          child_tree_display_list: {
            audit: {display_list: ['item1', 'item2']},
          },
        },
      };

      spyOn(LocalStorage, 'get').and.returnValue([prefs]);
      spyOn(LocalStorage, 'update');
    });

    it('should save modal state for model', () => {
      let displayList = ['item3', 'item4'];
      DisplayPrefs.setChildTreeDisplayList('control', displayList);

      let updateArgs = LocalStorage.update.calls.argsFor(0);
      expect(updateArgs[0]).toBe(localStorageKey);
      expect(updateArgs[1]).toEqual(
        {
          id: 1,
          tree_view: {
            child_tree_display_list: {
              audit: {display_list: ['item1', 'item2']},
              control: {display_list: displayList},
            },
          },
        });
    });

    it('should update modal state for already saved model', () => {
      let displayList = ['item3', 'item4'];
      DisplayPrefs.setChildTreeDisplayList('audit', displayList);

      let updateArgs = LocalStorage.update.calls.argsFor(0);
      expect(updateArgs[0]).toBe(localStorageKey);
      expect(updateArgs[1]).toEqual(
        {
          id: 1,
          tree_view: {
            child_tree_display_list: {
              audit: {display_list: displayList},
            },
          },
        });
    });
  });

  describe('getLHNavSize() method', () => {
    it('should return null when there is no saved preferences', () => {
      let result = DisplayPrefs.getLHNavSize();

      expect(result).toBeNull();
    });

    it('should return LHN size from local storage', () => {
      let size = 123;
      let prefs = {
        id: 1,
        lhn_size: {
          lhs: size,
        },
      };

      spyOn(LocalStorage, 'get').and.returnValue([prefs]);

      let result = DisplayPrefs.getLHNavSize();
      expect(result).toBe(size);
    });
  });

  describe('setLHNavSize() method', () => {
    beforeEach(() => {
      spyOn(LocalStorage, 'update');
    });

    it('should save LHN size', () => {
      let size = 234;

      spyOn(LocalStorage, 'get').and.returnValue([{id: 1}]);

      DisplayPrefs.setLHNavSize(size);

      let updateArgs = LocalStorage.update.calls.argsFor(0);
      expect(updateArgs[0]).toBe(localStorageKey);
      expect(updateArgs[1]).toEqual(
        {
          id: 1,
          lhn_size: {
            lhs: size,
          },
        });
    });

    it('should update LHN size', () => {
      spyOn(LocalStorage, 'get').and.returnValue([{
        id: 1,
        lhn_size: {
          lhs: 123,
        },
      }]);

      DisplayPrefs.setLHNavSize(234);

      let updateArgs = LocalStorage.update.calls.argsFor(0);
      expect(updateArgs[0]).toBe(localStorageKey);
      expect(updateArgs[1]).toEqual(
        {
          id: 1,
          lhn_size: {
            lhs: 234,
          },
        });
    });
  });

  describe('getLHNState() method', () => {
    it('should return empty object when there is no saved preferences', () => {
      let result = DisplayPrefs.getLHNState();

      expect(result.serialize()).toEqual({});
    });

    it('should return LHN state from local storage', () => {
      let state = {
        open_category: 'category',
        my_work: true,
      };

      let prefs = {
        id: 1,
        lhn_state: state,
      };

      spyOn(LocalStorage, 'get').and.returnValue([prefs]);

      let result = DisplayPrefs.getLHNState();
      expect(result.serialize()).toEqual(state);
    });
  });

  describe('setLHNState() method', () => {
    beforeEach(() => {
      spyOn(LocalStorage, 'update');
    });

    ['open_category', 'panel_scroll', 'category_scroll', 'search_text',
      'my_work', 'filter_params', 'is_open', 'is_pinned'].forEach((prop) => {
      it(`should update ${prop} prop`, () => {
        spyOn(LocalStorage, 'get').and.returnValue([{id: 1}]);
        DisplayPrefs.setLHNState({
          [prop]: 'value',
        });

        let updateArgs = LocalStorage.update.calls.argsFor(0);
        expect(updateArgs[0]).toBe(localStorageKey);
        expect(updateArgs[1]).toEqual(
          {
            id: 1,
            lhn_state: {
              [prop]: 'value',
            },
          });
      });
    });

    it('should not update not allowed props', () => {
      spyOn(LocalStorage, 'get').and.returnValue([{id: 1}]);
      DisplayPrefs.setLHNState({
        'not allowed prop': 'value',
      });

      let updateArgs = LocalStorage.update.calls.argsFor(0);
      expect(updateArgs[0]).toBe(localStorageKey);
      expect(updateArgs[1]).toEqual(
        {
          id: 1,
          lhn_state: {},
        });
    });

    it('should update several properties', () => {
      spyOn(LocalStorage, 'get').and.returnValue([{
        id: 1,
        lhn_state: {
          open_category: 'category 1',
        }}]);

      DisplayPrefs.setLHNState({
        open_category: 'ctageory 2',
        panel_scroll: 123,
        size: 234, // not allowed
      });

      let updateArgs = LocalStorage.update.calls.argsFor(0);
      expect(updateArgs[0]).toBe(localStorageKey);
      expect(updateArgs[1]).toEqual(
        {
          id: 1,
          lhn_state: {
            open_category: 'ctageory 2',
            panel_scroll: 123,
          },
        });
    });
  });
});
