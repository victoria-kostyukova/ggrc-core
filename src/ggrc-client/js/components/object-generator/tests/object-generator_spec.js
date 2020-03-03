/*
  Copyright (C) 2020 Google Inc.
  Licensed under http://www.apache.org/licenses/LICENSE-2.0 <see LICENSE file>
*/

import canMap from 'can-map';
import RefreshQueue from '../../../models/refresh-queue';
import Component from '../object-generator';
import Program from '../../../models/business-models/program';
import * as modelsUtils from '../../../plugins/utils/models-utils';

describe('object-generator component', () => {
  let events;
  let viewModel;
  let handler;

  beforeAll(() => {
    events = Component.prototype.events;
  });

  describe('viewModel() method', () => {
    let parentViewModel;

    beforeEach(() => {
      parentViewModel = new canMap();
    });

    it('returns object with function "isLoadingOrSaving"', () => {
      let result = Component.prototype.viewModel({}, parentViewModel)();
      expect(result.isLoadingOrSaving).toEqual(jasmine.any(Function));
    });

    describe('methods of extended viewModel', () => {
      beforeEach(() => {
        const ViewModel = Component.prototype.viewModel({}, parentViewModel);
        ViewModel.seal = false;
        viewModel = new ViewModel();
      });

      describe('isLoadingOrSaving() method', () => {
        it('returns true if it is saving', () => {
          viewModel.is_saving = true;
          expect(viewModel.isLoadingOrSaving()).toEqual(true);
        });

        it('returns true if type change is blocked', () => {
          viewModel.block_type_change = true;
          expect(viewModel.isLoadingOrSaving()).toEqual(true);
        });

        it('returns true if it is loading', () => {
          viewModel.is_loading = true;
          expect(viewModel.isLoadingOrSaving()).toEqual(true);
        });

        it('returns false if page is not loading, it is not saving,' +
        ' type change is not blocked and it is not loading', () => {
          viewModel.is_saving = false;
          viewModel.block_type_change = false;
          viewModel.is_loading = false;
          expect(viewModel.isLoadingOrSaving()).toEqual(false);
        });
      });

      describe('availableTypes() method', () => {
        let originalValue;

        beforeAll(() => {
          originalValue = GGRC.config.snapshotable_objects;
          GGRC.config.snapshotable_objects = ['ara', 'ere'];
        });

        afterAll(() => {
          GGRC.config.snapshotable_objects = originalValue;
        });

        it('returns grouped snapshotable objects', () => {
          spyOn(modelsUtils, 'groupTypes')
            .and.returnValue('grouped snapshotable objects');

          expect(viewModel.availableTypes())
            .toEqual('grouped snapshotable objects');
          expect(modelsUtils.groupTypes)
            .toHaveBeenCalledWith(GGRC.config.snapshotable_objects);
          expect(modelsUtils.groupTypes).toHaveBeenCalledTimes(1);
        });
      });

      describe('onAssessmentTemplateChanged() method', () => {
        it('sets false to block_type_change if template is empty',
          () => {
            viewModel.block_type_change = true;

            viewModel.onAssessmentTemplateChanged({});

            expect(viewModel.block_type_change)
              .toEqual(false);
          });

        it('sets true to block_type_change if template is not empty',
          () => {
            viewModel.block_type_change = false;

            viewModel.onAssessmentTemplateChanged({template: {}});

            expect(viewModel.block_type_change)
              .toEqual(true);
          });

        it('sets type to type if template is not empty',
          () => {
            viewModel.onAssessmentTemplateChanged({
              template: {objectType: 'type'},
            });
            expect(viewModel.type)
              .toEqual('type');
          });
      });
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
      expect(viewModel.selected.length).toEqual(0);
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

  describe('".modal-footer .btn-map click" handler', () => {
    let that;
    let event;
    let element;
    let callback;

    beforeEach(() => {
      callback = jasmine.createSpy().and.returnValue('expectedResult');
      viewModel.assign({
        callback: callback,
        type: 'type',
        object: 'Program',
        assessmentTemplate: 'template',
        join_object_id: '123',
        selected: [],
      });
      spyOn(Program, 'findInCacheById')
        .and.returnValue('instance');
      event = {
        preventDefault: () => {},
      };
      element = $('<div></div>');
      handler = events['.modal-footer .btn-map click'];
      that = {
        viewModel: viewModel,
        closeModal: jasmine.createSpy(),
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

    it('sets true to is_saving and returns callback', () => {
      let result;
      result = handler.call(that, element, event);
      expect(viewModel.is_saving).toEqual(true);
      expect(result).toEqual('expectedResult');
      expect(callback.calls.argsFor(0)[0].length)
        .toEqual(0);
      expect(callback.calls.argsFor(0)[1]).toEqual({
        type: 'type',
        target: 'Program',
        instance: 'instance',
        assessmentTemplate: 'template',
        context: that,
      });
    });
  });
});
