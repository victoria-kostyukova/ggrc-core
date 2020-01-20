/*
  Copyright (C) 2020 Google Inc.
  Licensed under http://www.apache.org/licenses/LICENSE-2.0 <see LICENSE file>
*/

import loUniq from 'lodash/uniq';
import loFilter from 'lodash/filter';
import canList from 'can-list';
import canMap from 'can-map';
import Component from '../deferred-mapper';
import {getComponentVM} from '../../../js_specs/spec-helpers';
import * as MapperUtils from '../../plugins/utils/mapper-utils';
import {
  REFRESH_MAPPING,
  REFRESH_SUB_TREE,
  DEFERRED_MAP_OBJECTS,
  DEFERRED_MAPPED_UNMAPPED,
} from '../../events/event-types';
import * as CurrentPageUtils from '../../plugins/utils/current-page-utils';

describe('deferred-mapper component', function () {
  let vm;

  beforeEach(function () {
    vm = getComponentVM(Component);
    vm.attr('instance', {});
  });

  describe('setter of "instance"', () => {
    it('sets new instance', () => {
      const newInstance = new canMap({});
      vm.attr('instance', newInstance);

      expect(vm.attr('instance')).toEqual(newInstance);
    });

    it('assigns empty array to _pendingJoins of instance ' +
    'if it is not defined', () => {
      const newInstance = new canMap({});
      vm.attr('instance', newInstance);

      expect(vm.attr('instance._pendingJoins').serialize()).toEqual([]);
    });
  });

  describe('setter of "preMappedObjects"', () => {
    let objects;

    beforeEach(() => {
      objects = new canList([1, 2, 3]);
      spyOn(vm, 'addMappings');
    });

    it('sets new objects', () => {
      vm.attr('preMappedObjects', []);
      vm.attr('preMappedObjects', objects);

      expect(vm.attr('preMappedObjects')).toEqual(objects);
    });

    it('calls addMappings with objects', () => {
      vm.attr('preMappedObjects', objects);

      expect(vm.addMappings).toHaveBeenCalledWith(objects);
    });

    it('does not call addMappings if objects are empty', () => {
      vm.attr('preMappedObjects', []);

      expect(vm.addMappings).not.toHaveBeenCalledWith(objects);
    });
  });

  describe('performMapActions(instance, objects) method', function () {
    beforeEach(() => {
      spyOn(MapperUtils, 'mapObjects')
        .and.returnValue($.Deferred().resolve());
    });

    it('calls MapperUtils.mapObjects with specified arguments', (done) => {
      const instance = {};
      const objects = [
        new canMap({id: 0}),
        new canMap({id: 1}),
      ];
      vm.attr('useSnapshots', {});

      vm.performMapActions(instance, objects)
        .then(() => {
          expect(MapperUtils.mapObjects).toHaveBeenCalledWith(
            instance,
            objects,
            {useSnapshots: vm.attr('useSnapshots')}
          );
          done();
        });
    });

    it('does not call MapperUtils.mapObjects if no objects to map', (done) => {
      vm.performMapActions({}, []).then(() => {
        expect(MapperUtils.mapObjects).not.toHaveBeenCalled();
        done();
      });
    });
  });

  describe('performUnmapActions(instance, objects) method', () => {
    beforeEach(() => {
      spyOn(MapperUtils, 'unmapObjects')
        .and.returnValue($.Deferred().resolve());
    });

    it('calls MapperUtils.unmapObjects with specified arguments', (done) => {
      const instance = {};
      const objects = [
        new canMap({id: 0}),
        new canMap({id: 1}),
      ];

      vm.performUnmapActions(instance, objects)
        .then(() => {
          expect(MapperUtils.unmapObjects)
            .toHaveBeenCalledWith(instance, objects);
          done();
        });
    });

    it('does not call MapperUtils.mapObjects if no objects to unmap',
      (done) => {
        vm.performUnmapActions({}, []).then(() => {
          expect(MapperUtils.unmapObjects).not.toHaveBeenCalled();
          done();
        });
      });
  });

  describe('afterDeferredUpdate(objectsToMap, objectsToUnmap) method', () => {
    let instance;
    let pageInstance;

    beforeEach(() => {
      instance = new canMap({
        type: 'instanceType',
      });
      vm.attr('instance', instance);
      spyOn(instance, 'dispatch');

      pageInstance = new canMap({
        id: 711,
        type: 'pageInstanceType',
      });
      spyOn(pageInstance, 'dispatch');
      spyOn(CurrentPageUtils, 'getPageInstance')
        .and.returnValue(pageInstance);
    });

    it('dispatches DEFERRED_MAPPED_UNMAPPED event with mapped and unmapped ' +
      'objects', () => {
      vm.afterDeferredUpdate(
        [{type: 'Type1'}, {type: 'Type2'}],
        [{type: 'Type3'}, {type: 'Type4'}],
      );

      expect(instance.dispatch).toHaveBeenCalledWith({
        ...DEFERRED_MAPPED_UNMAPPED,
        mapped: [{type: 'Type1'}, {type: 'Type2'}],
        unmapped: [{type: 'Type3'}, {type: 'Type4'}],
      });
    });

    it('dispatches REFRESH_MAPPING event once for each type of objects',
      () => {
        const objects = [
          {
            type: 'type1',
          },
          {
            type: 'type1',
          },
          {
            type: 'type2',
          },
        ];
        const objectTypes = loUniq(objects
          .map((object) => object.type)
        );

        vm.afterDeferredUpdate(objects, []);

        objectTypes.forEach((objectType) => {
          let callsArgs = instance.dispatch.calls.allArgs()
            .map((args) => args[0]);
          let callCount = callsArgs.filter((args) =>
            args.type === REFRESH_MAPPING.type &&
            args.destinationType === objectType).length;

          expect(callCount).toBe(1);
        });
      });

    it('dispatches REFRESH_SUB_TREE event on instance', () => {
      vm.afterDeferredUpdate([], []);

      expect(instance.dispatch).toHaveBeenCalledWith(REFRESH_SUB_TREE);
    });

    it('dispatches REFRESH_MAPPING event on pageInstance', () => {
      vm.afterDeferredUpdate([pageInstance], []);

      expect(pageInstance.dispatch).toHaveBeenCalledWith({
        ...REFRESH_MAPPING,
        destinationType: instance.type,
      });
    });

    it('does not dispatch REFRESH_MAPPING event on pageInstance ' +
    'if it is not in "objects"', () => {
      vm.afterDeferredUpdate([{}], []);

      expect(pageInstance.dispatch).not.toHaveBeenCalledWith({
        ...REFRESH_MAPPING,
        destinationType: instance.type,
      });
    });
  });

  describe('async deferredUpdate() method', () => {
    beforeEach(() => {
      vm.attr('instance', {});
      vm.attr('instance._pendingJoins', [
        {
          how: 'map',
          what: {},
        },
        {
          how: 'unmap',
          what: {},
        },
      ]);

      spyOn(vm, 'performMapActions').and.returnValue(Promise.resolve());
      spyOn(vm, 'performUnmapActions').and.returnValue(Promise.resolve());
      spyOn(vm, 'afterDeferredUpdate');
    });

    it('doesn\'t perform map/unmap handling when there are no pending ' +
    'operations', () => {
      vm.attr('instance._pendingJoins', []);

      vm.deferredUpdate();

      expect(vm.performMapActions).not.toHaveBeenCalled();
      expect(vm.performUnmapActions).not.toHaveBeenCalled();
    });

    it('calls performMapActions for objects pending mapping', async (done) => {
      const objectsToMap =
        loFilter(vm.attr('instance._pendingJoins'), ({how}) => how === 'map')
          .map(({what}) => what);

      await vm.deferredUpdate();

      expect(vm.performMapActions).toHaveBeenCalledWith(
        vm.attr('instance'),
        objectsToMap
      );
      done();
    });

    it('calls performUnmapActions for objects pending mapping',
      async (done) => {
        const objectsToUnmap = loFilter(vm.attr('instance._pendingJoins'),
          ({how}) => how === 'unmap')
          .map(({what}) => what);

        await vm.deferredUpdate();

        expect(vm.performUnmapActions).toHaveBeenCalledWith(
          vm.attr('instance'),
          objectsToUnmap
        );
        done();
      });

    it('assigns empty array to _pendingJoins of instance', async (done) => {
      await vm.deferredUpdate();

      expect(vm.attr('instance._pendingJoins').serialize()).toEqual([]);
      done();
    });

    it('calls afterDeferredUpdate for all pending objects', async (done) => {
      const expectedMapped = [
        new canMap({type: 'Type1'}),
        new canMap({type: 'Type3'}),
      ];
      const expectedUnmapped = [
        new canMap({type: 'Type2'}),
        new canMap({type: 'Type4'}),
      ];

      vm.attr('instance._pendingJoins', [
        ...expectedMapped.map((what) => ({what, how: 'map'})),
        ...expectedUnmapped.map((what) => ({what, how: 'unmap'})),
      ]);

      await vm.deferredUpdate();

      expect(vm.afterDeferredUpdate).toHaveBeenCalledWith(
        expectedMapped,
        expectedUnmapped,
      );

      done();
    });
  });

  describe('addMappings(objects) method', () => {
    let originalPendings;

    beforeEach(() => {
      originalPendings = [
        {
          how: 'map',
          what: {id: 1, type: 'type1'},
        },
        {
          how: 'unmap',
          what: {id: 2, type: 'type1'},
        },
      ];
      vm.attr('instance', {});
      vm.attr('instance._pendingJoins', originalPendings);
    });

    it('adds map pending for object ' +
    'if unmap pending does not exist for this object', () => {
      const objects = [{id: 3, type: 'type1'}, {id: 4, type: 'type1'}];

      vm.addMappings(objects);

      const expected = originalPendings.concat(
        objects.map((obj) => ({what: obj, how: 'map'}))
      );

      expect(vm.attr('instance._pendingJoins').serialize()).toEqual(expected);
    });

    it('removes unmap pending for object if exists', () => {
      const objects = [
        {id: 3, type: 'type1'}, // should be added to originalPendings
        {id: 4, type: 'type1'}, // should be added to originalPendings
        {id: 2, type: 'type1'}, // should be removed from originalPendings
      ];

      vm.addMappings(objects);

      const expected = [
        {
          how: 'map',
          what: {id: 1, type: 'type1'},
        },
        {
          how: 'map',
          what: {id: 3, type: 'type1'},
        },
        {
          how: 'map',
          what: {id: 4, type: 'type1'},
        },
      ];

      expect(vm.attr('instance._pendingJoins').serialize()).toEqual(expected);
    });
  });

  describe('removeMappings(obj) method', () => {
    let originalPendings;

    beforeEach(() => {
      originalPendings = [
        {
          how: 'map',
          what: {id: 1, type: 'type1'},
        },
        {
          how: 'unmap',
          what: {id: 2, type: 'type1'},
        },
      ];
      vm.attr('instance', {});
      vm.attr('instance._pendingJoins', originalPendings);
    });

    it('adds unmap pending for object ' +
    'if map pending does not exist for this object', () => {
      let obj = {id: 3, type: 'type1'};

      vm.removeMappings(obj);

      let expected = originalPendings.concat([{
        what: obj,
        how: 'unmap',
      }]);

      expect(vm.attr('instance._pendingJoins').serialize()).toEqual(expected);
    });

    it('removes map pending for object if exists', () => {
      let obj = {id: 1, type: 'type1'};

      vm.removeMappings(obj);

      let expected = originalPendings.filter(
        ({what}) => !(what.id === obj.id && what.type === obj.type)
      );

      expect(vm.attr('instance._pendingJoins').serialize()).toEqual(expected);
    });

    it('dispatches "removeMappings" event with removed mapped object', () => {
      let obj = {id: 1, type: 'type1'};
      spyOn(vm, 'dispatch');

      vm.removeMappings(obj);

      expect(vm.dispatch).toHaveBeenCalledWith({
        type: 'removeMappings',
        object: obj,
      });
    });
  });

  const events = Component.prototype.events;

  describe('"{instance} updated" event handler', () => {
    it('calls deferredUpdate of viewModel', () => {
      const handler = events['{instance} updated'].bind({
        viewModel: vm,
      });
      spyOn(vm, 'deferredUpdate');

      handler();

      expect(vm.deferredUpdate).toHaveBeenCalled();
    });
  });

  describe('"{instance} created" event handler', () => {
    it('calls deferredUpdate of viewModel', () => {
      const handler = events['{instance} created'].bind({
        viewModel: vm,
      });
      spyOn(vm, 'deferredUpdate');

      handler();

      expect(vm.deferredUpdate).toHaveBeenCalled();
    });
  });

  describe('"{instance} ${DEFERRED_MAP_OBJECTS.type}" event handler', () => {
    let handler;
    let objects;

    beforeEach(() => {
      handler = events[`{instance} ${DEFERRED_MAP_OBJECTS.type}`].bind({
        viewModel: vm,
      });
      objects = [1, 2, 3];
      spyOn(vm, 'addMappings');
      spyOn(vm, 'dispatch');
    });

    it('calls addMappings of viewModel for passed objects', () => {
      handler({}, {objects});

      expect(vm.addMappings).toHaveBeenCalledWith(objects);
    });

    it('dispatches "addMappings" event with new mapped objects', () => {
      handler({}, {objects});

      expect(vm.dispatch).toHaveBeenCalledWith({type: 'addMappings', objects});
    });
  });

  describe('"removed" event handler', () => {
    let handler;

    beforeEach(() => {
      handler = events.removed.bind({
        viewModel: vm,
      });
    });

    it('removes "_pendingJoins" attr of instance', () => {
      vm.attr('instance', {
        _pendingJoins: [1, 2, 3],
      });

      handler();

      expect(vm.attr('instance._pendingJoins')).toBe(undefined);
    });

    it('works correctly if no instance in viewModel', () => {
      vm.attr('instance', null);

      expect(handler).not.toThrow(jasmine.any(Error));
    });
  });
});
