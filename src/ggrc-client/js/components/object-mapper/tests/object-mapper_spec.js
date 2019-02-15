/*
  Copyright (C) 2019 Google Inc.
  Licensed under http://www.apache.org/licenses/LICENSE-2.0 <see LICENSE file>
*/

import * as SnapshotUtils from '../../../plugins/utils/snapshot-utils';
import RefreshQueue from '../../../models/refresh_queue';
import * as CurrentPageUtils from '../../../plugins/utils/current-page-utils';
import Component from '../object-mapper';
import Program from '../../../models/business-models/program';
import * as modelsUtils from '../../../plugins/utils/models-utils';
import {DEFERRED_MAP_OBJECTS} from '../../../events/eventTypes';
import Mappings from '../../../models/mappers/mappings';

describe('object-mapper component', function () {
  let events;
  let viewModel;
  let handler;
  let helpers;

  beforeAll(function () {
    events = Component.prototype.events;
    helpers = Component.prototype.helpers;
  });

  describe('viewModel() method', function () {
    let parentViewModel;
    beforeEach(function () {
      parentViewModel = new can.Map({
        general: {
          useSnapshots: false,
        },
        special: [],
      });
    });

    it(`initializes join_object_id with "join-object-id"
    if isNew flag is not passed`,
    function () {
      parentViewModel.attr('general.join-object-id', 'testId');
      let result = Component.prototype.viewModel({}, parentViewModel)();
      expect(result.join_object_id).toBe('testId');
    });

    it(`initializes join_object_id with page instance id if
    "join-object-id" and "isNew" are not passed`,
    function () {
      spyOn(CurrentPageUtils, 'getPageInstance')
        .and.returnValue({id: 'testId'});
      let result = Component.prototype.viewModel({}, parentViewModel)();
      expect(result.join_object_id).toBe('testId');
    });

    it('initializes join_object_id with null if isNew flag is passed',
      function () {
        parentViewModel.attr('general.isNew', true);
        let result = Component.prototype.viewModel({}, parentViewModel)();
        expect(result.join_object_id).toBe(null);
      });

    it('returns object with function "isLoadingOrSaving"', function () {
      let result = Component.prototype.viewModel({}, parentViewModel)();
      expect(result.isLoadingOrSaving).toEqual(jasmine.any(Function));
    });

    describe('initializes useSnapshots flag', function () {
      it('with true if set with help a general config', function () {
        let result;
        parentViewModel.general.useSnapshots = true;
        result = Component.prototype.viewModel({}, parentViewModel)();
        expect(result.attr('useSnapshots')).toEqual(true);
      });

      it('do not use Snapshots if not an audit-scope model', function () {
        let result;
        spyOn(SnapshotUtils, 'isAuditScopeModel')
          .and.returnValue(false);
        result = Component.prototype.viewModel({}, parentViewModel)();
        expect(result.attr('useSnapshots')).toEqual(false);
      });
    });

    describe('isLoadingOrSaving() method', function () {
      beforeEach(function () {
        viewModel = new Component.prototype.viewModel({}, parentViewModel)();
      });
      it('returns true if it is saving', function () {
        viewModel.attr('is_saving', true);
        expect(viewModel.isLoadingOrSaving()).toEqual(true);
      });
      it('returns true if it is loading', function () {
        viewModel.attr('is_loading', true);
        expect(viewModel.isLoadingOrSaving()).toEqual(true);
      });
      it('returns false if page is not loading, it is not saving,' +
      ' type change is not blocked and it is not loading', function () {
        viewModel.attr('is_saving', false);
        viewModel.attr('is_loading', false);
        expect(viewModel.isLoadingOrSaving()).toEqual(false);
      });
    });

    describe('updateFreezedConfigToLatest() method', function () {
      it('sets freezedConfigTillSubmit field to currConfig', function () {
        viewModel.attr('currConfig', {
          general: {
            prop1: {},
            prop2: {},
          },
          special: [{
            types: ['Type1', 'Type2'],
            config: {},
          }],
        });

        viewModel.updateFreezedConfigToLatest();
        expect(viewModel.attr('freezedConfigTillSubmit'))
          .toBe(viewModel.attr('currConfig'));
      });
    });

    describe('onSubmit() method', function () {
      let vm;

      beforeEach(function () {
        vm = new Component.prototype.viewModel({}, parentViewModel)();
        vm.attr({
          freezedConfigTillSubmit: null,
          currConfig: {
            a: 1,
            b: 2,
          },
        });
      });

      it('sets freezedConfigTillSubmit to currConfig',
        function () {
          vm.onSubmit();

          expect(vm.attr('freezedConfigTillSubmit')).toEqual(
            vm.attr('currConfig')
          );
        });
    });
  });

  describe('map() method', function () {
    let spyObj;

    beforeEach(function () {
      handler = events['map'];
      spyObj = jasmine.createSpy();
    });

    it('updates freezed config to the current config', function () {
      _.assign(viewModel, {
        updateFreezedConfigToLatest:
          jasmine.createSpy('updateFreezedConfigToLatest'),
      });

      handler.call({
        viewModel: viewModel,
        mapObjects: spyObj,
      }, []);
      expect(viewModel.updateFreezedConfigToLatest).toHaveBeenCalled();
    });

    it('calls mapObjects to map results', function () {
      handler.call({
        viewModel: viewModel,
        mapObjects: spyObj,
      }, []);
      expect(spyObj).toHaveBeenCalledWith([]);
    });

    it('calls deferredSave to map results and mapper is deferred', function () {
      viewModel.attr('deferred', true);
      handler.call({
        viewModel: viewModel,
        deferredSave: spyObj,
      }, []);
      expect(spyObj).toHaveBeenCalledWith([]);
    });
  });

  describe('"create-and-map click" event', function () {
    let element = {};

    beforeEach(function () {
      viewModel.attr({});
      handler = events['create-and-map click'];
      element.trigger = jasmine.createSpy();
    });

    it('triggers "hideModal" event', function () {
      handler.call({viewModel: viewModel, element: element});
      expect(element.trigger).toHaveBeenCalledWith('hideModal');
    });
  });

  describe('"create-and-map canceled" event', function () {
    let element = {};

    beforeEach(function () {
      handler = events['create-and-map canceled'];
      element.trigger = jasmine.createSpy();
    });

    it('triggers "showModal"', function () {
      handler.call({
        element,
      });
      expect(element.trigger).toHaveBeenCalledWith('showModal');
    });
  });

  describe('"inserted" event', function () {
    let that;

    beforeEach(function () {
      viewModel.attr({
        selected: [1, 2, 3],
        entries: [3, 2, 1],
        onSubmit: function () {},
      });
      that = {
        viewModel: viewModel,
      };
      handler = events.inserted;
    });

    it('sets empty array to selected', function () {
      handler.call(that);
      expect(viewModel.attr('selected').length)
        .toEqual(0);
    });
    it('sets empty array to entries', function () {
      handler.call(that);
      expect(viewModel.attr('entries').length)
        .toEqual(0);
    });
  });

  describe('"closeModal" event', function () {
    let element;
    let spyObj;

    beforeEach(function () {
      viewModel.attr({});
      spyObj = {
        trigger: function () {},
      };
      element = {
        find: function () {
          return spyObj;
        },
      };
      spyOn(spyObj, 'trigger');
      handler = events.closeModal;
    });

    it('sets false to is_saving', function () {
      viewModel.attr('is_saving', true);
      handler.call({
        element: element,
        viewModel: viewModel,
      });
      expect(viewModel.attr('is_saving')).toEqual(false);
    });
    it('dismiss the modal', function () {
      handler.call({
        element: element,
        viewModel: viewModel,
      });
      expect(spyObj.trigger).toHaveBeenCalledWith('click');
    });
  });

  describe('"deferredSave" event', function () {
    let that;

    beforeEach(function () {
      viewModel.attr({
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
    'which are allowed to map', function () {
      const objects = [{type: 'Type1'}];
      const dispatch = jasmine.createSpy('dispatch');
      viewModel.attr('deferred_to.instance').dispatch = dispatch;
      Mappings.allowedToMap.and.returnValue(true);
      handler(objects);

      expect(dispatch).toHaveBeenCalledWith({
        ...DEFERRED_MAP_OBJECTS,
        objects,
      });
    });
    it('calls closeModal', function () {
      handler([]);
      expect(that.closeModal).toHaveBeenCalled();
    });
  });

  describe('".modal-footer .btn-map click" handler', function () {
    let that;
    let event;
    let element;
    let instance;

    beforeEach(function () {
      viewModel.attr({
        type: 'type',
        object: 'Program',
        join_object_id: '123',
        selected: [],
      });
      viewModel.attr('deferred', false);

      instance = new can.Map({
        refresh: $.noop,
      });
      spyOn(Program, 'findInCacheById')
        .and.returnValue(instance);
      event = {
        preventDefault: function () {},
      };
      element = $('<div></div>');
      handler = events['.modal-footer .btn-map click'];
      that = {
        viewModel: viewModel,
        deferredSave: jasmine.createSpy().and.returnValue('deferredSave'),
        mapObjects: events.mapObjects,
      };
      spyOn(RefreshQueue.prototype, 'enqueue')
        .and.returnValue({
          trigger: jasmine.createSpy()
            .and.returnValue($.Deferred().resolve()),
        });
      spyOn($.prototype, 'trigger');
    });

    it('does nothing if element has class "disabled"', function () {
      let result;
      element.addClass('disabled');
      result = handler.call(that, element, event);
      expect(result).toEqual(undefined);
    });

    it('calls deferredSave if it is deferred', function () {
      let result;
      viewModel.attr('deferred', true);
      result = handler.call(that, element, event);
      expect(result).toEqual('deferredSave');
    });

    it('maps selected objects', function () {
      spyOn(that, 'mapObjects');
      handler.call(that, element, event);
      expect(that.mapObjects).toHaveBeenCalled();
    });
  });

  describe('get_title() helper', function () {
    let helper;
    beforeEach(function () {
      helper = helpers.get_title;
    });

    it('returns title of parentInstance if parentInstance defined',
      function () {
        let result;
        spyOn(modelsUtils, 'getInstance').and.returnValue({
          title: 'mockTitle',
        });
        result = helper.call(viewModel);
        expect(result).toEqual('mockTitle');
      });
    it('returns object if parentInstance undefined',
      function () {
        let result;
        viewModel.attr({
          object: 'mockInstance',
          parentInstance: undefined,
        });
        result = helper.call(viewModel);
        expect(result).toEqual('mockInstance');
      });
  });

  describe('get_object() helper', function () {
    let helper;

    beforeEach(function () {
      helper = helpers.get_object;
    });

    it('returns type.title_plural if it is defined', function () {
      let result;
      viewModel.attr({
        type: 'Program',
      });
      result = helper.call(viewModel);
      expect(result).toEqual('Programs');
    });
    it('returns "Objects" if type.title_plural is null', function () {
      let result;
      viewModel.attr({
        type: null,
      });
      result = helper.call(viewModel);
      expect(result).toEqual('Objects');
    });
  });

  describe('isSnapshotMapping() method', function () {
    let originalVM;

    beforeAll(function () {
      originalVM = viewModel.attr();
    });

    afterAll(function () {
      viewModel.attr(originalVM);
    });

    it('returns false if is an audit-scope model', function () {
      let result;
      spyOn(SnapshotUtils, 'isAuditScopeModel').and.returnValue(true);
      result = viewModel.isSnapshotMapping();
      expect(result).toEqual(false);
    });

    it('returns true if source object is a Snapshot parent and mapped type ' +
    'is snapshotable', function () {
      let result;
      spyOn(SnapshotUtils, 'isAuditScopeModel').and.returnValue(false);
      viewModel.attr('object', 'Audit');
      viewModel.attr('type', 'Control');
      result = viewModel.isSnapshotMapping();
      expect(result).toEqual(true);
    });

    it('returns true if mapped object is both a ' +
      'Snapshot parent and snapshotable', function () {
      let result;
      spyOn(SnapshotUtils, 'isAuditScopeModel').and.returnValue(false);
      spyOn(SnapshotUtils, 'isSnapshotParent').and.callFake(function (v) {
        return v === 'o';
      });
      viewModel.attr('object', 'o');
      viewModel.attr('type', 'Control');
      result = viewModel.isSnapshotMapping();
      expect(result).toEqual(true);
    });
  });
});
