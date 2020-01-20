/*
  Copyright (C) 2020 Google Inc.
  Licensed under http://www.apache.org/licenses/LICENSE-2.0 <see LICENSE file>
*/

import * as AdvancedSearch from '../../../plugins/utils/advanced-search-utils';
import AdvancedSearchContainer from '../../view-models/advanced-search-container-vm';

describe('advanced-search-container viewModel', function () {
  'use strict';

  let viewModel;

  beforeEach(function () {
    viewModel = new AdvancedSearchContainer();
  });

  describe('removeItem() method', function () {
    it('removes attribute and operator behind if item is first',
      function () {
        let viewItems;
        viewModel.attr('items', [
          AdvancedSearch.create.attribute({field: 'first'}),
          AdvancedSearch.create.operator(),
          AdvancedSearch.create.attribute({field: 'second'}),
        ]);
        viewItems = viewModel.attr('items');

        viewModel.removeItem(viewItems[0]);

        expect(viewItems.length).toBe(1);
        expect(viewItems[0].type).toBe('attribute');
        expect(viewItems[0].value.field).toBe('second');
      });

    it('removes attribute and operator in front if item is not first',
      function () {
        let viewItems;
        viewModel.attr('items', [
          AdvancedSearch.create.attribute({field: 'first'}),
          AdvancedSearch.create.operator(),
          AdvancedSearch.create.attribute({field: 'second'}),
        ]);
        viewItems = viewModel.attr('items');

        viewModel.removeItem(viewItems[2]);

        expect(viewItems.length).toBe(1);
        expect(viewItems[0].type).toBe('attribute');
        expect(viewItems[0].value.field).toBe('first');
      });

    it('calls remove() if it is group and single attribute was removed',
      function () {
        let viewItems;
        viewModel.attr('items', [
          AdvancedSearch.create.attribute({field: 'single'}),
        ]);
        viewItems = viewModel.attr('items');
        spyOn(viewModel, 'remove');

        viewModel.removeItem(viewItems[0], true);

        expect(viewModel.remove).toHaveBeenCalled();
      });

    it('does not calls remove() if it is not group' +
      ' and single attribute was removed',
    function () {
      let viewItems;
      viewModel.attr('items', [
        AdvancedSearch.create.attribute({field: 'single'}),
      ]);
      viewItems = viewModel.attr('items');
      spyOn(viewModel, 'remove');

      viewModel.removeItem(viewItems[0]);

      expect(viewModel.remove).not.toHaveBeenCalled();
    });
  });
});
