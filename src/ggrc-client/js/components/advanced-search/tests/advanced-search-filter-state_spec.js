/*
  Copyright (C) 2020 Google Inc.
  Licensed under http://www.apache.org/licenses/LICENSE-2.0 <see LICENSE file>
*/

import loForEach from 'lodash/forEach';
import loFilter from 'lodash/filter';
import canMap from 'can-map';
import * as StateUtils from '../../../plugins/utils/state-utils';
import {getComponentVM} from '../../../../js_specs/spec-helpers';
import Component from '../advanced-search-filter-state';
import * as ModelsUtils from '../../../plugins/utils/models-utils';

describe('advanced-search-filter-state component', () => {
  let viewModel;

  beforeEach(() => {
    viewModel = getComponentVM(Component);
  });

  describe('label getter', () => {
    it('with "Launch Status" if it is scoping object', () => {
      spyOn(ModelsUtils, 'isScopeModel').and.returnValue(true);

      expect(viewModel.label).toBe('Launch Status');
    });

    it('with "State" if it is not scoping object', () => {
      spyOn(ModelsUtils, 'isScopeModel').and.returnValue(false);

      expect(viewModel.label).toBe('State');
    });
  });

  describe('saveTreeStates() method', () => {
    it('updates items collection', () => {
      let selectedStates = [{value: 'Active'}, {value: 'Draft'}];
      viewModel.stateModel = new canMap({
        items: [],
      });

      viewModel.saveTreeStates(selectedStates);

      let items = viewModel.stateModel.attr('items');
      expect(items.length).toBe(2);
      expect(items[0]).toBe('Active');
      expect(items[1]).toBe('Draft');
    });
  });
  describe('initializeFilterStates() method', () => {
    let states;

    beforeEach(() => {
      states = ['state1', 'state2', 'state3'];
      spyOn(StateUtils, 'getStatesForModel').and.returnValue(states);
    });

    it('initializes all "filterStates" unchecked ' +
       'if "stateModel.items" is empty', () => {
      viewModel.modelName = 'Requirement';

      viewModel.stateModel = new canMap({
        items: [],
      });
      viewModel.initializeFilterStates();
      const result = viewModel.filterStates;
      expect(result.length).toBe(states.length);

      loForEach(result, (item) => {
        expect(item.checked).toBeFalsy();
      });
    });

    it('initializes "filterStates" checked with items from "stateModel"',
      () => {
        viewModel.modelName = 'Requirement';
        viewModel.stateModel = new canMap({
          items: ['state1'],
        });

        viewModel.initializeFilterStates();
        const selectedItems = loFilter(viewModel.filterStates,
          (it) => it.checked);
        expect(selectedItems.length).toBe(1);
        expect(selectedItems[0].value).toBe('state1');
      });
  });
});
