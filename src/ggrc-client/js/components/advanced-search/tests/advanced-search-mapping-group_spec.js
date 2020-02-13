/*
  Copyright (C) 2020 Google Inc.
  Licensed under http://www.apache.org/licenses/LICENSE-2.0 <see LICENSE file>
*/

import * as AdvancedSearch from '../../../plugins/utils/advanced-search-utils';
import {getComponentVM} from '../../../../js_specs/spec-helpers';
import Component from '../advanced-search-mapping-group';

describe('advanced-search-mapping-group component', () => {
  let viewModel;

  beforeEach(() => {
    viewModel = getComponentVM(Component);
  });

  describe('addMappingCriteria() method', () => {
    it('adds operator and criteria', () => {
      viewModel.items =
        [AdvancedSearch.create.mappingCriteria()];
      viewModel.addMappingCriteria();

      let items = viewModel.items;
      expect(items.length).toBe(3);
      expect(items[0].type).toBe('mappingCriteria');
      expect(items[1].type).toBe('operator');
      expect(items[2].type).toBe('mappingCriteria');
    });
  });
});
