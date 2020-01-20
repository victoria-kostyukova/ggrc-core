/*
 Copyright (C) 2020 Google Inc., authors, and contributors
 Licensed under http://www.apache.org/licenses/LICENSE-2.0 <see LICENSE file>
 */

import canList from 'can-list';
import baseAutocompleteResults from '../autocomplete-results';
import {KEY_MAP} from '../autocomplete-input';

describe('autocomplete-results viewModel', () => {
  let viewModel;

  beforeEach(() => {
    viewModel = baseAutocompleteResults();
  });

  describe('items set() method', () => {
    it('should assign an array to "_items" field which should contain ' +
    'all elements from "items" collection + appropriate ' +
    '"_index" attr for each element', () => {
      const fakeData = new canList([
        {name: 'zxc'},
        {name: 'asd'},
        {name: 'qwert'},
      ]);
      const results = [
        {name: 'zxc', _index: 0},
        {name: 'asd', _index: 1},
        {name: 'qwert', _index: 2},
      ];

      viewModel.attr('items', fakeData);

      const values = viewModel.attr('_items');

      values.forEach((item, index) => {
        expect(item).toEqual(jasmine.objectContaining(results[index]));
      });
    });

    it('should return passed items', () => {
      const items = new canList([
        {name: 'zxc'},
        {name: 'asd'},
        {name: 'qwert'},
      ]);
      viewModel.attr('items', items);

      expect(viewModel.attr('items')).toBe(items);
    });
  });

  describe('actionKey set method', () => {
    beforeEach(() => {
      spyOn(viewModel, 'dispatch');
    });

    it('dispatches selectActive type event if key is ENTER', () => {
      viewModel.attr('actionKey', KEY_MAP.ENTER);

      expect(viewModel.dispatch).toHaveBeenCalledWith({type: 'selectActive'});
    });

    it('dispatches highlightNext type event if key is ARROW_DOWN', () => {
      viewModel.attr('actionKey', KEY_MAP.ARROW_DOWN);

      expect(viewModel.dispatch).toHaveBeenCalledWith({type: 'highlightNext'});
    });

    it('dispatches highlightPrevious type event if key is ARROW_UP', () => {
      viewModel.attr('actionKey', KEY_MAP.ARROW_UP);

      expect(viewModel.dispatch)
        .toHaveBeenCalledWith({type: 'highlightPrevious'});
    });

    it('does not dispatches any events by default', () => {
      viewModel.attr('actionKey', 'someKey');

      expect(viewModel.dispatch).not.toHaveBeenCalled();
    });
  });

  describe('addNewItem() method', () => {
    beforeEach(() => {
      spyOn(viewModel, 'dispatch');
      spyOn(viewModel, 'hide');
    });

    it('should dispatch "addNewItem" event', () => {
      const value = 'f';
      viewModel.attr('currentValue', value);

      viewModel.addNewItem();

      expect(viewModel.dispatch).toHaveBeenCalledWith({
        type: 'addNewItem',
        newValue: value,
      });
    });

    it('should call "hide" method', () => {
      const value = 'f';
      viewModel.attr('currentValue', value);

      viewModel.addNewItem();

      expect(viewModel.hide).toHaveBeenCalled();
    });
  });

  describe('selectItem() method', () => {
    it('should dispatch "selectItem" event', () => {
      const items = new canList([
        {name: 'zxc'},
        {name: 'asd'},
        {name: 'qwert'},
      ]);
      const index = 0;

      spyOn(viewModel, 'dispatch');

      viewModel.attr('items', items);
      viewModel.selectItem(index);

      expect(viewModel.dispatch).toHaveBeenCalledWith({
        type: 'selectItem',
        item: items[index],
      });
    });

    it('should call "hide" method', () => {
      const items = new canList([
        {name: 'zxc'},
        {name: 'asd'},
        {name: 'qwert'},
      ]);
      const index = 0;

      spyOn(viewModel, 'hide');

      viewModel.attr('items', items);
      viewModel.selectItem(index);

      expect(viewModel.hide).toHaveBeenCalled();
    });
  });

  describe('hide() method', () => {
    it('should assign null to "currentValue"', () => {
      viewModel.attr('currentValue', 'asd');

      viewModel.hide();

      const currentValue = viewModel.attr('currentValue');

      expect(currentValue).toBeNull();
    });

    it('should set "showResults" to false', () => {
      viewModel.attr('showResults', true);

      viewModel.hide();

      const showResults = viewModel.attr('showResults');

      expect(showResults).toEqual(false);
    });
  });
});
