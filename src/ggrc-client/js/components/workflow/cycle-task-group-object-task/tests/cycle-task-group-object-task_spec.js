/*
  Copyright (C) 2020 Google Inc.
  Licensed under http://www.apache.org/licenses/LICENSE-2.0 <see LICENSE file>
*/

import Component from '../cycle-task-group-object-task';
import * as WorkflowHelpers from '../../../../plugins/utils/workflow-utils';
import * as CurrentPageUtils from '../../../../plugins/utils/current-page-utils';
import {
  getComponentVM,
  spyProp,
} from '../../../../../js_specs/spec-helpers';
import * as Permission from '../../../../permission';

describe('cycle-task-group-object-task component', () => {
  let viewModel;

  beforeEach(() => {
    viewModel = getComponentVM(Component);
  });

  describe('isAllowedToUpdate get() method', () => {
    beforeEach(() => {
      viewModel.attr('instance', {});
      spyOn(Permission, 'isAllowedFor');
    });

    it('returns true if it is allowed to update instance', () => {
      Permission.isAllowedFor.
        withArgs('update', viewModel.attr('instance')).and.returnValue(true);

      expect(viewModel.attr('isAllowedToUpdate')).toBe(true);
    });

    it('returns false if it is not allowed to update instance', () => {
      Permission.isAllowedFor
        .withArgs('update', viewModel.attr('instance')).and.returnValue(false);

      expect(viewModel.attr('isAllowedToUpdate')).toBe(false);
    });
  });

  describe('isEditDenied get() method', () => {
    let isAllowedToUpdate;

    beforeEach(() => {
      isAllowedToUpdate = spyProp(viewModel, 'isAllowedToUpdate');
    });

    it('returns false if there is access to edit instance', () => {
      isAllowedToUpdate.and.returnValue(true);
      viewModel.attr('instance', {is_in_history: false});

      expect(viewModel.attr('isEditDenied')).toBe(false);
    });

    describe('returns true', () => {
      it('if it is not allowed to update instance', () => {
        isAllowedToUpdate.and.returnValue(false);
        const result = viewModel.attr('isEditDenied');

        expect(result).toBe(true);
      });

      it('if the instance is in history', () => {
        isAllowedToUpdate.and.returnValue(true);
        viewModel.attr('instance', {is_in_history: true});

        expect(viewModel.attr('isEditDenied')).toBe(true);
      });
    });
  });

  describe('showWorfklowLink get() method', () => {
    let getPageType;

    beforeEach(() => {
      getPageType = spyOn(CurrentPageUtils, 'getPageType');
    });

    it('returns true if page type is not equal to "Workflow"', () => {
      getPageType.and.returnValue('NotWorkflow');
      expect(viewModel.attr('showWorkflowLink')).toBe(true);
    });

    it('returns false if page type equals to "Workflow"', () => {
      getPageType.and.returnValue('Workflow');
      expect(viewModel.attr('showWorkflowLink')).toBe(false);
    });
  });

  describe('isWorkflowPage() method', () => {
    let getPageType;

    beforeEach(() => {
      getPageType = spyOn(CurrentPageUtils, 'getPageType');
    });

    it('returns false if page type is not equal to "Workflow"', () => {
      getPageType.and.returnValue('NotWorkflow');
      expect(viewModel.isWorkflowPage()).toBe(false);
    });

    it('returns true if page type equals to "Workflow"', () => {
      getPageType.and.returnValue('Workflow');
      expect(viewModel.isWorkflowPage()).toBe(true);
    });
  });

  describe('workflowLink get() method', () => {
    it('returns link to workflow, which is relevant to instance', () => {
      const id = 1234567;
      const expectedLink = `/workflows/${id}`;

      viewModel.attr('instance', {workflow: {id}});

      expect(viewModel.attr('workflowLink')).toBe(expectedLink);
    });
  });

  describe('onStateChange() method', () => {
    let event;

    beforeEach(() => {
      event = {};
      viewModel.attr('instance', {});
      spyOn(WorkflowHelpers, 'updateStatus').and.returnValue(new $.Deferred());
      spyOn(CurrentPageUtils, 'getPageType').and.returnValue('');
    });

    it('updates status for cycle task', () => {
      event.state = 'New State';
      viewModel.onStateChange(event);
      expect(WorkflowHelpers.updateStatus).toHaveBeenCalledWith(
        viewModel.attr('instance'),
        event.state
      );
    });
  });

  describe('showMapObjectsButton() getter', () => {
    let spiedIsEditDenied;

    beforeEach(() => {
      viewModel.attr('instance', {status: 'Assigned'});
      spiedIsEditDenied = spyProp(viewModel, 'isEditDenied');
      spiedIsEditDenied.and.returnValue(false);
    });

    it('returns true by default', () => {
      expect(viewModel.attr('showMapObjectsButton')).toBe(true);
    });

    describe('returns false', () => {
      it('when edit functionality is denied', () => {
        spiedIsEditDenied.and.returnValue(true);

        expect(viewModel.attr('showMapObjectsButton')).toBe(false);
      });

      it('when instance has "Verified" status', () => {
        viewModel.attr('instance.status', 'Verified');

        expect(viewModel.attr('showMapObjectsButton')).toBe(false);
      });

      it('when instance has "Finished" status', () => {
        viewModel.attr('instance.status', 'Finished');

        expect(viewModel.attr('showMapObjectsButton')).toBe(false);
      });
    });
  });
});
