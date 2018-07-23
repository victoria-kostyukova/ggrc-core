/*
  Copyright (C) 2018 Google Inc.
  Licensed under http://www.apache.org/licenses/LICENSE-2.0 <see LICENSE file>
*/

import Component from '../approval-link';
import {getComponentVM} from '../../../../js_specs/spec_helpers';
import Permission from '../../../permission';
import * as aclUtils from '../../../plugins/utils/acl-utils';
import * as queryApiUtils from '../../../plugins/utils/query-api-utils';
import {REFRESH_APPROVAL} from '../../../events/eventTypes';

describe('approval-link component', ()=> {
  let viewModel;

  beforeEach(() => {
    viewModel = getComponentVM(Component);
  });

  describe('viewModel', () => {
    describe('isReviewer get()', () => {
      let assigneeRole;

      beforeAll(() => {
        assigneeRole = {
          id: -1,
        };
        spyOn(aclUtils, 'getRole').and.returnValue(assigneeRole);
      });

      it('returns false when reviewTask is not set', () => {
        viewModel.attr('reviewTask', null);
        spyOn(Permission, 'is_allowed').and.returnValue(false);

        let result = viewModel.attr('isReviewer');

        expect(result).toBe(false);
      });

      it('returns true when user is Admin', () => {
        viewModel.attr('reviewTask', {});
        spyOn(Permission, 'is_allowed').and.returnValue(true);

        let result = viewModel.attr('isReviewer');

        expect(result).toBe(true);
      });

      it('returns false when ACL person does not match current user', () => {
        viewModel.attr('reviewTask', {
          access_control_list: {
            ac_role_id: assigneeRole.id,
            person: {
              id: 12345,
            },
          },
        });
        spyOn(Permission, 'is_allowed').and.returnValue(false);

        let result = viewModel.attr('isReviewer');

        expect(result).toBe(false);
      });

      it('returns false when ACL role non-Task Assignees for user', () => {
        viewModel.attr('reviewTask', {
          access_control_list: {
            ac_role_id: 12,
            person: {
              id: 12345,
            },
          },
        });
        spyOn(Permission, 'is_allowed').and.returnValue(false);

        let result = viewModel.attr('isReviewer');

        expect(result).toBe(false);
      });

      it('returns true when ACL person role matches current user', () => {
        viewModel.attr('reviewTask', {
          access_control_list: {
            ac_role_id: assigneeRole.id,
            person: {
              id: 1,
            },
          },
        });
        spyOn(Permission, 'is_allowed').and.returnValue(false);

        let result = viewModel.attr('isReviewer');

        expect(result).toBe(true);
      });
    });

    describe('disabled get()', () => {
      describe('returns true', () => {
        beforeEach(function () {
          viewModel.attr({
            isSaving: false,
            instance: {
              snapshot: null,
              isRevision: false,
            },
          });
        });

        it('if isSaving flag is true', function () {
          viewModel.attr('isSaving', true);
          expect(viewModel.attr('disabled')).toBe(true);
        });

        it('if instance contains snapshot object', function () {
          viewModel.attr('instance.snapshot', {});
          expect(viewModel.attr('disabled')).toBe(true);
        });

        it('if instance has isRevision equal to true', function () {
          viewModel.attr('instance.isRevision', true);
          expect(viewModel.attr('disabled')).toBe(true);
        });
      });
    });

    describe('loadReviewTask() method', () => {
      let requestDfd;
      let response;
      beforeEach(() => {
        requestDfd = can.Deferred();
        response = {
          CycleTaskGroupObjectTask: {
            values: [],
          },
        };
        spyOn(queryApiUtils, 'batchRequests').and.returnValue(requestDfd);
        spyOn(queryApiUtils, 'buildParam');
        viewModel.attr('instance', {});
      });

      it('builds correct queryApi request', () => {
        viewModel.attr('instance', {
          type: 'testType',
          id: 'testId',
        });
        viewModel.loadReviewTask();

        expect(queryApiUtils.buildParam).toHaveBeenCalledWith(
          'CycleTaskGroupObjectTask', {
            current: 1,
            pageSize: 1,
          }, {
            type: 'testType',
            id: 'testId',
          },
          null, {
            expression: {
              left: 'object_approval',
              op: {name: '='},
              right: 'true',
            },
          });
      });

      it('sets "isInitializing" flag to true', () => {
        viewModel.attr('isInitializing', false);

        viewModel.loadReviewTask();

        let result = viewModel.attr('isInitializing');
        expect(result).toBe(true);
      });

      it('sets "isInitializing" flag to false in the end', (done) => {
        viewModel.attr('isInitializing', true);

        viewModel.loadReviewTask();

        requestDfd.resolve(response).then(() => {
          let result = viewModel.attr('isInitializing');
          expect(result).toBe(false);
          done();
        });
      });

      it('initializes "reviewTask" field', (done) => {
        let task = {
          id: 1,
          type: 'CycleTaskGroupObjectTask',
          isOverdue: false,
          access_control_list: [],
        };
        response.CycleTaskGroupObjectTask.values = [task];
        viewModel.loadReviewTask();

        requestDfd.resolve(response).then(() => {
          let result = viewModel.attr('reviewTask').serialize();
          expect(result).toEqual(task);
          done();
        });
      });
    });
  });

  describe('events', () => {
    describe('"inserted" event', () => {
      let event;
      beforeEach(() => {
        event = Component.prototype.events['inserted'].bind({viewModel});
      });

      it('loads review task', () => {
        spyOn(viewModel, 'loadReviewTask');

        event();

        expect(viewModel.loadReviewTask).toHaveBeenCalled();
      });
    });

    describe('"REFRESH_APPROVAL" instance event', () => {
      let event;
      beforeEach(() => {
        event = Component.prototype
          .events[`{viewModel.instance} ${REFRESH_APPROVAL.type}`]
          .bind({viewModel});
      });

      it('loads review task', () => {
        spyOn(viewModel, 'loadReviewTask');

        event();

        expect(viewModel.loadReviewTask).toHaveBeenCalled();
      });
    });
  });
});
