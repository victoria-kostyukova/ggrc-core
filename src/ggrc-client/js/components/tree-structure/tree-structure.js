/*
    Copyright (C) 2020 Google Inc.
    Licensed under http://www.apache.org/licenses/LICENSE-2.0 <see LICENSE file>
*/

import canMap from 'can-map';
import canComponent from 'can-component';
import {BUTTON_VIEW_SAVE_CANCEL_DELETE} from '../../plugins/utils/template-utils';

const viewModel = canMap.extend({
  element: null,
  parentModel: null,
  contentViewPath: '',
  objectParams: null,
  model: null,
  init() {
    this.attr('objectParams', {
      parent_type: this.attr('parentModel.model_singular'),
      definition_type: this.attr('parentModel.table_singular'),
    });
  },
  async showAddNewItemModal(element) {
    const $target = $('<div class="modal hide"></div>').uniqueId();
    const $trigger = $(element);

    $target.modal_form({}, $trigger);

    const {'default': ModalsController} = await import(
      /* webpackChunkName: "modalsCtrls" */
      '../../controllers/modals/modals-controller'
    );

    new ModalsController($target, {
      new_object_form: true,
      object_params: this.attr('objectParams'),
      button_view: BUTTON_VIEW_SAVE_CANCEL_DELETE,
      model: this.attr('model'),
      current_user: GGRC.current_user,
      skip_refresh: false,
      modal_title: this.attr('modalTitle'),
      content_view: `${this.attr('contentViewPath')}`,
      $trigger,
    });

    $target
      .on('modal:success', (e, instance) => {
        this.addItem(instance);
      })
      .on('hidden', () => {
        $target.remove();
      });
    $trigger.on('modal:added', (e, instance) => {
      this.addItem(instance);
    });
  },
  addItem(item) {
    const ctrl = this.attr('element').find('.tree-structure').control();
    ctrl.enqueue_items([item]);
  },
  removeItem(item) {
    const ctrl = this.attr('element').find('.tree-structure').control();
    ctrl.removeListItem(item);
  },
});

export default canComponent.extend({
  tag: 'tree-structure',
  viewModel,
  init(el) {
    this.viewModel.attr('element', $(el));
  },
  events: {
    '{model} destroyed'(model, event, instance) {
      if (instance instanceof this.viewModel.attr('model')) {
        // determine
        this.viewModel.removeItem(instance);
      }
    },
  },
});

