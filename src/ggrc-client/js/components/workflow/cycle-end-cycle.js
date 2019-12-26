/*
  Copyright (C) 2020 Google Inc.
  Licensed under http://www.apache.org/licenses/LICENSE-2.0 <see LICENSE file>
*/

import canDefineMap from 'can-define/map/map';
import canComponent from 'can-component';
import {
  getPageInstance,
} from '../../plugins/utils/current-page-utils';
import {initCounts} from '../../plugins/utils/widgets-utils';
import {countsMap as workflowCountsMap} from '../../apps/workflows';
import {trigger} from 'can-event';

/**
 * A component that wraps a button for ending a Workflow cycle, and
 * automatically handles a click on it.
 *
 * As a result, the Cycle instance passed to the component is ended, and
 * a couple of affected objects are refreshed in the process.
 *
 * Usage example (state and permission checks not included):
 *
 *   <cycle-end-cycle cycle:from="instance">
 *       <button>Click to end a Cycle</button>
 *   </cycle-end-cycle>
 *
 */

export default canComponent.extend({
  tag: 'cycle-end-cycle',
  leakScope: true,
  ViewModel: canDefineMap.extend({
    cycle: {
      value: null,
    },
  }),
  events: {
    click(el, ev) {
      ev.stopPropagation();

      this.viewModel.cycle
        .refresh()
        .then((cycle) => {
          cycle.attr('is_current', false);
          return cycle.save();
        })
        .then(() => {
          return getPageInstance().refresh();
        })
        .then(() => {
          let pageInstance = getPageInstance();
          trigger.call(el[0], 'refreshTree');

          return initCounts(
            [workflowCountsMap.activeCycles, workflowCountsMap.history],
            pageInstance.type, pageInstance.id);
        });
    },
  },
});
