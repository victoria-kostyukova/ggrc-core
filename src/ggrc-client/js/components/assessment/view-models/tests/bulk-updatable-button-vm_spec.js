/*
  Copyright (C) 2020 Google Inc.
  Licensed under http://www.apache.org/licenses/LICENSE-2.0 <see LICENSE file>
*/

import canMap from 'can-map';
import BulkUpdatableButtonVM from '../bulk-updatable-button-vm';
import * as CurrentPageUtils from '../../../../plugins/utils/current-page-utils';

describe('bulk-updatable-button-vm component', () => {
  let viewModel;

  beforeEach(() => {
    viewModel = BulkUpdatableButtonVM();
  });

  describe('getModalConfig() method', () => {
    it('returns object with filled "mappedToItems" property' +
    'if "parentInstance" attr is truthy value', () => {
      viewModel.parentInstance = new canMap({
        id: 123,
        type: 'fakeType',
        title: 'fakeTitle',
      });
      spyOn(CurrentPageUtils, 'isMyAssessments').and.returnValue(true);

      expect(viewModel.getModalConfig()).toEqual({
        isMyAssessmentsView: true,
        mappedToItems: [{
          id: 123,
          type: 'fakeType',
          title: 'fakeTitle',
        }],
      });
    });

    it('returns object with empty "mappedToItems" property ' +
    'if "parentInstance" attr is falsy value', () => {
      viewModel.parentInstance = null;
      spyOn(CurrentPageUtils, 'isMyAssessments').and.returnValue(true);

      expect(viewModel.getModalConfig()).toEqual({
        isMyAssessmentsView: true,
        mappedToItems: [],
      });
    });
  });
});
