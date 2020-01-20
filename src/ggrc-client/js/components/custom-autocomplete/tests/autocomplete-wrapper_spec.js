/*
 Copyright (C) 2020 Google Inc., authors, and contributors
 Licensed under http://www.apache.org/licenses/LICENSE-2.0 <see LICENSE file>
 */

import canMap from 'can-map';
import baseAutocompleteWrapper from '../autocomplete-wrapper';
import * as QueryAPI from '../../../plugins/utils/query-api-utils';

describe('autocomplete-wrapper viewModel', () => {
  let viewModel;

  beforeEach(() => {
    viewModel = baseAutocompleteWrapper();
  });

  describe('getResult() method', () => {
    let deferred;
    let event;
    let data;

    beforeEach(() => {
      deferred = new $.Deferred();
      event = {
        type: 'inputChanged',
        value: 'e',
      };
      viewModel.attr('modelName', 'mockModel');
      data = {
        mockModel: {values: [1, 2, 3]},
      };
      spyOn(viewModel, 'requestItems')
        .and.returnValue(deferred);
      spyOn(viewModel, 'filterResult');
      spyOn(viewModel, 'isCurrentValueUnique');
    });

    it('should call "requestItems" method', () => {
      viewModel.getResult(event);
      expect(viewModel.requestItems).toHaveBeenCalledWith(event.value);
    });

    it('should assign event value to "currentValue', (done) => {
      deferred.resolve(data);
      viewModel.getResult(event).then(() => {
        expect(viewModel.attr('currentValue')).toEqual(event.value);
        done();
      });
    });

    it('should assign filtered items to "result" attribute', (done) => {
      deferred.resolve(data);
      const filtered = [1, 2];
      viewModel.filterResult.and.returnValue(filtered);
      viewModel.getResult(event).then(() => {
        expect(viewModel.filterResult).toHaveBeenCalledTimes(1);
        expect(viewModel.filterResult).toHaveBeenCalledWith(
          data[viewModel.attr('modelName')].values);
        expect(viewModel.attr('result').serialize())
          .toEqual(filtered);
        done();
      });
    });

    it('should assign value returned from isCurrentValueUnique function ' +
    'to "showNewValue" attribute', (done) => {
      deferred.resolve(data);
      viewModel.attr('showNewValue', false);
      const expected = new canMap({});
      viewModel.isCurrentValueUnique.and.returnValue(expected);

      viewModel.getResult(event).then(() => {
        expect(viewModel.attr('showNewValue')).toBe(expected);
        done();
      });
    });

    it('should assign true to "showResults" attribute', (done) => {
      deferred.resolve(data);
      viewModel.attr('showResults', false);

      viewModel.getResult(event).then(() => {
        expect(viewModel.attr('showResults')).toBe(true);
        done();
      });
    });
  });

  describe('requestItems() method', () => {
    it('calls batchRequests with built params', () => {
      const objName = 'model';
      const queryField = 'query';
      const value = 'word';
      const filter = {
        expression: {
          left: queryField,
          op: {name: '~'},
          right: value,
        },
      };
      const paging = {
        current: 1,
        pageSize: 10,
      };

      viewModel.attr('modelName', objName);
      viewModel.attr('queryField', queryField);

      spyOn(QueryAPI, 'buildParam').and.returnValue('buildedParams');
      spyOn(QueryAPI, 'batchRequests');

      viewModel.requestItems(value);

      expect(QueryAPI.buildParam).toHaveBeenCalledTimes(1);
      expect(QueryAPI.buildParam).toHaveBeenCalledWith(
        objName,
        paging,
        null,
        null,
        filter
      );
      expect(QueryAPI.batchRequests)
        .toHaveBeenCalledWith('buildedParams');
    });

    it('should return request result', () => {
      const fakeResponseArr = [];

      spyOn(QueryAPI, 'buildParam');
      spyOn(QueryAPI, 'batchRequests').and.returnValue(fakeResponseArr);

      const responseArr = viewModel.requestItems('word');

      expect(responseArr).toEqual(fakeResponseArr);
    });
  });

  describe('filterResult() method', () => {
    it('should return not changed result if objectsToExclude is empty', () => {
      const fakeResult = [{}, {k: 1}];
      viewModel.attr('objectsToExclude', []);

      const result = viewModel.filterResult(fakeResult);

      expect(result).toEqual(fakeResult);
    });

    it('should return filtered result if objectsToExclude is not empty', () => {
      const objectsToExclude = [{id: 2}, {id: 3}, {id: 4}];
      const data = [{id: 3}, {id: 5}, {id: 7}];
      const fakeResult = [{id: 5}, {id: 7}];
      viewModel.attr('objectsToExclude', objectsToExclude);

      const result = viewModel.filterResult(data);

      expect(result).toEqual(fakeResult);
    });
  });

  describe('isCurrentValueUnique() method', () => {
    it('should return true when collection does not contain currentValue',
      () => {
        const result = [{name: 'rrr'}, {name: 'rrrtt'}];
        viewModel.attr('objectsToExclude', []);
        viewModel.attr('currentValue', 'R');

        const isCurrentValue = viewModel.isCurrentValueUnique(result);

        expect(isCurrentValue).toBe(true);
      });

    it('should return false when collection contains currentValue', () => {
      const result = [{name: 'r'}, {name: 'rrrtt'}];
      viewModel.attr('objectsToExclude', []);
      viewModel.attr('currentValue', 'R');

      const isCurrentValue = viewModel.isCurrentValueUnique(result);

      expect(isCurrentValue).toBe(false);
    });

    it('should return false when "objectsToExclude" contains currentValue',
      () => {
        const result = [{name: 'rdsf'}, {name: 'rrrtt'}];
        const objectsToExclude = [{name: 'ggd'}, {name: 'r'}];

        viewModel.attr('objectsToExclude', objectsToExclude);
        viewModel.attr('currentValue', 'R');

        const isCurrentValue = viewModel.isCurrentValueUnique(result);

        expect(isCurrentValue).toBe(false);
      });
  });
});
