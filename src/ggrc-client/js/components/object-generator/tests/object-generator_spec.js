/*
  Copyright (C) 2020 Google Inc.
  Licensed under http://www.apache.org/licenses/LICENSE-2.0 <see LICENSE file>
*/

import canMap from 'can-map';
import Component from '../object-generator';
import canDefineList from 'can-define/list/list';
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

      describe('closeModal() method', () => {
        it('sets false to is_saving', () => {
          viewModel.is_saving = true;

          viewModel.closeModal();

          viewModel.is_saving = false;
        });

        it('closes modal if element defined', () => {
          const fakeBtn = {
            trigger: jasmine.createSpy(),
          };
          viewModel.element = {
            find: () => fakeBtn,
          };

          viewModel.closeModal();

          expect(fakeBtn.trigger).toHaveBeenCalledWith('click');
        });
      });

      describe('performGenerateAssessment() method', () => {
        let event;

        beforeEach(() => {
          spyOn(Program, 'findInCacheById').and.returnValue('instance');
          event = {
            preventDefault: jasmine.createSpy(),
            target: $('<div></div>'),
          };
          viewModel.object = 'Program';
          viewModel.callback = jasmine.createSpy();
        });

        it('calls preventDefault() for event', () => {
          viewModel.performGenerateAssessment(event);

          expect(event.preventDefault).toHaveBeenCalled();
        });

        it('sets true to is_saving', () => {
          viewModel.is_saving = false;

          viewModel.performGenerateAssessment(event);

          expect(viewModel.is_saving).toBe(true);
        });

        it('calls callback with correct parameters', () => {
          viewModel.selected = ['selected'];
          viewModel.type = 'fake_type';
          viewModel.assessmentTemplate = 'assessmentTemplate';

          viewModel.performGenerateAssessment(event);

          expect(viewModel.callback).toHaveBeenCalledWith(
            new canDefineList(['selected']),
            {
              type: 'fake_type',
              target: 'Program',
              instance: 'instance',
              assessmentTemplate: 'assessmentTemplate',
              context: jasmine.anything(),
            }
          );
        });

        describe('doesn\'t call callback()', () => {
          it('if is_saving equals true', () => {
            viewModel.is_saving = true;

            viewModel.performGenerateAssessment(event);

            expect(viewModel.callback).not.toHaveBeenCalled();
          });

          it('if event target has "disabled" class', () => {
            event.target.addClass('disabled');
            viewModel.is_saving = false;

            viewModel.performGenerateAssessment(event);

            expect(viewModel.callback).not.toHaveBeenCalled();
          });
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
});
