/*
  Copyright (C) 2020 Google Inc.
  Licensed under http://www.apache.org/licenses/LICENSE-2.0 <see LICENSE file>
*/

import canMap from 'can-map';
import canComponent from 'can-component';
import Cacheable from '../../models/cacheable';
import {BUTTON_VIEW_SAVE_CANCEL} from '../../plugins/utils/template-utils';
import {navigate} from '../../plugins/utils/current-page-utils';
import Workflow from '../../models/business-models/workflow';
import ModalsController from '../../controllers/modals/modals-controller';

let CloneWorkflow = Cacheable.extend({
  defaults: {
    clone_people: true,
    clone_tasks: true,
    clone_objects: true,
  },
}, {
  refresh() {
    return $.when(this);
  },
  save() {
    let workflow = new Workflow({
      clone: this.source_workflow.id,
      context: null,
      clone_people: this.clone_people,
      clone_tasks: this.clone_tasks,
      clone_objects: this.clone_objects,
    });

    return workflow.save().then((workflow) => {
      navigate(workflow.viewLink);
      return this;
    });
  },
});

export default canComponent.extend({
  tag: 'workflow-clone',
  viewModel: canMap.extend({
    workflow: null,
  }),
  events: {
    click(el) {
      let $target;

      $target = $('<div class="modal hide"></div>').uniqueId();
      $target.modal_form({}, el);
      import(/* webpackChunkName: "modalsCtrls" */'../../controllers/modals')
        .then(() => {
          new ModalsController($target, {
            modal_title: 'Clone Workflow',
            model: CloneWorkflow,
            instance: new CloneWorkflow({
              source_workflow: this.viewModel.workflow,
            }),
            content_view: '/workflows/clone-modal-content.stache',
            custom_save_button_text: 'Proceed',
            button_view: BUTTON_VIEW_SAVE_CANCEL,
          });
        });
    },
  },
  leakScope: true,
});
