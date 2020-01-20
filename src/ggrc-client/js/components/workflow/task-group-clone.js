/*
  Copyright (C) 2020 Google Inc.
  Licensed under http://www.apache.org/licenses/LICENSE-2.0 <see LICENSE file>
 */

import canMap from 'can-map';
import canComponent from 'can-component';
import Cacheable from '../../models/cacheable';
import {BUTTON_VIEW_SAVE_CANCEL} from '../../plugins/utils/template-utils';
import {refreshTGRelatedItems} from '../../plugins/utils/workflow-utils';
import TaskGroup from '../../models/business-models/task-group';
import ModalsController from '../../controllers/modals/modals-controller';

let CloneTaskGroup = Cacheable.extend({
  defaults: {
    clone_objects: true,
    clone_tasks: true,
    clone_people: true,
  },
}, {
  refresh() {
    return $.when(this);
  },
  save() {
    const taskGroup = new TaskGroup({
      clone: this.source_task_group.id,
      context: null,
      clone_objects: this.clone_objects,
      clone_tasks: this.clone_tasks,
      clone_people: this.clone_people,
    });

    return taskGroup.save();
  },
});

export default canComponent.extend({
  tag: 'task-group-clone',
  viewModel: canMap.extend({
    taskGroup: null,
  }),
  events: {
    click(el) {
      const $target = $('<div class="modal hide"></div>').uniqueId();
      $target.modal_form({}, el);
      import(/* webpackChunkName: "modalsCtrls" */'../../controllers/modals')
        .then(() => {
          const contentView = '/task_groups/clone-modal-content.stache';

          new ModalsController($target, {
            modal_title: 'Clone Task Group',
            model: CloneTaskGroup,
            instance: new CloneTaskGroup({
              source_task_group: this.viewModel.taskGroup,
            }),
            content_view: contentView,
            custom_save_button_text: 'Proceed',
            button_view: BUTTON_VIEW_SAVE_CANCEL,
          });

          $target.on('modal:success', (e, clonedTg) => {
            refreshTGRelatedItems(clonedTg);
          });
        });
    },
  },
  leakScope: true,
});
