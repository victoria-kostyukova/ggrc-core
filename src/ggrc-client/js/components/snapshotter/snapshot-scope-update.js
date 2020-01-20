/*
 Copyright (C) 2020 Google Inc.
 Licensed under http://www.apache.org/licenses/LICENSE-2.0 <see LICENSE file>
 */

import canMap from 'can-map';
import canComponent from 'can-component';
import {confirm} from '../../plugins/utils/modals';
import {BUTTON_VIEW_CONFIRM_CANCEL} from '../../plugins/utils/template-utils';
import {
  refreshCounts,
} from '../../plugins/utils/widgets-utils';
import {notifier} from '../../plugins/utils/notifiers-utils';
import pubSub from '../../pub-sub';
import {trigger} from 'can-event';

export default canComponent.extend({
  tag: 'snapshot-scope-update',
  leakScope: false,
  viewModel: canMap.extend({
    instance: null,
    upsertIt(scope) {
      confirm({
        instance: scope.instance,
        modal_title: 'Update to latest version',
        modal_description:
          'Do you want to update all objects of this Audit' +
          ' to the latest version?',
        modal_confirm: 'Update',
        button_view: BUTTON_VIEW_CONFIRM_CANCEL,
        skip_refresh: true,
      },
      () => this.success());
    },
    refreshContainers() {
      pubSub.dispatch({
        type: 'refetchOnce',
        modelNames: GGRC.config.snapshotable_objects,
      });
      return refreshCounts();
    },
    success() {
      let instance = this.instance;

      notifier('progress',
        'Audit refresh is in progress. This may take several minutes.');

      return instance
        .refresh()
        .then(() => {
          let data = {
            operation: 'upsert',
          };
          instance.attr('snapshots', data);
          return instance.save();
        })
        .then(() => {
          this.refreshContainers();
          this.updateVisibleContainer();
          notifier('success', 'Audit was refreshed successfully.');
        });
    },
    updateVisibleContainer() {
      let visibleContainer = $('tree-widget-container:visible');
      if (visibleContainer.length === 0) {
        return;
      }
      // if a user switches to the snapshot tab during the audit refresh
      // then update the tab
      trigger.call(visibleContainer[0], 'refreshTree');
    },
  }),
});
