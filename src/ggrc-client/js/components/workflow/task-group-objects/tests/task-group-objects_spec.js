/*
 Copyright (C) 2020 Google Inc.
 Licensed under http://www.apache.org/licenses/LICENSE-2.0 <see LICENSE file>
 */

import canMap from 'can-map';
import {getComponentVM} from '../../../../../js_specs/spec-helpers';
import Component from '../task-group-objects';
import * as Stub from '../../../../models/stub';
import * as Mappings from '../../../../models/mappers/mappings';
import * as QueryApiUtils from '../../../../plugins/utils/query-api-utils';
import * as MapperUtils from '../../../../plugins/utils/mapper-utils';
import * as NotifiersUtils from '../../../../plugins/utils/notifiers-utils';
import * as ErrorUtils from '../../../../plugins/utils/errors-utils';
import {OBJECTS_MAPPED_VIA_MAPPER} from '../../../../events/event-types';

describe('task-group-objects component', function () {
  let viewModel;

  beforeEach(function () {
    viewModel = getComponentVM(Component);
  });

  describe('addToList() method', () => {
    beforeEach(() => {
      spyOn(viewModel, 'getPending').and.returnValue([]);
    });

    it('adds converted passed objects to "items"', () => {
      const objects = [
        {id: 1, type: 'Type1'},
        {id: 2, type: 'Type2'},
        {id: 3, type: 'Type3'},
        {id: 4, type: 'Type4'},
      ];
      const fakeConverter = (object) => ({stub: object});
      const expected = objects.map(fakeConverter);
      spyOn(viewModel, 'convertToListItem').and.callFake(fakeConverter);

      viewModel.addToList(objects);

      expect(viewModel.attr('items').serialize()).toEqual(expected);
    });
  });

  describe('convertToListItem() method', () => {
    it('returns converted object', () => {
      const object = {
        id: 12345,
        type: 'ObjectType',
        title: 'Some title',
      };

      spyOn(Stub, 'default').and.callFake(function (object) {
        Object.assign(this, object, {data: 'it is a stub'});
      });

      const expectedResult = {
        stub: jasmine.objectContaining({
          ...object,
          data: 'it is a stub',
        }),
        title: object.title,
        iconClass: 'fa-object_type',
        disabled: false,
        unmapping: false,
      };

      const result = viewModel.convertToListItem(object);

      expect(result).toEqual(expectedResult);
    });
  });

  describe('initTaskGroupItems() method', () => {
    beforeEach(() => {
      spyOn(QueryApiUtils, 'loadObjectsByTypes')
        .and.returnValue(new Promise(() => {}));
      spyOn(Mappings, 'getMappingList');
    });

    it('loads all objects mapped to task group which should contain id, ' +
    'title and type fields', () => {
      const mappingList = ['Type1', 'Type2', 'Type3'];
      Mappings.getMappingList.and.returnValues(mappingList);
      const taskGroup = new canMap({id: 12345, type: 'FakeTaskGroup'});
      viewModel.attr('taskGroup', taskGroup);
      spyOn(viewModel, 'addToList');

      viewModel.initTaskGroupItems();

      expect(Mappings.getMappingList).toHaveBeenCalledWith('TaskGroup');
      expect(QueryApiUtils.loadObjectsByTypes)
        .toHaveBeenCalledWith(taskGroup, mappingList, ['id', 'type', 'title']);
    });

    describe('after loading of objects', () => {
      let loadedObjects;

      beforeEach(() => {
        loadedObjects = [];
        QueryApiUtils.loadObjectsByTypes
          .and.returnValue(Promise.resolve(loadedObjects));
        spyOn(viewModel, 'addToList');
      });

      it('adds them to the list', async (done) => {
        loadedObjects.push(
          {data: 'Object1'},
          {data: 'Object2'},
          {data: 'Object3'},
        );

        await viewModel.initTaskGroupItems();

        expect(viewModel.addToList).toHaveBeenCalledWith(loadedObjects);
        done();
      });
    });
  });

  describe('addPreloadedObjectsToList() method', () => {
    beforeEach(() => {
      spyOn(QueryApiUtils, 'loadObjectsByStubs')
        .and.returnValue(Promise.resolve([]));
      spyOn(viewModel, 'addToList');
    });

    it('loads objects before adding them to the list which ' +
    'should contain id, title and type fields based on ' +
    'passed stubs', async (done) => {
      const stubs = [{
        id: 1,
        type: 'Type1',
      }, {
        id: 20,
        type: 'Type20',
      }, {
        id: 300,
        type: 'Type300',
      }];

      await viewModel.addPreloadedObjectsToList(stubs);

      expect(QueryApiUtils.loadObjectsByStubs).toHaveBeenCalledWith(
        stubs, ['id', 'type', 'title']
      );
      expect(QueryApiUtils.loadObjectsByStubs)
        .toHaveBeenCalledBefore(viewModel.addToList);
      done();
    });

    it('adds loaded objects to the list', async (done) => {
      const stubs = [{
        id: 1,
        type: 'Type1',
      }, {
        id: 20,
        type: 'Type20',
      }, {
        id: 300,
        type: 'Type300',
      }];
      const expectedResult = [
        {data: '1 Type1'},
        {data: '20 Type20'},
        {data: '300 Type300'},
      ];
      QueryApiUtils.loadObjectsByStubs.and.callFake((stubs) =>
        Promise.resolve(
          stubs.map(({id, type}) => ({data: `${id} ${type}`}))
        )
      );

      await viewModel.addPreloadedObjectsToList(stubs);

      expect(viewModel.addToList).toHaveBeenCalledWith(expectedResult);
      done();
    });
  });

  describe('waitForResolveOfPendingItems() method', () => {
    it('removes unmapped object from pending unmappings list', async (done) => {
      const item = new canMap({stub: {id: 2, type: 'object'}});
      viewModel.attr('items').push(item);

      const unmapping = {
        item: {id: 2, type: 'object'},
        request: Promise.resolve,
      };
      viewModel.attr('taskGroup', {_pendingUnmappings: [unmapping]});
      spyOn(viewModel, 'getPending')
        .and.returnValue(viewModel.attr('taskGroup._pendingUnmappings'));
      await viewModel.waitForResolveOfPendingItems();

      expect(viewModel.attr('taskGroup._pendingUnmappings.length')).toBe(0);
      expect(viewModel.attr('items')).not.toContain(item);
      done();
    });
  });

  describe('unmapByItemIndex() method', () => {
    beforeEach(() => {
      spyOn(MapperUtils, 'unmapObjects').and.returnValue(
        new Promise(() => {})
      );
      viewModel.attr('items', [
        new canMap({id: 1}),
      ]);
      viewModel.attr('taskGroup', {_pendingUnmappings: []});
    });

    it('sets "disabled" and "unmapping" flags to true for certain item based '+
    'on passed itemIndex before unmapping object from task group', () => {
      const item = new canMap({stub: {id: 2}});
      viewModel.attr('items').push(item);
      const itemIndex = 1;
      item.attr('disabled', false);

      viewModel.unmapByItemIndex(itemIndex);

      expect(item.attr('disabled')).toBe(true);
      expect(item.attr('unmapping')).toBe(true);
    });

    it('unmaps object performed by stub and attached to item from task group',
      () => {
        const itemIndex = 0;
        const item = viewModel.attr('items')[itemIndex];
        const taskGroup = new canMap({
          id: 12345,
          type: 'FakeTaskGroupType',
        });
        const stub = new canMap({
          id: 234435,
          type: 'FakeObjectType',
        });
        item.attr('stub', stub);
        viewModel.attr('taskGroup', taskGroup);

        viewModel.unmapByItemIndex(itemIndex);

        expect(MapperUtils.unmapObjects).toHaveBeenCalledWith(
          taskGroup,
          [stub]
        );
      });

    describe('after successful unmapping of object from taskGroup', () => {
      beforeEach(() => {
        MapperUtils.unmapObjects.and.returnValue(Promise.resolve());
        spyOn(NotifiersUtils, 'notifier');
        viewModel.attr('taskGroup', {_pendingUnmappings: []});
      });

      it('sets "disabled" flag to false for certain item based on passed ' +
      'itemIndex', async (done) => {
        const item = new canMap({stub: {id: 2, type: 'object'}});
        viewModel.attr('items').push(item);
        const itemIndex = 1;
        item.attr('disabled', true);

        await viewModel.unmapByItemIndex(itemIndex);

        expect(item.attr('disabled')).toBe(false);
        done();
      });

      it('removes unmapped object from the "items" list', async (done) => {
        const itemIndex = 2;
        const removingObject = new canMap({stub: {id: 50}});
        viewModel.attr('items').replace([
          new canMap({stub: {id: 30}}),
          new canMap({stub: {id: 40}}),
          removingObject,
          new canMap({stub: {id: 60}}),
        ]);

        await viewModel.unmapByItemIndex(itemIndex);

        expect(viewModel.attr('items.length')).toBe(3);
        expect(viewModel.attr('items')).not.toContain(removingObject);
        done();
      });

      it('removes unmapped object from pending unappings list',
        async (done) => {
          const itemIndex = 0;
          const item = new canMap({stub: {id: 30}});
          viewModel.attr('items').replace([item]);

          await viewModel.unmapByItemIndex(itemIndex);

          expect(viewModel.attr('taskGroup._pendingUnmappings.length'))
            .toBe(0);
          done();
        });

      it('notifies the user that unmap operation was successfully done ',
        async (done) => {
          viewModel.attr('items').replace([
            new canMap({stub: {id: 1}}),
          ]);

          await viewModel.unmapByItemIndex(0);

          expect(NotifiersUtils.notifier)
            .toHaveBeenCalledWith('success', 'Unmap successful.');
          done();
        });
    });

    describe('if some ajax-related error was occurred', () => {
      let fakeXhr;
      let fakeErrorInfo;

      beforeEach(() => {
        fakeXhr = {};
        fakeErrorInfo = {};
        MapperUtils.unmapObjects.and.returnValue(Promise.reject(fakeXhr));
        spyOn(NotifiersUtils, 'notifier');
        spyOn(ErrorUtils, 'getAjaxErrorInfo').and.returnValue(fakeErrorInfo);
        viewModel.attr('items').replace([
          new canMap({stub: {id: 1}}),
        ]);
      });

      it('shows error message', async (done) => {
        fakeErrorInfo.details = 'Fake details';

        await viewModel.unmapByItemIndex(0);

        expect(ErrorUtils.getAjaxErrorInfo).toHaveBeenCalledWith(fakeXhr);
        expect(NotifiersUtils.notifier)
          .toHaveBeenCalledWith('error', 'Fake details');
        done();
      });

      it('does not remove item by itemIndex', async (done) => {
        await viewModel.unmapByItemIndex(0);

        expect(viewModel.attr('items').length).toBe(1);
        done();
      });

      it('sets "disabled" flag to false for certain item based on passed ' +
      'itemIndex', async (done) => {
        const item = new canMap({stub: {id: 2}});
        viewModel.attr('items').push(item);
        const itemIndex = 1;
        item.attr('disabled', true);

        await viewModel.unmapByItemIndex(itemIndex);

        expect(item.attr('disabled')).toBe(false);
        done();
      });
    });
  });

  describe('component\'s init() handler', () => {
    let init;

    beforeEach(() => {
      init = Component.prototype.init.bind({viewModel});
      spyOn(viewModel, 'initTaskGroupItems');
    });

    it('inits task group\'s items', () => {
      init();

      expect(viewModel.initTaskGroupItems).toHaveBeenCalled();
    });
  });

  describe('{viewModel.taskGroup} ${OBJECTS_MAPPED_VIA_MAPPER.type}]"()' +
  'event handler', () => {
    let handler;

    beforeEach(() => {
      const handlerName =
        `{viewModel.taskGroup} ${OBJECTS_MAPPED_VIA_MAPPER.type}`;
      handler = Component.prototype.events[handlerName].bind({viewModel});
    });

    it('adds passed objects to task group', () => {
      const objects = [
        {id: 123, type: 'Type123'},
        {id: 321, type: 'Type321'},
      ];
      spyOn(viewModel, 'addPreloadedObjectsToList');

      handler({}, {objects});

      expect(viewModel.addPreloadedObjectsToList).toHaveBeenCalledWith(objects);
    });
  });

  describe('".task-group-objects__unmap click"() event handler', () => {
    let handler;

    beforeEach(() => {
      const handlerName = '.task-group-objects__unmap click';
      handler = Component.prototype.events[handlerName].bind({viewModel});
    });

    it('unmaps object from task group by index stored in data-item-index ' +
    'attribute', () => {
      const itemIndex = '12345';
      const element = $('<div></div>').attr('data-item-index', itemIndex);
      spyOn(viewModel, 'unmapByItemIndex');

      handler(element);

      expect(viewModel.unmapByItemIndex).toHaveBeenCalledWith(itemIndex);
    });
  });
});
