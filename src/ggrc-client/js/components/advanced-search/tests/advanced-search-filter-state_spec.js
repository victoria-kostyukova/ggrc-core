/*
  Copyright (C) 2019 Google Inc.
  Licensed under http://www.apache.org/licenses/LICENSE-2.0 <see LICENSE file>
*/

import loForEach from 'lodash/forEach';
import loFilter from 'lodash/filter';
import canMap from 'can-map';
import * as StateUtils from '../../../plugins/utils/state-utils';
import {getComponentVM} from '../../../../js_specs/spec_helpers';
import Component from '../advanced-search-filter-state';
import * as ModelsUtils from '../../../plugins/utils/models-utils';

describe('advanced-search-filter-state component', function () {
  'use strict';

  let viewModel;

  beforeEach(() => {
    viewModel = getComponentVM(Component);
  });

  describe('label getter', () => {
    it('with "Launch Status" if it is scoping object', () => {
      spyOn(ModelsUtils, 'isScopeModel').and.returnValue(true);

      expect(viewModel.attr('label')).toBe('Launch Status');
    });

    it('with "State" if it is not scoping object', () => {
      spyOn(ModelsUtils, 'isScopeModel').and.returnValue(false);

      expect(viewModel.attr('label')).toBe('State');
    });
  });

  describe('getter for filterStates', () => {
    let states;

    beforeEach(() => {
      states = ['state1', 'state2', 'state3'];
      spyOn(StateUtils, 'getStatesForModel').and.returnValue(states);
    });

    it('initializes all "filterStates" unchecked ' +
       'if "stateModel.items" is empty', () => {
      viewModel.attr('modelName', 'Requirement');

      viewModel.attr('stateModel', new canMap({
        items: [],
      }));

      const result = viewModel.attr('filterStates');
      expect(result.length).toBe(states.length);

      loForEach(result, (item) => {
        expect(item.checked).toBeFalsy();
      });
    });

    it('initializes "filterStates" checked with items from "stateModel"',
      function () {
        viewModel.attr('modelName', 'Requirement');
        viewModel.attr('stateModel', new canMap({
          items: ['state1'],
        }));

        const selectedItems = loFilter(viewModel.attr('filterStates'),
          (it) => it.checked);
        expect(selectedItems.length).toBe(1);
        expect(selectedItems[0].value).toBe('state1');
      });
  });

  describe('saveTreeStates() method', function () {
    it('updates items collection', function () {
      let items;
      let selectedStates = [{value: 'Active'}, {value: 'Draft'}];
      viewModel.attr('stateModel', new canMap({
        items: [],
      }));

      viewModel.saveTreeStates(selectedStates);

      items = viewModel.attr('stateModel.items');
      expect(items.length).toBe(2);
      expect(items[0]).toBe('Active');
      expect(items[1]).toBe('Draft');
    });
  });
});
