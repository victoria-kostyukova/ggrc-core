/*
    Copyright (C) 2020 Google Inc.
    Licensed under http://www.apache.org/licenses/LICENSE-2.0 <see LICENSE file>
*/

import canMap from 'can-map';
import component from '../workflow-start-cycle';
import * as helpers from '../../../plugins/utils/workflow-utils';
import * as CurrentPageUtils from '../../../plugins/utils/current-page-utils';
import * as WidgetsUtils from '../../../plugins/utils/widgets-utils';
import {countsMap as workflowCountsMap} from '../../../apps/workflows';
import * as RefreshQueue from '../../../models/refresh-queue';

describe('workflow-start-cycle component', () => {
  let events;

  beforeAll(() => {
    events = component.prototype.events;
  });

  describe('click event handler', () => {
    let handler;
    let workflow;

    beforeEach(() => {
      handler = events.click;
      workflow = new canMap({
        type: 'Type',
        id: 'ID',
      });

      spyOn(CurrentPageUtils, 'getPageInstance').and.returnValue(workflow);
      spyOn(WidgetsUtils, 'initCounts');
      spyOn(RefreshQueue, 'refreshAll');
    });

    it('should update TaskGroups when cycle was generated', async () => {
      spyOn(helpers, 'generateCycle').and.returnValue(Promise.resolve());
      const activeCycleCount = workflowCountsMap.activeCycles;
      workflowCountsMap.activeCycles = 1234;

      await handler();

      expect(WidgetsUtils.initCounts)
        .toHaveBeenCalledWith([1234], workflow.type, workflow.id);
      workflowCountsMap.activeCycles = activeCycleCount;
    });

    it('should update TaskGroups when cycle was generated', async () => {
      spyOn(helpers, 'generateCycle').and.returnValue(Promise.resolve());
      WidgetsUtils.initCounts.and.returnValue(Promise.resolve());

      await handler();

      expect(helpers.generateCycle).toHaveBeenCalled();
      expect(RefreshQueue.refreshAll)
        .toHaveBeenCalledWith(workflow, ['task_groups', 'task_group_tasks']);
    });

    it('shouldn\'t update TaskGroups when cycle wasn\'t generated',
      async () => {
        spyOn(helpers, 'generateCycle').and.returnValue(Promise.reject());

        try {
          await handler();
        } catch (e) {
          expect(helpers.generateCycle).toHaveBeenCalled();
          expect(RefreshQueue.refreshAll).not.toHaveBeenCalled();
        }
      });
  });
});
