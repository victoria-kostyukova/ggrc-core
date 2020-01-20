/*
  Copyright (C) 2020 Google Inc.
  Licensed under http://www.apache.org/licenses/LICENSE-2.0 <see LICENSE file>
*/

import canMap from 'can-map';
import Component from '../cycle-task-modal';
import {getComponentVM} from '../../../../../js_specs/spec-helpers';
import * as QueryApiUtils from '../../../../plugins/utils/query-api-utils';
import * as businessModels from '../../../../models/business-models';
import * as NotifierUtils from '../../../../plugins/utils/notifiers-utils';
import * as ErrorUtils from '../../../../plugins/utils/errors-utils';
import * as WorkflowUtils from '../../../../plugins/utils/workflow-utils';

describe('cycle-task-modal component', () => {
  let viewModel;

  beforeEach(() => {
    viewModel = getComponentVM(Component);
  });

  describe('loadMappedObjects() method', () => {
    beforeEach(() => {
      spyOn(WorkflowUtils, 'getRelevantMappingTypes');
      spyOn(QueryApiUtils, 'loadObjectsByTypes');
    });

    it('returns loaded objects', () => {
      const typesCollection = {
        FakeType: ['Type 1', 'Type 2', 'Type 3'],
      };
      WorkflowUtils.getRelevantMappingTypes.and.callFake((instance) =>
        typesCollection[instance.attr('type')]
      );

      const instance = new canMap({
        type: 'FakeType',
      });
      viewModel.attr('instance', instance);

      viewModel.loadMappedObjects();

      expect(WorkflowUtils.getRelevantMappingTypes).toHaveBeenCalledWith(
        instance
      );
      expect(QueryApiUtils.loadObjectsByTypes).toHaveBeenCalledWith(
        instance,
        ['Type 1', 'Type 2', 'Type 3'],
        ['id', 'type', 'title', 'viewLink'],
      );
    });
  });

  describe('loadPreMappedObjects() method', () => {
    let savedModels;
    let fakeModelNames;

    beforeAll(() => {
      fakeModelNames = ['FakeName1', 'FakeName2'];
      savedModels = {};
      fakeModelNames.forEach((fakeModelName) => {
        savedModels[fakeModelName] = businessModels[fakeModelName];
      });
    });

    afterAll(() => {
      fakeModelNames.forEach((fakeModelName) => {
        businessModels[fakeModelName] = savedModels[fakeModelName];
      });
    });

    it('returns objects from cache based on pre-mapped stubs', () => {
      fakeModelNames.forEach((fakeModelName) => {
        businessModels[fakeModelName] = {
          findInCacheById: jasmine
            .createSpy('findInCacheById').and
            .callFake((id) => ({
              id,
              type: fakeModelName,
              data: 'Fake data',
            })),
        };
      });
      viewModel.attr('preMappedStubs', fakeModelNames.map(
        (fakeModelName, id) => ({
          id,
          type: fakeModelName,
        })
      ));

      const result = viewModel.loadPreMappedObjects();
      const expectedResult = [
        {
          id: 0,
          type: 'FakeName1',
          data: 'Fake data',
        },
        {
          id: 1,
          type: 'FakeName2',
          data: 'Fake data',
        },
      ];

      expect(result.serialize()).toEqual(expectedResult);
    });
  });

  describe('viewModel\'s init() method', () => {
    beforeEach(() => {
      spyOn(viewModel, 'loadPreMappedObjects').and.returnValue([]);
      spyOn(viewModel, 'loadMappedObjects')
        .and.returnValue(new Promise(() => {}));
    });

    describe('initializes pre-mapped objects', () => {
      let fakePreMappedObjects;

      beforeEach(() => {
        fakePreMappedObjects = [
          {
            id: 123,
            type: 'Type 1',
            data: 'Fake data 1',
          },
          {
            id: 43,
            type: 'Type 2',
            data: 'Fake data 2',
          },
        ];
        viewModel.loadPreMappedObjects.and.returnValue(fakePreMappedObjects);
        viewModel.attr('preMappedObjects', []);
      });

      it('for edit modal', () => {
        viewModel.attr('isNewInstance', true);

        viewModel.init();

        expect(viewModel.attr('preMappedObjects').serialize())
          .toEqual(fakePreMappedObjects);
      });

      it('for create modal', () => {
        viewModel.attr('isNewInstance', false);

        viewModel.init();

        expect(viewModel.attr('preMappedObjects').serialize())
          .toEqual(fakePreMappedObjects);
      });

      it('assigns pre-mapped objects to mappingsList field', () => {
        const mappingsList = [{id: 12345, type: 'SomeType'}];
        viewModel.attr('mappingsList', mappingsList);

        viewModel.init();

        expect(viewModel.attr('mappingsList').serialize())
          .toEqual([...mappingsList, ...fakePreMappedObjects]);
      });
    });

    it('doesn\'t load mapped objects if create modal is opened', () => {
      viewModel.attr('isNewInstance', true);

      viewModel.init();

      expect(viewModel.loadMappedObjects).not.toHaveBeenCalled();
    });

    it('sets isLoading flag to true before loading of mapped objects', () => {
      viewModel.attr('isLoading', false);

      viewModel.init();

      expect(viewModel.attr('isLoading')).toBe(true);
    });

    it('loads mapped objects', () => {
      viewModel.init();

      expect(viewModel.loadMappedObjects).toHaveBeenCalled();
    });

    describe('when mapped objects were loaded', () => {
      beforeEach(() => {
        viewModel.loadMappedObjects.and.returnValue([]);
      });

      it('assigns loaded mapped objects to mappingsList field',
        async () => {
          const fakeLoadedObjects = [
            {
              id: 123,
              type: 'Type 1',
              data: 'Fake data 1',
            },
            {
              id: 43,
              type: 'Type 2',
              data: 'Fake data 2',
            },
          ];
          viewModel.attr('mappingsList', []);
          viewModel.loadMappedObjects.and.returnValue([
            {
              id: 123,
              type: 'Type 1',
              data: 'Fake data 1',
            },
            {
              id: 43,
              type: 'Type 2',
              data: 'Fake data 2',
            },
          ]);

          await viewModel.init();

          expect(viewModel.attr('mappingsList').serialize())
            .toEqual(fakeLoadedObjects);
        });

      it('sets isLoading flag to false after loading of mapped objects',
        async () => {
          viewModel.attr('isLoading', true);

          await viewModel.init();

          expect(viewModel.attr('isLoading')).toBe(false);
        });
    });

    describe('when some error was occurred during loading operation', () => {
      let fakeXHR;

      beforeEach(() => {
        fakeXHR = {
          data: 'Fake XHR',
        };

        viewModel.loadMappedObjects.and.returnValue(
          Promise.reject(fakeXHR)
        );

        spyOn(NotifierUtils, 'notifier');
        spyOn(ErrorUtils, 'getAjaxErrorInfo').withArgs(fakeXHR)
          .and.returnValue({details: fakeXHR.data});
      });

      it('notifies the user about the issue with loading process',
        async () => {
          await viewModel.init();

          expect(NotifierUtils.notifier).toHaveBeenCalledWith(
            'error',
            'Fake XHR'
          );
        });

      it('sets isLoading flag to false after error handling',
        async () => {
          viewModel.attr('isLoading', true);

          await viewModel.init();

          expect(viewModel.attr('isLoading')).toBe(false);
        });
    });
  });
});

