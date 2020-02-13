/*
  Copyright (C) 2020 Google Inc.
  Licensed under http://www.apache.org/licenses/LICENSE-2.0 <see LICENSE file>
*/

import {getComponentVM} from '../../../../js_specs/spec-helpers';
import Component from '../advanced-search-filter-attribute';

describe('advanced-search-filter-attribute component', () => {
  let viewModel;
  let events;

  beforeEach(() => {
    viewModel = getComponentVM(Component);
    events = Component.prototype.events;
  });

  describe('availableAttributes set() method', () => {
    it('initializes "attribute.field" property with first available attribute',
      () => {
        viewModel.availableAttributes = [{
          attr_title: 'FirstAttr',
        }];

        expect(viewModel.attribute.attr('field')).toBe('FirstAttr');
      });

    it('does not intialize "attribute.field" when it is already initialized',
      () => {
        viewModel.attribute.attr('field', 'Field');
        viewModel.availableAttributes = [{
          attr_title: 'FirstAttr',
        }];

        expect(viewModel.attribute.attr('field')).toBe('Field');
      });
  });

  describe('remove() method', () => {
    it('dispatches "remove" event', () => {
      spyOn(viewModel, 'dispatch');

      viewModel.remove();

      expect(viewModel.dispatch).toHaveBeenCalledWith('remove');
    });
  });

  describe('createGroup() method', () => {
    it('dispatches "createGroup" event', () => {
      spyOn(viewModel, 'dispatch');

      viewModel.createGroup();

      expect(viewModel.dispatch).toHaveBeenCalledWith('createGroup');
    });
  });

  describe('setValue() method', () => {
    it('updates "attribute value" from $element value', () => {
      viewModel.attribute.attr('value', 'old value');

      let $element = $('<input type="text"/>');
      $element.val('new value');
      viewModel.setValue($element);

      expect(viewModel.attribute.attr('value')).toBe('new value');
    });
  });

  describe('isUnary get() method', () => {
    it('returns false if attribute.operator value is not "is"', () => {
      viewModel.attribute.attr('operator', '!=');

      let result = viewModel.isUnary;

      expect(result).toBe(false);
    });

    it('returns true if attribute.operator value is "is"', () => {
      viewModel.attribute.attr('operator', 'is');

      let result = viewModel.isUnary;

      expect(result).toBe(true);
    });
  });

  describe('"{viewModel.attribute} operator" handler', () => {
    let that;
    let handler;
    beforeEach(() => {
      that = {
        viewModel,
      };
      handler = events['{viewModel.attribute} operator'];
    });

    it(`sets attribute.value to "empty" if new attribute.operator
    value is "is"`,
    () => {
      viewModel.attribute.attr('value', 'value');

      handler.call(that, [viewModel.attribute], {}, 'is');

      let result = viewModel.attribute.attr('value');
      expect(result).toBe('empty');
    });

    it(`sets attribute.value to empty string if previous attribute.operator
    value was "is"`,
    () => {
      viewModel.attribute.attr('value', 'value');

      handler.call(that, [viewModel.attribute], {}, 'val', 'is');

      let result = viewModel.attribute.attr('value');
      expect(result).toBe('');
    });
  });
});
