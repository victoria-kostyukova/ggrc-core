/*
 Copyright (C) 2020 Google Inc.
 Licensed under http://www.apache.org/licenses/LICENSE-2.0 <see LICENSE file>
 */

import {getComponentVM} from '../../../../js_specs/spec-helpers';
import Component from '../dashboard-workflows';
import * as AjaxUtils from '../../../plugins/ajax-extensions';

describe('dashboard-workflows component', () => {
  let viewModel;

  beforeAll(() => {
    viewModel = getComponentVM(Component);
  });

  describe('showAllWorkflows() setter', () => {
    it('sets passed value via attr method', () => {
      viewModel.attr('showAllWorkflows', true);

      expect(viewModel.attr('showAllWorkflows')).toBe(true);
    });

    it('replaces "shownWorkflows" list with "workflows" list if need to ' +
    'show the whole list of workflows', () => {
      const workflows = [
        {id: 10, title: 'Workflow 10'},
        {id: 20, title: 'Workflow 20'},
        {id: 50, title: 'Workflow 50'},
        {id: 170, title: 'Workflow 170'},
        {id: 4, title: 'Workflow 4'},
        {id: 3, title: 'Workflow 3'},
      ];
      viewModel.attr('workflows', workflows);

      viewModel.attr('showAllWorkflows', true);

      expect(viewModel.attr('shownWorkflows').serialize()).toEqual(workflows);
    });

    it('replaces "shownWorkflows" list with first 5 workflows placed in ' +
    '"workflows" list if need to show short list of workflows', () => {
      const expectedWorkflows = [
        {id: 10, title: 'Workflow 10'},
        {id: 20, title: 'Workflow 20'},
        {id: 50, title: 'Workflow 50'},
        {id: 170, title: 'Workflow 170'},
        {id: 4, title: 'Workflow 4'},
      ];
      const workflows = [
        ...expectedWorkflows,
        {id: 3, title: 'Workflow 3'},
      ];
      viewModel.attr('workflows', workflows);

      viewModel.attr('showAllWorkflows', false);

      expect(viewModel.attr('shownWorkflows').serialize())
        .toEqual(expectedWorkflows);
    });
  });

  describe('showToggleListButton() getter', () => {
    it('returns true if count of workflows more then 5', () => {
      viewModel.attr('workflows', [
        {id: 10, title: 'Workflow 10'},
        {id: 20, title: 'Workflow 20'},
        {id: 50, title: 'Workflow 50'},
        {id: 170, title: 'Workflow 170'},
        {id: 4, title: 'Workflow 4'},
        {id: 3, title: 'Workflow 3'},
      ]);

      const result = viewModel.attr('showToggleListButton');

      expect(result).toBe(true);
    });

    it('returns false if count of workflows less then 6', () => {
      viewModel.attr('workflows', [
        {id: 10, title: 'Workflow 10'},
        {id: 20, title: 'Workflow 20'},
        {id: 50, title: 'Workflow 50'},
        {id: 170, title: 'Workflow 170'},
        {id: 4, title: 'Workflow 4'},
      ]);

      const result = viewModel.attr('showToggleListButton');

      expect(result).toBe(false);
    });
  });

  describe('toggleWorkflowList() getter', () => {
    it('toggles showAllWorkflows field', () => {
      viewModel.attr('showAllWorkflows', true);

      viewModel.toggleWorkflowList();

      expect(viewModel.attr('showAllWorkflows')).toBe(false);

      viewModel.toggleWorkflowList();

      expect(viewModel.attr('showAllWorkflows')).toBe(true);
    });
  });

  describe('convertToWorkflowList() getter', () => {
    it('converts each item to an appropriate format', () => {
      const workflowsData = [{
        workflow: {
          title: 'Workflow title',
          id: 1234,
        },
        owners: ['1@b.com', '2@b.com'],
        task_stat: {
          due_in_date: '2019-04-15',
          counts: {
            total: 120,
            overdue: 50,
            completed: 30,
          },
        },
      }];

      const expectedResult = [{
        workflowTitle: 'Workflow title',
        workflowLink: '/workflows/1234#current',
        owners: {
          tooltipContent: '1@b.com\n2@b.com',
          inlineList: '1@b.com, 2@b.com',
        },
        taskStatistic: {
          total: 120,
          overdue: 50,
          dueInDate: '04/15/2019',
          completedPercent: '25.00',
        },
      }];

      const result = viewModel.convertToWorkflowList(workflowsData);

      expect(result).toEqual(expectedResult);
    });
  });

  describe('initMyWorkflows() getter', () => {
    let originCurrentUser;

    beforeAll(() => {
      originCurrentUser = GGRC.current_user;
    });

    afterAll(() => {
      GGRC.current_user = originCurrentUser;
    });

    beforeEach(() => {
      spyOn(AjaxUtils, 'ggrcGet').and.returnValue(new Promise(() => {}));
    });

    it('sets "isLoading" flag to true before loading of workflow statistic ' +
    'for current user', () => {
      viewModel.attr('isLoading', false);
      viewModel.initMyWorkflows();
      expect(viewModel.attr('isLoading')).toBe(true);
    });

    it('loads statistic about active workflows for current user', () => {
      const currentUserId = 12345;
      const expectedPath = `/api/people/${currentUserId}/my_workflows`;
      GGRC.current_user = {id: currentUserId};

      viewModel.initMyWorkflows();

      expect(AjaxUtils.ggrcGet).toHaveBeenCalledWith(expectedPath);
    });

    describe('after loading of workflow statistic', () => {
      let fakeWorkflows;
      let fakeConvertedWorkflows;

      beforeEach(() => {
        fakeWorkflows = [
          {data: 'Info about active workflow 1'},
          {data: 'Info about active workflow 2'},
        ],
        AjaxUtils.ggrcGet
          .and.returnValue(Promise.resolve({workflows: fakeWorkflows}));

        fakeConvertedWorkflows = [
          {data: 'Converted workflow item 1'},
          {data: 'Converted workflow item 2'},
        ];
        spyOn(viewModel, 'convertToWorkflowList').and.returnValue(
          fakeConvertedWorkflows
        );
      });

      it('sets "isLoading" flag to false', async (done) => {
        viewModel.attr('isLoading', true);
        await viewModel.initMyWorkflows();
        expect(viewModel.attr('isLoading')).toBe(false);
        done();
      });

      it('sets "workflows" field to the list of converted workflows based on ' +
      'the list of loaded statistic', async (done) => {
        await viewModel.initMyWorkflows();

        expect(viewModel.convertToWorkflowList).toHaveBeenCalledWith(
          fakeWorkflows
        );
        expect(viewModel.attr('workflows').serialize())
          .toEqual(fakeConvertedWorkflows);
        done();
      });

      it('sets "showAllWorkflows" field to false', async (done) => {
        viewModel.attr('showAllWorkflows', true);
        await viewModel.initMyWorkflows();
        expect(viewModel.attr('showAllWorkflows')).toBe(false);
        done();
      });
    });
  });

  describe('helpers', () => {
    let helpers;

    beforeAll(() => {
      helpers = Component.prototype.helpers;
    });

    describe('overdueCountMessage()', () => {
      it('returns sentence with "tasks" word if total count of tasks is more ' +
      'then 1', () => {
        const statistic = {
          overdue: 1,
          total: 10,
        };
        const expected = '1 of 10 tasks is overdue';

        const result = helpers.overdueCountMessage(statistic);

        expect(result).toBe(expected);
      });

      it('returns sentence with "task" word if total count of tasks is less ' +
      'then 2', () => {
        const statistic = {
          overdue: 1,
          total: 1,
        };
        const expected = '1 of 1 task is overdue';

        const result = helpers.overdueCountMessage(statistic);

        expect(result).toBe(expected);
      });

      it('returns sentence with "are" form of verb if count of overdue tasks ' +
      'is more then 1', () => {
        const statistic = {
          overdue: 4,
          total: 10,
        };
        const expected = '4 of 10 tasks are overdue';

        const result = helpers.overdueCountMessage(statistic);

        expect(result).toBe(expected);
      });

      it('returns sentence with "is" form of verb if count of overdue tasks ' +
      'is less then 2', () => {
        const statistic = {
          overdue: 1,
          total: 5,
        };
        const expected = '1 of 5 tasks is overdue';

        const result = helpers.overdueCountMessage(statistic);

        expect(result).toBe(expected);
      });
    });

    describe('totalCountMessage()', () => {
      it('returns sentence with "tasks" word if total count of tasks is more ' +
      'then 1', () => {
        const totalCountOfTasks = 10;
        const expected = `${totalCountOfTasks} tasks in total`;

        const result = helpers.totalCountMessage(totalCountOfTasks);

        expect(result).toBe(expected);
      });

      it('returns sentence with "task" word if total count of tasks is less ' +
      'then 2', () => {
        const totalCountOfTasks = 1;
        const expected = `${totalCountOfTasks} task in total`;

        const result = helpers.totalCountMessage(totalCountOfTasks);

        expect(result).toBe(expected);
      });
    });
  });
});
