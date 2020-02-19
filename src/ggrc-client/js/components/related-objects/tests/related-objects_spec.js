/*
 Copyright (C) 2020 Google Inc.
 Licensed under http://www.apache.org/licenses/LICENSE-2.0 <see LICENSE file>
 */

import Component from '../related-objects';
import {getComponentVM} from '../../../../js_specs/spec-helpers';
import * as QueryAPIUtils from '../../../plugins/utils/query-api-utils';
import {RELATED_REFRESHED} from '../../../events/event-types';

describe('related-objects component', () => {
  let viewModel;

  beforeAll(() => {
    viewModel = getComponentVM(Component);
  });

  describe('loadRelatedItems() method', () => {
    beforeEach(() => {
      spyOn(viewModel, 'getParams');
      spyOn(QueryAPIUtils, 'batchRequestsWithPromise');
    });

    it('calls batchRequests() util', () => {
      const params = {
        header: 'header',
        data: {},
      };
      viewModel.getParams.and.returnValue(params);

      viewModel.loadRelatedItems();

      expect(QueryAPIUtils.batchRequestsWithPromise).toHaveBeenCalledWith({
        header: 'header',
        data: {},
      });
    });

    describe('after batchRequests() success', () => {
      let ModelConstructor;
      let data;

      beforeEach(() => {
        data = {
          Assessment: {
            values: [{id: 1}, {id: 2}, {id: 3}],
            total: 3,
          },
        };

        ModelConstructor = {
          model: (item) => item,
        };

        viewModel.attr('relatedItemsType', 'Assessment');
        viewModel.attr('modelConstructor', ModelConstructor);

        QueryAPIUtils.batchRequestsWithPromise
          .and.returnValue(Promise.resolve(data));
      });

      it('should update paging object', async () => {
        await viewModel.loadRelatedItems();

        expect(viewModel.attr('paging.total')).toBe(data.Assessment.total);
      });

      it('should return array of new instances', async () => {
        const result = await viewModel.loadRelatedItems();

        expect(result).toEqual([
          {instance: {id: 1}},
          {instance: {id: 2}},
          {instance: {id: 3}},
        ]);
      });
    });

    describe('if batchRequests() was failed', () => {
      beforeEach(() => {
        QueryAPIUtils.batchRequestsWithPromise
          .and.returnValue(Promise.reject());
      });

      it('should return empty array', async () => {
        const result = await viewModel.loadRelatedItems();

        expect(result).toEqual([]);
      });
    });
  });

  describe('setRelatedItems() method', () => {
    beforeEach(() => {
      spyOn(viewModel, 'loadRelatedItems');
    });

    it('set "isLoading" attribute to true', () => {
      viewModel.attr('isLoading', false);

      viewModel.setRelatedItems();

      expect(viewModel.attr('isLoading')).toBe(true);
    });

    describe('after loadRelatedItems() success', () => {
      beforeEach(() => {
        viewModel.attr('relatedItemsType', 'testType');
        viewModel.attr('baseInstance', {});

        viewModel.loadRelatedItems.and.returnValue(
          Promise.resolve(['proposal1', 'proposal2', 'proposal3']));
      });

      it('replace existing relatedObjects', async () => {
        viewModel.attr('relatedObjects', []);

        await viewModel.setRelatedItems();

        expect(viewModel.attr('relatedObjects').attr()).toEqual([
          'proposal1',
          'proposal2',
          'proposal3',
        ]);
      });

      it('dispatches RELATED_REFRESHED event', async () => {
        const baseInstance = viewModel.attr('baseInstance');
        spyOn(baseInstance, 'dispatch');

        await viewModel.setRelatedItems();

        expect(baseInstance.dispatch).toHaveBeenCalledWith({
          ...RELATED_REFRESHED,
          model: 'testType',
        });
      });

      it('sets "isLoading" attribute to false', async () => {
        viewModel.attr('isLoading', true);

        await viewModel.setRelatedItems();

        expect(viewModel.attr('isLoading')).toBe(false);
      });
    });

    it('sets "isLoading" attribute to false if was failed', async () => {
      viewModel.attr('isLoading', true);
      viewModel.loadRelatedItems.and.returnValue(Promise.reject());

      await expectAsync(viewModel.setRelatedItems()).toBeRejected();

      expect(viewModel.attr('isLoading')).toBe(false);
    });
  });
});
