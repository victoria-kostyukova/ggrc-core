/*
  Copyright (C) 2019 Google Inc.
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
import {ggrcPost} from '../../plugins/ajax_extensions';

export default canComponent.extend({
  tag: 'assessment-template-clone',
  view: canStache(template),
  leakScope: true,
  viewModel: function () {
    return ObjectOperationsBaseVM.extend({
      isAuditPage() {
        return getPageInstance().type === 'Audit';
      },
      extendInstanceData(instance) {
        instance = instance().serialize();
        let audit = loPick(instance, ['id', 'type', 'title', 'issue_tracker']);
        let context = {
          id: instance.context.id,
          type: instance.context.type,
        };
        return JSON.stringify({audit, context});
      },
    });
  },
  events: {
    inserted() {
      this.viewModel.onSubmit();
    },
    closeModal() {
      if (this.element) {
        this.element.find('.modal-dismiss').trigger('click');
      }
    },
    '{window} preload': function (el, ev) {
      let modal = $(ev.target).data('modal_form');
      let options = modal && modal.options;

      if (options && options.inCloner) {
        this.closeModal();
      }
    },
    '.btn-cancel click': function () {
      this.closeModal();
    },
    '.btn-clone click': function () {
      this.viewModel.attr('is_saving', true);

      this.cloneObjects()
        .always(() => {
          this.viewModel.attr('is_saving', false);
        })
        .done(() => {
          this.viewModel.dispatch('refreshTreeView');
          this.closeModal();
        });
    },
    cloneObjects() {
      let sourceIds = loMap(this.viewModel.attr('selected'), (item) => item.id);
      let destinationId = this.viewModel.attr('join_object_id');

      return ggrcPost('/api/assessment_template/clone', [{
        sourceObjectIds: sourceIds,
        destination: {
          type: 'Audit',
          id: destinationId,
        },
      }]);
    },
  },
});
