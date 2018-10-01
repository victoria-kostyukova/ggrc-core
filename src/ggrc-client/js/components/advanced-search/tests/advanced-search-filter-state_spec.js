/*
  Copyright (C) 2018 Google Inc.
  Licensed under http://www.apache.org/licenses/LICENSE-2.0 <see LICENSE file>
*/

import * as StateUtils from '../../../plugins/utils/state-utils';
import {getComponentVM} from '../../../../js_specs/spec_helpers';
import * as ModelsUtils from '../../../plugins/utils/models-utils';
import Component from '../advanced-search-filter-state';

describe('advanced-search-filter-state component', function () {
  'use strict';

  let viewModel;

  beforeEach(() => {
    viewModel = getComponentVM(Component);
  });

  describe('stateModel set() method', function () {
    let statesSpy;

    beforeEach(() => {
      statesSpy = spyOn(StateUtils, 'getDefaultStatesForModel');
    });

    it('assigns defaultStates to items of stateModel if items is not defined',
      function () {
        let states = ['state1', 'state2', 'state3'];
        statesSpy.and.returnValue(states);
        viewModel.attr('modelName', 'Requirement');

        viewModel.attr('stateModel', new can.Map());

        expect(viewModel.attr('stateModel.items').serialize())
          .toEqual(states);
      });

    it('assigns "ANY" to operator if it is not defined', () => {
      viewModel.attr('stateModel', new can.Map());

      expect(viewModel.attr('stateModel.operator')).toBe('ANY');
    });

    it('assigns modelName with value from viewModel', () => {
      let modelName = 'SomeModel';
      viewModel.attr('modelName', modelName);

      viewModel.attr('stateModel', new can.Map());

      expect(viewModel.attr('stateModel.modelName')).toBe(modelName);
    });

    describe('assigns label of state', () => {
      it('with "Launch Status" if it is scoping object', () => {
        spyOn(ModelsUtils, 'isScopeModel').and.returnValue(true);

        viewModel.attr('stateModel', new can.Map());

        expect(viewModel.attr('stateModel.label')).toBe('Launch Status');
      });

      it('with "State" if it is not scoping object', () => {
        spyOn(ModelsUtils, 'isScopeModel').and.returnValue(false);

        viewModel.attr('stateModel', new can.Map());

        expect(viewModel.attr('stateModel.label')).toBe('State');
      });
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

      viewModel.attr('stateModel', new can.Map({
        items: [],
      }));

      const result = viewModel.attr('filterStates');
      expect(result.length).toBe(states.length);

      _.forEach(result, (item) => {
        expect(item.checked).toBeFalsy();
      });
    });

    it('initializes "filterStates" checked with items from "stateModel"',
      function () {
        viewModel.attr('modelName', 'Requirement');
        viewModel.attr('stateModel', new can.Map({
          items: ['state1'],
        }));

        const selectedItems = _.filter(viewModel.attr('filterStates'),
          (it) => it.checked);
        expect(selectedItems.length).toBe(1);
        expect(selectedItems[0].value).toBe('state1');
      });
  });

  describe('saveTreeStates() method', function () {
    it('updates items collection', function () {
      let items;
      let selectedStates = [{value: 'Active'}, {value: 'Draft'}];
      viewModel.attr('stateModel', new can.Map({
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
