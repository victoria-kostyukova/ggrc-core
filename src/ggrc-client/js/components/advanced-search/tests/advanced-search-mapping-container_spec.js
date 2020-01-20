/*
  Copyright (C) 2020 Google Inc.
  Licensed under http://www.apache.org/licenses/LICENSE-2.0 <see LICENSE file>
*/

import canList from 'can-list';
import * as AdvancedSearch from '../../../plugins/utils/advanced-search-utils';
import {getComponentVM} from '../../../../js_specs/spec-helpers';
import Component from '../advanced-search-mapping-container';

describe('advanced-search-mapping-container component', function () {
  'use strict';

  let viewModel;

  beforeEach(() => {
    viewModel = getComponentVM(Component);
  });

  describe('addMappingCriteria() method', function () {
    it('adds only criteria if list is empty', function () {
      let items;
      viewModel.attr('items', canList());

      viewModel.addMappingCriteria();

      items = viewModel.attr('items');
      expect(items.length).toBe(1);
      expect(items[0].type).toBe('mappingCriteria');
    });

    it('adds operator and criteria if list is not empty', function () {
      let items;
      viewModel.attr('items',
        [AdvancedSearch.create.mappingCriteria()]);
      viewModel.addMappingCriteria();

      items = viewModel.attr('items');
      expect(items.length).toBe(3);
      expect(items[0].type).toBe('mappingCriteria');
      expect(items[1].type).toBe('operator');
      expect(items[2].type).toBe('mappingCriteria');
    });
  });

  describe('createGroup() method', function () {
    it('transforms criteria to group with 2 criteria and operator inside',
      function () {
        let viewItems;
        viewModel.attr('items', new canList([
          AdvancedSearch.create.mappingCriteria({field: 'first'}),
          AdvancedSearch.create.operator(),
          AdvancedSearch.create.mappingCriteria({field: 'second'}),
        ]));
        viewItems = viewModel.attr('items');

        viewModel.createGroup(viewItems[0]);

        expect(viewItems.length).toBe(3);
        expect(viewItems[0].type).toBe('group');
        expect(viewItems[1].type).toBe('operator');
        expect(viewItems[2].type).toBe('mappingCriteria');
        expect(viewItems[0].value.length).toBe(3);
        expect(viewItems[0].value[0].type).toBe('mappingCriteria');
        expect(viewItems[0].value[0].value.field).toBe('first');
        expect(viewItems[0].value[1].type).toBe('operator');
        expect(viewItems[0].value[2].type).toBe('mappingCriteria');
      });
  });
});
