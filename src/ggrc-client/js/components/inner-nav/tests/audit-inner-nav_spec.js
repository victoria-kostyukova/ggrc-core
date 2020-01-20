/*
 Copyright (C) 2020 Google Inc.
 Licensed under http://www.apache.org/licenses/LICENSE-2.0 <see LICENSE file>
 */
import Component from '../audit-inner-nav';
import {
  getComponentVM,
} from '../../../../js_specs/spec-helpers';
import * as DashboardUtils from '../../../plugins/utils/dashboards-utils';

describe('audit-inner-nav component', () => {
  let viewModel;

  beforeEach(() => {
    viewModel = getComponentVM(Component);
  });

  describe('setTabsPriority() method', () => {
    it('should set first 5 widgets as priority if dashboard is not enabled',
      () => {
        spyOn(DashboardUtils, 'isDashboardEnabled').and.returnValue(false);
        viewModel.attr('instance', {type: 'Audit'});
        viewModel.attr('widgetList', [{id: 0}, {id: 1}, {id: 2},
          {id: 3}, {id: 4}, {id: 5}, {id: 6}]);

        viewModel.setTabsPriority();

        expect(viewModel.attr('priorityTabs').length).toBe(5);
        for (let i = 0; i < 5; i++) {
          expect(viewModel.attr('priorityTabs')[i].id).toBe(i);
        }

        expect(viewModel.attr('notPriorityTabs').length).toBe(2);
        for (let i = 0; i < 2; i++) {
          expect(viewModel.attr('notPriorityTabs')[i].id).toBe(i + 5);
        }
      });

    it('should set first 6 widgets as priority if dashboard is enabled',
      () => {
        spyOn(DashboardUtils, 'isDashboardEnabled').and.returnValue(true);
        viewModel.attr('instance', {type: 'Audit'});
        viewModel.attr('widgetList', [{id: 0}, {id: 1}, {id: 2},
          {id: 3}, {id: 4}, {id: 5}, {id: 6}]);

        viewModel.setTabsPriority();

        expect(viewModel.attr('priorityTabs').length).toBe(6);
        for (let i = 0; i < 6; i++) {
          expect(viewModel.attr('priorityTabs')[i].id).toBe(i);
        }
        expect(viewModel.attr('notPriorityTabs').length).toBe(1);
        expect(viewModel.attr('notPriorityTabs')[0].id).toBe(6);
      });
  });
});
