/*
  Copyright (C) 2020 Google Inc.
  Licensed under http://www.apache.org/licenses/LICENSE-2.0 <see LICENSE file>
*/

import Component from '../assessments-bulk-verify';
import {getComponentVM} from '../../../../../js_specs/spec-helpers';
import * as RequestUtils from '../../../../plugins/utils/request-utils';


describe('assessments-bulk-verify component', () => {
  let viewModel;

  beforeEach(() => {
    viewModel = getComponentVM(Component);
  });

  describe('isVerifyButtonDisabled get() method', () => {
    it('returns true if "selected" attr is empty', () => {
      viewModel.attr('selected', []);
      viewModel.attr('isVerifying', false);

      expect(viewModel.attr('isVerifyButtonDisabled')).toBe(true);
    });

    it('returns true if "selected" attr is not empty and ' +
    '"isVerifying" attr returns true', () => {
      viewModel.attr('selected', [{
        id: 123,
        title: 'asmt1',
      }]);
      viewModel.attr('isVerifying', true);

      expect(viewModel.attr('isVerifyButtonDisabled')).toBe(true);
    });

    it('returns false if "selected" attr is not empty and ' +
    '"isVerifying" attr returns false', () => {
      viewModel.attr('selected', [{
        id: 123,
        title: 'asmt1',
      }]);
      viewModel.attr('isVerifying', false);

      expect(viewModel.attr('isVerifyButtonDisabled')).toBe(false);
    });
  });

  describe('onVerifyClick() method', () => {
    it('sets "isVerifying" attr to true before request', () => {
      viewModel.attr('isVerifying', false);
      viewModel.onVerifyClick();

      expect(viewModel.attr('isVerifying')).toBe(true);
    });

    it('calls request() method with specified params', () => {
      spyOn(RequestUtils, 'request');
      spyOn(viewModel, 'getSelectedAssessmentsIds').and.returnValue([123]);
      viewModel.onVerifyClick();

      expect(RequestUtils.request).toHaveBeenCalledWith(
        '/api/bulk_operations/verify',
        {
          assessments_ids: [123],
        }
      );
    });

    it('calls trackBackgroundTask() method with task id', async () => {
      spyOn(RequestUtils, 'request')
        .and.returnValue(Promise.resolve({id: 2456}));
      spyOn(viewModel, 'trackBackgroundTask');
      await viewModel.onVerifyClick();

      expect(viewModel.trackBackgroundTask).toHaveBeenCalledWith(2456);
    });

    it('calls closeModal() method', async () => {
      spyOn(RequestUtils, 'request')
        .and.returnValue(Promise.resolve({task: 2456}));
      spyOn(viewModel, 'closeModal');
      await viewModel.onVerifyClick();

      expect(viewModel.closeModal).toHaveBeenCalled();
    });

    it('calls handleBulkUpdateErrors() method if request is rejected',
      async () => {
        spyOn(RequestUtils, 'request')
          .and.returnValue(Promise.reject());
        spyOn(viewModel, 'handleBulkUpdateErrors');
        await viewModel.onVerifyClick();

        expect(viewModel.handleBulkUpdateErrors).toHaveBeenCalled();
      });

    it('sets "isVerifying" attr to false after request', async () => {
      viewModel.attr('isVerifying', true);
      spyOn(RequestUtils, 'request')
        .and.returnValue(Promise.reject());
      await viewModel.onVerifyClick();

      expect(viewModel.attr('isVerifying')).toBe(false);
    });
  });

  describe('init() method', () => {
    it('sets "filterOperatorOptions" attr', () => {
      viewModel.init();

      expect(viewModel.attr('filterOperatorOptions').serialize()).toEqual({
        disabled: true,
      });
    });

    it('calls initDefaultFilter() method with specified params', () => {
      spyOn(viewModel, 'initDefaultFilter');
      viewModel.init();

      expect(viewModel.initDefaultFilter).toHaveBeenCalledWith({
        attribute: {
          field: 'Verifiers',
          operator: '~',
          value: GGRC.current_user.email,
        },
        options: {
          disabled: true,
        },
      }, {
        disabled: true,
      });
    });

    it('calls initFilterAttributes()', () => {
      spyOn(viewModel, 'initFilterAttributes');
      viewModel.init();

      expect(viewModel.initFilterAttributes).toHaveBeenCalled();
    });
  });

  describe('events', () => {
    let events;

    beforeAll(() => {
      events = Component.prototype.events;
    });

    describe('inserted() method', () => {
      let handler;

      beforeEach(() => {
        handler = events.inserted.bind({
          element: $('<assessments-bulk-verify></assessments-bulk-verify>'),
          viewModel,
        });
      });

      it('assigns element to "element" attr', () => {
        handler();

        expect(viewModel.attr('element'))
          .toEqual($('<assessments-bulk-verify></assessments-bulk-verify>'));
      });

      it('calls onSubmit()', () => {
        spyOn(viewModel, 'onSubmit');
        handler();

        expect(viewModel.onSubmit).toHaveBeenCalled();
      });
    });
  });
});
