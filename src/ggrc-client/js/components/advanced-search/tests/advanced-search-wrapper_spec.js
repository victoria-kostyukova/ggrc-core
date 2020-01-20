/*
  Copyright (C) 2020 Google Inc.
  Licensed under http://www.apache.org/licenses/LICENSE-2.0 <see LICENSE file>
*/

import {getComponentVM} from '../../../../js_specs/spec-helpers';
import Component from '../advanced-search-wrapper';
import * as AdvancedSearch from '../../../plugins/utils/advanced-search-utils';
import * as StateUtils from '../../../plugins/utils/state-utils';

describe('advanced-search-wrapper component', function () {
  'use strict';

  let viewModel;
  let spy;
  beforeEach(() => {
    viewModel = getComponentVM(Component);
  });

  describe('setDefaultStatusItem method', () => {
    it('should call setDefaultStatusConfig if hasStatusFilter', () => {
      spyOn(StateUtils, 'hasFilter').and.returnValue(true);
      spy = spyOn(AdvancedSearch, 'setDefaultStatusConfig');

      viewModel.setDefaultStatusItem();
      expect(spy).toHaveBeenCalled();
    });

    it('should call create.state if !hasStatusFilter', () => {
      spyOn(StateUtils, 'hasFilter').and.returnValue(false);
      spy = spyOn(AdvancedSearch.create, 'state');

      viewModel.setDefaultStatusItem();
      expect(spy).toHaveBeenCalled();
    });
  });
});
