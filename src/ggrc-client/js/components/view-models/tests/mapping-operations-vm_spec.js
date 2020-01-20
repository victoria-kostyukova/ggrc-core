/*
 Copyright (C) 2020 Google Inc.
 Licensed under http://www.apache.org/licenses/LICENSE-2.0 <see LICENSE file>
 */

import MappingOperationVM from '../mapping-operations-vm';
import * as QueryApiUtils from '../../../plugins/utils/query-api-utils';
import * as NotifierUtils from '../../../plugins/utils/notifiers-utils';
import * as ErrorUtils from '../../../plugins//utils/errors-utils';

describe('object-operations-base viewModel', () => {
  let viewModel;

  beforeEach(() => {
    viewModel = MappingOperationVM();
  });

  describe('addMappingObjects() method', () => {
    let objects;

    beforeEach(() => {
      objects = [
        {id: 1, type: 'Product'},
        {id: 2, type: 'Vendor'},
      ];
      viewModel.attr('fields', ['id', 'type', 'child_type']);

      spyOn(QueryApiUtils, 'loadObjectsByStubs');
    });

    describe('when objects are successfully loaded', () => {
      it('adds loaded objects to mappingsList attr', async () => {
        const mappingsList = [{id: 1, type: 'Vendor'}];
        viewModel.attr('mappingsList', mappingsList);

        let expectedResult = [
          {
            id: 1, type: 'Snapshot', child_type: 'Product', revision: [],
            title: 'Title1', name: 'product1', email: '',
          },
          {
            id: 2, type: 'Snapshot', child_type: 'Vendor', revision: [],
            title: 'Title2', name: 'vendor1', email: '',
          },
        ];

        QueryApiUtils.loadObjectsByStubs.withArgs(
          objects,
          viewModel.attr('fields').serialize())
          .and.returnValue(Promise.resolve(expectedResult));

        await viewModel.addMappingObjects({objects});

        expect(viewModel.attr('mappingsList').serialize())
          .toEqual([...mappingsList, ...expectedResult]);
      });
    });

    describe('when some error was occurred during loading operation', () => {
      it('notifies the user about the issue with loading process', async () => {
        let fakeXHR = {
          data: 'Fake XHR',
        };

        QueryApiUtils.loadObjectsByStubs.withArgs(
          objects,
          viewModel.attr('fields').serialize())
          .and.returnValue(Promise.reject(fakeXHR));

        spyOn(NotifierUtils, 'notifier');
        spyOn(ErrorUtils, 'getAjaxErrorInfo').withArgs(fakeXHR)
          .and.returnValue({details: fakeXHR.data});

        await viewModel.addMappingObjects({objects});

        expect(NotifierUtils.notifier)
          .toHaveBeenCalledWith('error', 'Fake XHR');
      });
    });
  });

  describe('removeMappingObject() method', () => {
    beforeEach(() => {
      viewModel.attr('mappingsList', [
        {id: 1, type: 'Product'},
        {id: 2, type: 'Vendor'},
      ]);
    });

    it('removes object from mappingsList attr', () => {
      const expectedResult = [{
        id: 2,
        type: 'Vendor',
      }];

      const object = {
        id: 1,
        type: 'Product',
      };

      viewModel.removeMappingObject({object});

      expect(viewModel.attr('mappingsList').serialize())
        .toEqual(expectedResult);
    });

    it('doesn\'t remove object from mappingsList attr if "id" ' +
    'is not correspond to the any object from mappingsList attr', () => {
      const expectedResult = [
        {id: 1, type: 'Product'},
        {id: 2, type: 'Vendor'},
      ];

      const object = {
        id: 123,
        type: 'Product',
      };

      viewModel.removeMappingObject({object});

      expect(viewModel.attr('mappingsList').serialize())
        .toEqual(expectedResult);
    });

    it('doesn\'t remove object from mappingsList attr if "type" ' +
    'is not correspond to the any object from mappingsList attr', () => {
      const expectedResult = [
        {id: 1, type: 'Product'},
        {id: 2, type: 'Vendor'},
      ];

      const object = {
        id: 1,
        type: 'SomeType',
      };

      viewModel.removeMappingObject({object});

      expect(viewModel.attr('mappingsList').serialize())
        .toEqual(expectedResult);
    });
  });
});
