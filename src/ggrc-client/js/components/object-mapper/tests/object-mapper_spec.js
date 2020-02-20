/*
  Copyright (C) 2020 Google Inc.
  Licensed under http://www.apache.org/licenses/LICENSE-2.0 <see LICENSE file>
*/

import canMap from 'can-map';
import * as SnapshotUtils from '../../../plugins/utils/snapshot-utils';
import RefreshQueue from '../../../models/refresh-queue';
import * as CurrentPageUtils from '../../../plugins/utils/current-page-utils';
import Component from '../object-mapper';
import Program from '../../../models/business-models/program';
import * as modelsUtils from '../../../plugins/utils/models-utils';
import {DEFERRED_MAP_OBJECTS, UNMAP_DESTROYED_OBJECT} from '../../../events/event-types';
import * as Mappings from '../../../models/mappers/mappings';

describe('object-mapper component', () => {
  let events;
  let viewModel;
  let parentViewModel;
  let handler;
  let helpers;

  beforeAll(() => {
    events = Component.prototype.events;
    helpers = Component.prototype.helpers;
  });

  beforeEach(() => {
    parentViewModel = new canMap({
      general: {
        useSnapshots: false,
      },
      special: [],
    });
    const ViewModel = Component.prototype.viewModel({}, parentViewModel);
    ViewModel.seal = false;
    viewModel = new ViewModel();
  });

  describe('viewModel() method', () => {
    it(`initializes join_object_id with "join-object-id"
    if isNew flag is not passed`,
    () => {
      parentViewModel.attr('general.join-object-id', 'testId');
      let result = Component.prototype.viewModel({}, parentViewModel)();
      expect(result.join_object_id).toBe('testId');
    });

    it(`initializes join_object_id with page instance id if
    "join-object-id" and "isNew" are not passed`,
    () => {
      spyOn(CurrentPageUtils, 'getPageInstance')
        .and.returnValue({id: 'testId'});
      let result = Component.prototype.viewModel({}, parentViewModel)();
      expect(result.join_object_id).toBe('testId');
    });

    it('initializes join_object_id with null if isNew flag is passed',
      () => {
        parentViewModel.attr('general.isNew', true);
        let result = Component.prototype.viewModel({}, parentViewModel)();
        expect(result.join_object_id).toBe(null);
      });

    it('returns object with function "isLoadingOrSaving"', () => {
      let result = Component.prototype.viewModel({}, parentViewModel)();
      expect(result.isLoadingOrSaving).toEqual(jasmine.any(Function));
    });

    describe('initializes useSnapshots flag', () => {
      it('with true if set with help a general config', () => {
        let result;
        parentViewModel.general.useSnapshots = true;
        result = Component.prototype.viewModel({}, parentViewModel)();
        expect(result.useSnapshots).toEqual(true);
      });

      it('do not use Snapshots if not an audit-scope model', () => {
        let result;
        spyOn(SnapshotUtils, 'isAuditScopeModel')
          .and.returnValue(false);
        result = Component.prototype.viewModel({}, parentViewModel)();
        expect(result.useSnapshots).toEqual(false);
      });
    });

    describe('isLoadingOrSaving() method', () => {
      it('returns true if it is saving', () => {
        viewModel.is_saving = true;
        expect(viewModel.isLoadingOrSaving()).toEqual(true);
      });
      it('returns true if it is loading', () => {
        viewModel.is_loading = true;
        expect(viewModel.isLoadingOrSaving()).toEqual(true);
      });
      it('returns false if page is not loading, it is not saving,' +
        ' type change is not blocked and it is not loading', () => {
        viewModel.is_saving = false;
        viewModel.is_loading = false;
        expect(viewModel.isLoadingOrSaving()).toEqual(false);
      });
    });

    describe('updateFreezedConfigToLatest() method', () => {
      it('sets freezedConfigTillSubmit field to currConfig', () => {
        viewModel.currConfig = {
          general: {
            prop1: {},
            prop2: {},
          },
          special: [{
            types: ['Type1', 'Type2'],
            config: {},
          }],
        };

        viewModel.updateFreezedConfigToLatest();
        expect(viewModel.freezedConfigTillSubmit)
          .toBe(viewModel.currConfig);
      });
    });

    describe('onSubmit() method', () => {
      beforeEach(() => {
        viewModel.assign({
          freezedConfigTillSubmit: null,
          currConfig: {
            a: 1,
            b: 2,
          },
        });
      });

      it('sets freezedConfigTillSubmit to currConfig',
        () => {
          viewModel.onSubmit();

          expect(viewModel.freezedConfigTillSubmit).toEqual(
            viewModel.currConfig
          );
        });
    });

    describe('onDestroyItem() method', () => {
      it('should remove item from deferred_to.list',
        () => {
          const item = {id: 1};
          viewModel.assign({
            deferred_to: {
              instance: {},
              list: [{id: 1}, {id: 2}],
            },
          });
          viewModel.onDestroyItem(item);
          expect(viewModel.deferred_to.list.length).toBe(1);
          expect(viewModel.deferred_to.list).not.toContain(
            jasmine.objectContaining(item)
          );
        });

      it('should remove item from deferred_to.instance.list',
        () => {
          const item = {id: 1, type: 'a'};
          viewModel.assign({
            deferred_to: {
              instance: {
                list: [{id: 1, type: 'a'}, {id: 2, type: 'b'}],
              },
              list: [{id: 1, type: 'a'}, {id: 2, type: 'b'}],
            },
          });
          viewModel.onDestroyItem(item);
          expect(viewModel.deferred_to.instance.list.length).toBe(1);
          expect(viewModel.deferred_to.instance.list).not.toContain(
            jasmine.objectContaining(item)
          );
        });

      it('should not remove non-existent item',
        () => {
          const item = {id: 3, type: 'c'};
          viewModel.assign({
            deferred_to: {
              instance: {
                list: [{id: 1, type: 'a'}, {id: 2, type: 'b'}],
              },
              list: [{id: 1, type: 'a'}, {id: 2, type: 'b'}],
            },
          });
          viewModel.onDestroyItem(item);
          expect(viewModel.deferred_to.instance.list.length).toBe(2);
          expect(viewModel.deferred_to.list.length).toBe(2);
        });

      it('dispatches UNMAP_DESTROYED_OBJECT',
        () => {
          const item = {id: 1, type: 'a'};
          viewModel.assign({
            deferred_to: {
              instance: {
                list: [{id: 1, type: 'a'}, {id: 2, type: 'b'}],
              },
              list: [{id: 1, type: 'a'}, {id: 2, type: 'b'}],
            },
          });
          const object = viewModel.deferred_to.list[0];
          spyOn(viewModel.deferred_to.instance, 'dispatch');
          viewModel.onDestroyItem(item);

          expect(viewModel.deferred_to.instance.dispatch)
            .toHaveBeenCalledWith({
              ...UNMAP_DESTROYED_OBJECT,
              object,
            });
        });
    });
  });

  describe('map() method', () => {
    let spyObj;

    beforeEach(() => {
      handler = events['map'];
      spyObj = jasmine.createSpy();
    });

    it('calls mapObjects to map results', () => {
      handler.call({
        viewModel: viewModel,
        mapObjects: spyObj,
      }, []);
      expect(spyObj).toHaveBeenCalledWith([]);
    });

    it('calls deferredSave to map results and mapper is deferred', () => {
      viewModel.deferred = true;
      handler.call({
        viewModel: viewModel,
        deferredSave: spyObj,
      }, []);
      expect(spyObj).toHaveBeenCalledWith([]);
    });

    it('calls performMegaMap to map results for mega-objects ' +
      'if "options" and "options.megaMapping" are truthy values', () => {
      const objects = jasmine.any(Object);
      const options = {
        megaMapping: true,
        megaRelation: 'child',
      };
      viewModel.deferred = false;
      handler.call({
        viewModel: viewModel,
        performMegaMap: spyObj,
      }, objects, options);
      expect(spyObj).toHaveBeenCalledWith(objects, options.megaRelation);
    });
  });

  describe('"create-and-map click" event', () => {
    let element = {};

    beforeEach(() => {
      viewModel.assign({});
      handler = events['create-and-map click'];
      element.trigger = jasmine.createSpy();
    });

    it('triggers "hideModal" event', () => {
      handler.call({viewModel: viewModel, element: element});
      expect(element.trigger).toHaveBeenCalledWith('hideModal');
    });
  });

  describe('"create-and-map canceled" event', () => {
    let element = {};

    beforeEach(() => {
      handler = events['create-and-map canceled'];
      element.trigger = jasmine.createSpy();
    });

    it('triggers "showModal"', () => {
      handler.call({
        element,
      });
      expect(element.trigger).toHaveBeenCalledWith('showModal');
    });
  });

  describe('"{pubSub} mapAsChild" event', () => {
    let element = {};
    let event;
    let that;

    beforeEach(() => {
      event = {
        id: 22,
        val: 'child',
      };
      that = {
        viewModel: viewModel,
      };
      handler = events['{pubSub} mapAsChild'];
    });

    it('assigns "event.val" to "megaRelationObj" attr by "event.id"',
      () => {
        handler.call(that, element, event);
        expect(viewModel.megaRelationObj[event.id]).toBe(event.val);
      });
  });

  describe('"inserted" event', () => {
    let that;

    beforeEach(() => {
      viewModel.assign({
        selected: [1, 2, 3],
        onSubmit: () => {},
      });
      that = {
        viewModel: viewModel,
      };
      handler = events.inserted;
    });

    it('sets empty array to selected', () => {
      handler.call(that);
      expect(viewModel.selected.length)
        .toEqual(0);
    });
  });

  describe('"performMegaMap" event', () => {
    let spyObj;

    beforeEach(() => {
      handler = events['performMegaMap'];
      spyObj = jasmine.createSpy();
    });

    it('calls mapObjects to map results for mega-objects', () => {
      const objects = [
        {id: 101},
        {id: 102},
      ];
      const relation = 'child';
      const relationsObj = {
        '101': relation,
        '102': relation,
      };

      handler.call({
        mapObjects: spyObj,
      }, objects, relation);
      expect(spyObj).toHaveBeenCalledWith(objects, true, relationsObj);
    });
  });

  describe('"closeModal" event', () => {
    let element;
    let spyObj;

    beforeEach(() => {
      viewModel.assign({});
      spyObj = {
        trigger: () => {},
      };
      element = {
        find: () => {
          return spyObj;
        },
      };
      spyOn(spyObj, 'trigger');
      handler = events.closeModal;
    });

    it('sets false to is_saving', () => {
      viewModel.is_saving = true;
      handler.call({
        element: element,
        viewModel: viewModel,
      });
      expect(viewModel.is_saving).toEqual(false);
    });
    it('dismiss the modal', () => {
      handler.call({
        element: element,
        viewModel: viewModel,
      });
      expect(spyObj.trigger).toHaveBeenCalledWith('click');
    });
  });

  describe('"deferredSave" event', () => {
    let that;

    beforeEach(() => {
      viewModel.assign({
        deferred_to: {
          instance: {},
        },
      });
      that = {
        viewModel,
        closeModal: jasmine.createSpy('closeModal'),
      };
      spyOn(Mappings, 'allowedToMap').and.returnValue(false);
      handler = events.deferredSave.bind(that);
    });

    it('dispatches DEFERRED_MAP_OBJECTS for source with objects, ' +
    'which are allowed to map', () => {
      const objects = [{type: 'Type1'}];
      const dispatch = jasmine.createSpy('dispatch');
      viewModel.deferred_to.instance.dispatch = dispatch;
      Mappings.allowedToMap.and.returnValue(true);
      handler(objects);

      expect(dispatch).toHaveBeenCalledWith({
        ...DEFERRED_MAP_OBJECTS,
        objects,
      });
    });
    it('calls closeModal', () => {
      handler([]);
      expect(that.closeModal).toHaveBeenCalled();
    });
  });

  describe('".modal-footer .btn-map click" handler', () => {
    let that;
    let event;
    let element;
    let instance;

    beforeEach(() => {
      viewModel.assign({
        type: 'type',
        object: 'Program',
        join_object_id: '123',
        selected: [],
      });
      viewModel.deferred = false;

      instance = new canMap({
        refresh: $.noop,
      });
      spyOn(Program, 'findInCacheById')
        .and.returnValue(instance);
      event = {
        preventDefault: () => {},
      };
      element = $('<div></div>');
      handler = events['.modal-footer .btn-map click'];
      that = {
        viewModel: viewModel,
        deferredSave: jasmine.createSpy().and.returnValue('deferredSave'),
        proceedWithRegularMapping: events.proceedWithRegularMapping,
        proceedWithMegaMapping: events.proceedWithMegaMapping,
      };
      spyOn(RefreshQueue.prototype, 'enqueue')
        .and.returnValue({
          trigger: jasmine.createSpy()
            .and.returnValue($.Deferred().resolve()),
        });
      spyOn($.prototype, 'trigger');
    });

    it('does nothing if element has class "disabled"', () => {
      let result;
      element.addClass('disabled');
      result = handler.call(that, element, event);
      expect(result).toEqual(undefined);
    });

    it('calls deferredSave if it is deferred', () => {
      let result;
      viewModel.deferred = true;
      result = handler.call(that, element, event);
      expect(result).toEqual('deferredSave');
    });

    it('calls proceedWithRegularMapping', () => {
      viewModel.object = 'Program';
      viewModel.type = 'Control';

      spyOn(that, 'proceedWithRegularMapping');
      handler.call(that, element, event);
      expect(that.proceedWithRegularMapping).toHaveBeenCalled();
    });

    it('calls proceedWithMegaMapping', () => {
      viewModel.object = 'Program';
      viewModel.type = 'Program';

      spyOn(that, 'proceedWithMegaMapping');
      handler.call(that, element, event);
      expect(that.proceedWithMegaMapping).toHaveBeenCalled();
    });
  });

  describe('proceedWithRegularMapping method', () => {
    let that;

    beforeEach(() => {
      that = {
        viewModel,
        mapObjects: events.mapObjects,
      };
      handler = events.proceedWithRegularMapping.bind(that);
    });

    it('calls mapObjects', () => {
      spyOn(that, 'mapObjects');
      handler([]);
      expect(that.mapObjects).toHaveBeenCalledWith([]);
    });
  });

  describe('get_title() helper', () => {
    let helper;
    beforeEach(() => {
      helper = helpers.get_title;
    });

    it('returns title of parentInstance if parentInstance defined',
      () => {
        let result;
        spyOn(modelsUtils, 'getInstance').and.returnValue({
          title: 'mockTitle',
        });
        result = helper.call(viewModel);
        expect(result).toEqual('mockTitle');
      });
    it('returns object if parentInstance undefined',
      () => {
        let result;
        viewModel.assign({
          object: 'mockInstance',
          parentInstance: undefined,
        });
        result = helper.call(viewModel);
        expect(result).toEqual('mockInstance');
      });
  });

  describe('get_object() helper', () => {
    let helper;

    beforeEach(() => {
      helper = helpers.get_object;
    });

    it('returns type.title_plural if it is defined', () => {
      let result;
      viewModel.assign({
        type: 'Program',
      });
      result = helper.call(viewModel);
      expect(result).toEqual('Programs');
    });
    it('returns "Objects" if type.title_plural is null', () => {
      let result;
      viewModel.assign({
        type: null,
      });
      result = helper.call(viewModel);
      expect(result).toEqual('Objects');
    });
  });

  describe('isSnapshotMapping() method', () => {
    it('returns false if is an audit-scope model', () => {
      let result;
      spyOn(SnapshotUtils, 'isAuditScopeModel').and.returnValue(true);
      result = viewModel.isSnapshotMapping();
      expect(result).toEqual(false);
    });

    it('returns true if source object is a Snapshot parent and mapped type ' +
      'is snapshotable', () => {
      let result;
      spyOn(SnapshotUtils, 'isAuditScopeModel').and.returnValue(false);
      viewModel.object = 'Audit';
      viewModel.type = 'Control';
      result = viewModel.isSnapshotMapping();
      expect(result).toEqual(true);
    });

    it('returns true if mapped object is both a ' +
      'Snapshot parent and snapshotable', () => {
      let result;
      spyOn(SnapshotUtils, 'isAuditScopeModel').and.returnValue(false);
      spyOn(SnapshotUtils, 'isSnapshotParent').and.callFake((v) => {
        return v === 'o';
      });
      viewModel.object = 'o';
      viewModel.type = 'Control';
      result = viewModel.isSnapshotMapping();
      expect(result).toEqual(true);
    });
  });
});
