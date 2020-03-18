/*
  Copyright (C) 2020 Google Inc.
  Licensed under http://www.apache.org/licenses/LICENSE-2.0 <see LICENSE file>
*/

import loPick from 'lodash/pick';
import loMap from 'lodash/map';
import canStache from 'can-stache';
import canComponent from 'can-component';
import '../../components/advanced-search/advanced-search-filter-container';
import '../../components/advanced-search/advanced-search-filter-state';
import '../../components/advanced-search/advanced-search-wrapper';
import '../../components/unified-mapper/mapper-results';
import '../../components/collapsible-panel/collapsible-panel';
import ObjectOperationsBaseVM from '../view-models/object-operations-base-vm';
import template from './assessment-template-clone.stache';
import {getPageInstance} from '../../plugins/utils/current-page-utils';
import {ggrcPost} from '../../plugins/ajax-extensions';

export default canComponent.extend({
  tag: 'assessment-template-clone',
  view: canStache(template),
  leakScope: true,
  ViewModel: ObjectOperationsBaseVM.extend({
    element: {
      value: null,
    },
    isAuditPage() {
      return getPageInstance().type === 'Audit';
    },
    extendInstanceData(instance) {
      instance = instance().serialize();
      const audit =
        loPick(instance, ['id', 'type', 'title', 'issue_tracker']);
      const context = {
        id: instance.context.id,
        type: instance.context.type,
      };
      return JSON.stringify({audit, context});
    },
    closeModal() {
      if (this.element) {
        this.element.find('.modal-dismiss').trigger('click');
      }
    },
    cloneAsmtTempalte() {
      this.is_saving = true;

      this.cloneObjects()
        .always(() => {
          this.is_saving = false;
        })
        .done(() => {
          this.dispatch('refreshTreeView');
          this.closeModal();
        });
    },
    cloneObjects() {
      const sourceIds = loMap(this.selected, (item) => item.id);
      const destinationId = this.join_object_id;

      return ggrcPost('/api/assessment_template/clone', [{
        sourceObjectIds: sourceIds,
        destination: {
          type: 'Audit',
          id: destinationId,
        },
      }]);
    },
  }),
  events: {
    inserted() {
      this.viewModel.element = this.element;
      this.viewModel.onSubmit();
    },
    '{window} preload'(el, ev) {
      const modal = $(ev.target).data('modal_form');
      const options = modal && modal.options;

      if (options && options.inCloner) {
        this.viewModel.closeModal();
      }
    },
  },
});
