/*
  Copyright (C) 2020 Google Inc.
  Licensed under http://www.apache.org/licenses/LICENSE-2.0 <see LICENSE file>
*/

import {getComponentVM} from '../../../../js_specs/spec-helpers';
import Component from '../advanced-search-filter-attribute';

describe('advanced-search-filter-attribute component', function () {
  'use strict';

  let viewModel;
  let events;

  beforeEach(() => {
    viewModel = getComponentVM(Component);
    events = Component.prototype.events;
  });

  describe('availableAttributes set() method', function () {
    it('initializes "attribute.field" property with first available attribute',
      function () {
        viewModel.attr('availableAttributes', [{
          attr_title: 'FirstAttr',
        }]);

        expect(viewModel.attr('attribute.field')).toBe('FirstAttr');
      });

    it('does not intialize "attribute.field" when it is already initialized',
      function () {
        viewModel.attr('attribute.field', 'Field');
        viewModel.attr('availableAttributes', [{
          attr_title: 'FirstAttr',
        }]);

        expect(viewModel.attr('attribute').field).toBe('Field');
      });
  });

  describe('remove() method', function () {
    it('dispatches "remove" event', function () {
      spyOn(viewModel, 'dispatch');

      viewModel.remove();

      expect(viewModel.dispatch).toHaveBeenCalledWith('remove');
    });
  });

  describe('createGroup() method', function () {
    it('dispatches "createGroup" event', function () {
      spyOn(viewModel, 'dispatch');

      viewModel.createGroup();

      expect(viewModel.dispatch).toHaveBeenCalledWith('createGroup');
    });
  });

  describe('setValue() method', function () {
    it('updates "attribute value" from $element value', function () {
      let $element;

      viewModel.attr('attribute').value = 'old value';

      $element = $('<input type="text"/>');
      $element.val('new value');
      viewModel.setValue($element);

      expect(viewModel.attr('attribute').value).toBe('new value');
    });
  });

  describe('isUnary get() method', function () {
    it('returns false if attribute.operator value is not "is"', function () {
      viewModel.attr('attribute.operator', '!=');

      let result = viewModel.attr('isUnary');

      expect(result).toBe(false);
    });

    it('returns true if attribute.operator value is "is"', function () {
      viewModel.attr('attribute.operator', 'is');

      let result = viewModel.attr('isUnary');

      expect(result).toBe(true);
    });
  });

  describe('"{viewModel.attribute} operator" handler', function () {
    let that;
    let handler;
    beforeEach(function () {
      that = {
        viewModel: viewModel,
      };
      handler = events['{viewModel.attribute} operator'];
    });

    it(`sets attribute.value to "empty" if new attribute.operator
    value is "is"`,
    function () {
      viewModel.attr('attribute.value', 'value');

      handler.call(that, [viewModel.attribute], {}, 'is');

      let result = viewModel.attr('attribute.value');
      expect(result).toEqual('empty');
    });

    it(`sets attribute.value to empty string if previous attribute.operator
    value was "is"`,
    function () {
      viewModel.attr('attribute.value', 'value');

      handler.call(that, [viewModel.attribute], {}, 'val', 'is');

      let result = viewModel.attr('attribute.value');
      expect(result).toEqual('');
    });
  });
});
