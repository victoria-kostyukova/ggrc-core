/*
 Copyright (C) 2020 Google Inc.
 Licensed under http://www.apache.org/licenses/LICENSE-2.0 <see LICENSE file>
 */

import * as SnapshotUtils from '../../../../plugins/utils/snapshot-utils';
import * as QueryAPI from '../../../../plugins/utils/query-api-utils';
import * as NotifiersUtils from '../../../../plugins/utils/notifiers-utils';
import Component from '../assessment-mapped-controls';
import {getComponentVM} from '../../../../../js_specs/spec-helpers';

describe('assessment-mapped-controls component', () => {
  let viewModel;
  beforeEach(() => {
    viewModel = getComponentVM(Component);
  });

  describe('loadItems() method', () => {
    let pendingRequest;
    beforeEach(() => {
      pendingRequest = $.Deferred();
      spyOn(SnapshotUtils, 'toObject').and.callFake((obj) => obj);
      spyOn(QueryAPI, 'batchRequests')
        .and.returnValue(pendingRequest);
      spyOn(viewModel, 'getParams').and.returnValue([{
        type: 'testType',
        request: 'mockRequest',
      }]);
    });

    it('sets items when appropriate data returned', (done) => {
      let items = ['i1', 'i2'];
      let response = {
        Snapshot: {
          values: items,
        },
      };

      let loadItemsChain = viewModel.loadItems(1);

      expect(viewModel.getParams).toHaveBeenCalled();
      expect(viewModel.attr('isLoading')).toBeTruthy();

      pendingRequest.resolve(response).then(() => {
        loadItemsChain.then(() => {
          expect(viewModel.attr('isLoading')).toBeFalsy();
          expect(viewModel.attr('testType').attr()).toEqual(items);
          done();
        });
      });
    });

    it('turns off spinner when request fails', (done) => {
      spyOn(NotifiersUtils, 'notifier');

      let loadItemsChain = viewModel.loadItems(1);

      expect(viewModel.attr('isLoading')).toBeTruthy();

      pendingRequest.reject().then(null, () => {
        loadItemsChain.then(() => {
          expect(viewModel.attr('isLoading')).toBeFalsy();
          expect(NotifiersUtils.notifier)
            .toHaveBeenCalledWith('error', 'Failed to fetch related objects.');
          done();
        });
      });
    });
  });
});
