/*
 Copyright (C) 2020 Google Inc.
 Licensed under http://www.apache.org/licenses/LICENSE-2.0 <see LICENSE file>
 */

import Component from '../related-comments';
import {getComponentVM} from '../../../../js_specs/spec-helpers';
import * as QueryAPIUtils from '../../../plugins/utils/query-api-utils';

describe('related-comments component', () => {
  let viewModel;
  let query;

  beforeEach(() => {
    viewModel = getComponentVM(Component);
  });

  describe('requestQuery() method', () => {
    it('sets true to "isLoading" attribute', () => {
      spyOn(QueryAPIUtils, 'batchRequestsWithPromise');
      viewModel.attr('isLoading', false);

      viewModel.requestQuery();

      expect(viewModel.attr('isLoading')).toBe(true);
    });

    it('calls batchRequests() util', () => {
      spyOn(QueryAPIUtils, 'batchRequestsWithPromise');

      query = {
        header: 'header',
        data: {},
      };

      viewModel.requestQuery(query);

      expect(QueryAPIUtils.batchRequestsWithPromise).toHaveBeenCalledWith({
        header: 'header',
        data: {},
      });
    });

    describe('after batchRequests() success', () => {
      let response;

      beforeEach(() => {
        response = {
          type: {
            values: [{}, {}],
          },
        };

        query = 'request';

        spyOn(QueryAPIUtils, 'batchRequestsWithPromise')
          .withArgs('request')
          .and.returnValue(Promise.resolve(response));
      });

      it('should return array of loaded objects', async () => {
        const result = await viewModel.requestQuery(query);

        expect(result).toEqual([{
          instance: {},
          isSelected: false,
        }, {
          instance: {},
          isSelected: false,
        }]);
      });

      it('sets false to "isLoading" attribute', async () => {
        viewModel.attr('isLoading', true);

        await viewModel.requestQuery();

        expect(viewModel.attr('isLoading')).toBe(false);
      });
    });

    describe('if batchRequests() was failed', () => {
      beforeEach(() => {
        spyOn(QueryAPIUtils, 'batchRequestsWithPromise')
          .and.returnValue(Promise.reject());
      });

      it('should return empty array', async () => {
        const result = await viewModel.requestQuery();

        expect(result).toEqual([]);
      });

      it('sets false to "isLoading" attribute', async () => {
        viewModel.attr('isLoading', true);

        await viewModel.requestQuery();

        expect(viewModel.attr('isLoading')).toBe(false);
      });
    });
  });
});
