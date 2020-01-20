/*
  Copyright (C) 2020 Google Inc.
  Licensed under http://www.apache.org/licenses/LICENSE-2.0 <see LICENSE file>
*/

import canMap from 'can-map';
import Component from '../cycle-task-objects';
import {getComponentVM} from '../../../../../js_specs/spec-helpers';
import * as QueryApiUtils from '../../../../plugins/utils/query-api-utils';
import * as ErrorUtils from '../../../../plugins/utils/errors-utils';
import * as NotifierUtils from '../../../../plugins/utils/notifiers-utils';
import * as WorkflowUtils from '../../../../plugins/utils/workflow-utils';
import {
  DEFERRED_MAPPED_UNMAPPED,
  OBJECTS_MAPPED_VIA_MAPPER,
} from '../../../../events/event-types';

describe('cycle-task-objects component', () => {
  let viewModel;

  beforeEach(() => {
    viewModel = getComponentVM(Component);
  });

  describe('component\'s init() method', () => {
    let init;

    beforeEach(() => {
      init = Component.prototype.init.bind({viewModel});
      spyOn(viewModel, 'initMappedObjects');
    });

    it('initializes mapped objects', () => {
      init();

      expect(viewModel.initMappedObjects).toHaveBeenCalled();
    });
  });

  describe('convertToMappedObjects() method', () => {
    it('returns converted objects to appropriate format', () => {
      const objects = [{
        data: 'Some data 1',
        type: 'Some Type 1',
      }, {
        data: 'Some data 2',
        type: 'Some Type 2',
      }];
      const expectedResult = [{
        object: {
          data: 'Some data 1',
          type: 'Some Type 1',
        },
        iconClass: 'fa-some_type_1',
      }, {
        object: {
          data: 'Some data 2',
          type: 'Some Type 2',
        },
        iconClass: 'fa-some_type_2',
      }];
      const result = viewModel.convertToMappedObjects(objects);

      expect(result).toEqual(expectedResult);
    });
  });

  describe('initMappedObjects() method', () => {
    beforeEach(() => {
      spyOn(WorkflowUtils, 'getRelevantMappingTypes');
      spyOn(QueryApiUtils, 'loadObjectsByTypes');
    });

    it('sets isLoading flag to true before loading of mapped objects', () => {
      viewModel.attr('isLoading', false);

      viewModel.initMappedObjects();

      expect(viewModel.attr('isLoading')).toBe(true);
    });

    it('loads mapped objects based on mapping list for cycle tasks', () => {
      const typesCollection = {
        FakeType: ['Type 1', 'Type 2', 'Type 3'],
      };
      WorkflowUtils.getRelevantMappingTypes.and.callFake((instance) =>
        typesCollection[instance.attr('type')]
      );
      const instance = new canMap({type: 'FakeType'});
      viewModel.attr('instance', instance);

      viewModel.initMappedObjects();

      expect(QueryApiUtils.loadObjectsByTypes).toHaveBeenCalledWith(
        instance,
        ['Type 1', 'Type 2', 'Type 3'],
        ['id', 'type', 'title', 'viewLink']
      );
    });

    describe('when mapped objects were loaded', () => {
      beforeEach(() => {
        QueryApiUtils.loadObjectsByTypes.and.returnValue([]);
        spyOn(viewModel, 'convertToMappedObjects');
      });

      it('replaces current mapped objects with loaded objects using ' +
      'appropriate format for each object', async () => {
        const fakeConverter = (objects) => objects.map(
          (object) => ({object, field: object.data})
        );

        QueryApiUtils.loadObjectsByTypes.and.returnValue([
          {data: 'Data 1'},
          {data: 'Data 2'},
          {data: 'Data 3'},
        ]);

        viewModel.convertToMappedObjects.and.callFake(fakeConverter);

        const expectedResult = fakeConverter([
          {data: 'Data 1'},
          {data: 'Data 2'},
          {data: 'Data 3'},
        ]);

        await viewModel.initMappedObjects();

        expect(viewModel.attr('mappedObjects').serialize())
          .toEqual(expectedResult);
      });

      it('sets isLoading flag to false after loading of mapped objects',
        async () => {
          viewModel.attr('isLoading', true);

          await viewModel.initMappedObjects();

          expect(viewModel.attr('isLoading')).toBe(false);
        });
    });

    describe('when some error was occurred during loading operation', () => {
      let fakeXHR;

      beforeEach(() => {
        fakeXHR = {
          data: 'Fake XHR',
        };

        QueryApiUtils.loadObjectsByTypes.and.returnValue(
          Promise.reject(fakeXHR)
        );

        spyOn(NotifierUtils, 'notifier');
        spyOn(ErrorUtils, 'getAjaxErrorInfo').and.callFake(
          (xhr) => ({details: xhr.data})
        );
      });

      it('notifies the user about the issue with loading process',
        async () => {
          await viewModel.initMappedObjects();

          expect(NotifierUtils.notifier).toHaveBeenCalledWith(
            'error',
            'Fake XHR'
          );
        });

      it('sets isLoading flag to false after error handling',
        async () => {
          viewModel.attr('isLoading', true);

          await viewModel.initMappedObjects();

          expect(viewModel.attr('isLoading')).toBe(false);
        });
    });
  });

  describe('includeLoadedObjects() method', () => {
    beforeEach(() => {
      spyOn(QueryApiUtils, 'loadObjectsByStubs');
    });

    it('sets isLoading flag to true before loading of objects', () => {
      viewModel.attr('isLoading', false);

      viewModel.includeLoadedObjects([]);

      expect(viewModel.attr('isLoading')).toBe(true);
    });

    it('loads objects with needed fields', () => {
      const objects = [
        {id: 123, type: 'Fake Type 1'},
        {id: 234234, type: 'Fake Type 2'},
      ];

      viewModel.includeLoadedObjects(objects);

      expect(QueryApiUtils.loadObjectsByStubs).toHaveBeenCalledWith(
        [
          {id: 123, type: 'Fake Type 1'},
          {id: 234234, type: 'Fake Type 2'},
        ],
        ['id', 'type', 'title', 'viewLink']
      );
    });

    describe('when objects were loaded', () => {
      beforeEach(() => {
        QueryApiUtils.loadObjectsByStubs.and.returnValue([]);
        spyOn(viewModel, 'convertToMappedObjects');
      });

      it('adds formatted loaded objects to the current mapped objects',
        async () => {
          const fakeConverter = (objects) => objects.map(
            (object) => ({object, field: object.data})
          );

          viewModel.convertToMappedObjects.and.callFake(fakeConverter);

          viewModel.attr('mappedObjects', fakeConverter([
            {data: 'Data 10'},
            {data: 'Data 20'},
            {data: 'Data 30'},
          ]));

          QueryApiUtils.loadObjectsByStubs.and.returnValue([
            {data: 'Data 1'},
            {data: 'Data 2'},
            {data: 'Data 3'},
          ]);

          const expectedResult = fakeConverter([
            {data: 'Data 10'},
            {data: 'Data 20'},
            {data: 'Data 30'},
            {data: 'Data 1'},
            {data: 'Data 2'},
            {data: 'Data 3'},
          ]);

          await viewModel.includeLoadedObjects([]);

          expect(viewModel.attr('mappedObjects').serialize())
            .toEqual(expectedResult);
        });

      it('sets isLoading flag to false after loading of objects',
        async () => {
          viewModel.attr('isLoading', true);

          await viewModel.includeLoadedObjects([]);

          expect(viewModel.attr('isLoading')).toBe(false);
        });
    });

    describe('when some error was occurred during loading operation', () => {
      let fakeXHR;

      beforeEach(() => {
        fakeXHR = {
          data: 'Fake XHR',
        };

        QueryApiUtils.loadObjectsByStubs.and.returnValue(
          Promise.reject(fakeXHR)
        );

        spyOn(NotifierUtils, 'notifier');
        spyOn(ErrorUtils, 'getAjaxErrorInfo').and.callFake(
          (xhr) => ({details: xhr.data})
        );
      });

      it('notifies the user about the issue with loading process',
        async () => {
          await viewModel.includeLoadedObjects([]);

          expect(NotifierUtils.notifier).toHaveBeenCalledWith(
            'error',
            'Fake XHR'
          );
        });

      it('sets isLoading flag to false after error handling',
        async () => {
          viewModel.attr('isLoading', true);

          await viewModel.includeLoadedObjects([]);

          expect(viewModel.attr('isLoading')).toBe(false);
        });
    });
  });

  describe('withoutExcludedFilter() method', () => {
    it('returns true if objects collection contains the object which has' +
    'the same id and type as has passed mappedObject', () => {
      const objects = [
        {id: 234, type: 'Type 1'},
        {id: 134, type: 'Type 2'},
        {id: 553, type: 'Type 3'},
      ];

      const result = viewModel.withoutExcludedFilter(objects, {
        object: {id: 134, type: 'Type 2'},
      });

      expect(result).toBe(false);
    });
  });

  describe('excludeObjects() method', () => {
    it('excludes passed objects from mappedObjects collection', () => {
      viewModel.attr('mappedObjects', viewModel.convertToMappedObjects([
        {
          id: 3245,
          type: 'Type 1',
        },
        {
          id: 2314,
          type: 'Type 1',
        },
        {
          id: 1123,
          type: 'Type 2',
        },
        {
          id: 3211,
          type: 'Type 2',
        },
      ]));
      const excludeObjects = [
        {
          id: 2314,
          type: 'Type 1',
        },
        {
          id: 3211,
          type: 'Type 2',
        },
      ];
      const expectedResult = viewModel.convertToMappedObjects([
        {
          id: 3245,
          type: 'Type 1',
        },
        {
          id: 1123,
          type: 'Type 2',
        },
      ]);

      viewModel.excludeObjects(excludeObjects);

      expect(viewModel.attr('mappedObjects').serialize())
        .toEqual(expectedResult);
    });
  });

  describe('events', () => {
    describe('"{viewModel.instance} ${DEFERRED_MAPPED_UNMAPPED.type}"() ' +
    'handler', () => {
      let handler;

      beforeEach(() => {
        handler = Component.prototype.events[
          `{viewModel.instance} ${DEFERRED_MAPPED_UNMAPPED.type}`
        ].bind({viewModel});

        spyOn(viewModel, 'excludeObjects');
        spyOn(viewModel, 'includeLoadedObjects');
      });

      it('excludes unmapped objects', () => {
        const unmapped = [{id: 12345, type: 'Type 1'}];

        handler(null, {
          unmapped,
          mapped: [],
        });

        expect(viewModel.excludeObjects).toHaveBeenCalledWith(unmapped);
      });

      it('includes mapped objects', () => {
        const mapped = [{id: 12345, type: 'Type 1'}];

        handler(null, {
          mapped,
          unmapped: [],
        });

        expect(viewModel.includeLoadedObjects).toHaveBeenCalledWith(mapped);
      });
    });

    describe('"{viewModel.instance} ${OBJECTS_MAPPED_VIA_MAPPER.type}"() ' +
    'handler', () => {
      let handler;

      beforeEach(() => {
        handler = Component.prototype.events[
          `{viewModel.instance} ${OBJECTS_MAPPED_VIA_MAPPER.type}`
        ].bind({viewModel});

        spyOn(viewModel, 'includeLoadedObjects');
      });

      it('includes mapped objects', () => {
        const objects = [{id: 12345, type: 'Type 1'}];

        handler(null, {objects});

        expect(viewModel.includeLoadedObjects).toHaveBeenCalledWith(objects);
      });
    });
  });
});
