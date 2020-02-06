/*
  Copyright (C) 2020 Google Inc.
  Licensed under http://www.apache.org/licenses/LICENSE-2.0 <see LICENSE file>
*/

import canList from 'can-list';
import * as StateUtils from '../../../plugins/utils/state-utils';
import * as AdvancedSearch from '../../../plugins/utils/advanced-search-utils';
import {getComponentVM} from '../../../../js_specs/spec-helpers';
import Component from '../advanced-search-filter-container';

describe('advanced-search-filter-container component', () => {
  let viewModel;

  beforeEach(() => {
    spyOn(StateUtils, 'getDefaultStatesForModel')
      .and.returnValue(['state']);
    viewModel = getComponentVM(Component);
  });

  describe('items get() method', () => {
    it('initializes "items" property with state filter if it is empty ' +
    'and model is not stateless', () => {
      spyOn(StateUtils, 'hasFilter').and.returnValue(true);
      viewModel.items = [];

      let items = viewModel.items;

      expect(items.length).toBe(1);
      expect(items[0].type).toBe('state');
    });
  });

  describe('addFilterCriterion() method', () => {
    it('adds only attribute if list is empty', () => {
      viewModel.items = canList();

      viewModel.addFilterCriterion();

      let items = viewModel.items;
      expect(items.length).toBe(1);
      expect(items[0].type).toBe('attribute');
    });

    it('adds operator and attribute', () => {
      viewModel.items = [AdvancedSearch.create.attribute()];

      viewModel.addFilterCriterion();

      let items = viewModel.items;
      expect(items.length).toBe(3);
      expect(items[0].type).toBe('attribute');
      expect(items[1].type).toBe('operator');
      expect(items[2].type).toBe('attribute');
    });
  });

  describe('createGroup() method', () => {
    it('transforms attribute to group with 2 attributes and operator inside',
      () => {
        viewModel.items = new canList([
          AdvancedSearch.create.attribute({field: 'first'}),
          AdvancedSearch.create.operator(),
          AdvancedSearch.create.attribute({field: 'second'}),
        ]);
        let viewItems = viewModel.items;

        viewModel.createGroup(viewItems[0]);

        expect(viewItems.length).toBe(3);
        expect(viewItems[0].type).toBe('group');
        expect(viewItems[1].type).toBe('operator');
        expect(viewItems[2].type).toBe('attribute');
        expect(viewItems[0].value.length).toBe(3);
        expect(viewItems[0].value[0].type).toBe('attribute');
        expect(viewItems[0].value[0].value.field).toBe('first');
        expect(viewItems[0].value[1].type).toBe('operator');
        expect(viewItems[0].value[2].type).toBe('attribute');
      });
  });
});
