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
    let params;
    beforeEach(() => {
      params = [{
        type: 'testType',
        request: 'mockRequest',
      },
      {
        type: 'testType2',
        request: 'mockRequest2',
      }];

      spyOn(QueryAPI, 'batchRequestsWithPromise');
      spyOn(viewModel, 'getParams')
        .withArgs(10)
        .and.returnValue(params);
    });

    it('calls getParams() method', () => {
      viewModel.loadItems(10);

      expect(viewModel.getParams).toHaveBeenCalledWith(10);
    });

    it('sets "isLoading" attribute to true', () => {
      viewModel.attr('isLoading', false);

      viewModel.loadItems(10);

      expect(viewModel.attr('isLoading')).toBe(true);
    });

    describe('after batchRequests() success', () => {
      it('sets items when appropriate data returned', async () => {
        const items = ['i1', 'i2'];
        const items2 = ['i3', 'i4'];
        const response = {
          Snapshot: {
            values: items,
          },
        };
        const response2 = {
          Snapshot: {
            values: items2,
          },
        };

        spyOn(SnapshotUtils, 'toObject').and.callFake((obj) => obj);
        QueryAPI.batchRequestsWithPromise
          .withArgs('mockRequest')
          .and.returnValue(Promise.resolve(response))
          .withArgs('mockRequest2')
          .and.returnValue(Promise.resolve(response2));

        await viewModel.loadItems(10);

        expect(viewModel.attr('testType').attr()).toEqual(items);
        expect(viewModel.attr('testType2').attr()).toEqual(items2);
      });

      it('sets "isLoading" attribute to false',
        async () => {
          QueryAPI.batchRequestsWithPromise
            .and.returnValue(Promise.resolve());
          viewModel.attr('isLoading', true);

          await viewModel.loadItems(10);

          expect(viewModel.attr('isLoading')).toBe(false);
        });
    });

    describe('if batchRequests() was failed', () => {
      beforeEach(() => {
        QueryAPI.batchRequestsWithPromise
          .and.returnValue(Promise.reject());
      });

      it('sets "isLoading" attribute to false',
        async () => {
          viewModel.attr('isLoading', true);

          await viewModel.loadItems(10);

          expect(viewModel.attr('isLoading')).toBe(false);
        });

      it('calls notifier()', async () => {
        spyOn(NotifiersUtils, 'notifier');

        await viewModel.loadItems(10);

        expect(NotifiersUtils.notifier)
          .toHaveBeenCalledWith('error', 'Failed to fetch related objects.');
      });
    });
  });
});
