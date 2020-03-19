/*
 Copyright (C) 2020 Google Inc.
 Licensed under http://www.apache.org/licenses/LICENSE-2.0 <see LICENSE file>
 */

import canStache from 'can-stache';
import canComponent from 'can-component';
import '../assessment-templates/assessment-templates-dropdown/assessment-templates-dropdown';
import '../../components/advanced-search/advanced-search-filter-container';
import '../../components/advanced-search/advanced-search-filter-state';
import '../../components/advanced-search/advanced-search-mapping-container';
import '../../components/advanced-search/advanced-search-wrapper';
import '../../components/collapsible-panel/collapsible-panel';
import '../../components/unified-mapper/mapper-results';
import '../../components/mapping-controls/mapping-type-selector';
import ObjectOperationsBaseVM from '../view-models/object-operations-base-vm';
import * as businessModels from '../../models/business-models';
import template from './object-generator.stache';
import {groupTypes} from '../../plugins/utils/models-utils';

/**
 * A component implementing a modal for mapping objects to other objects,
 * taking the object type mapping constraints into account.
 */
export default canComponent.extend({
  tag: 'object-generator',
  view: canStache(template),
  leakScope: true,
  viewModel(attrs, parentViewModel) {
    return ObjectOperationsBaseVM.extend({
      /**
       * @type {
       *  {
       *    id: number,
       *    objectType: string
       *  }
       * }
       * @description Selected assessment template with appropriate type
       * (objectType field) and id.
       */
      assessmentTemplate: {
        value: null,
      },
      object: {
        value: attrs.object,
      },
      join_object_id: {
        value: attrs.joinObjectId,
      },
      type: {
        value: attrs.type,
        /*
        * When object type is changed it should be needed to change a config.
        * For example, if not set a special config for type [TYPE] then is used
        * general config, otherwise special config.
        */
        set(mapType) {
          if (mapType === this.type) {
            return mapType;
          }
          this.setNewType(mapType);
          return mapType;
        },
      },
      relevantTo: {
        value: () => parentViewModel.attr('relevantTo'),
      },
      callback: {
        value: () => parentViewModel.attr('callback'),
      },
      useTemplates: {
        value: true,
      },
      useSnapshots: {
        value: true,
      },
      block_type_change: {
        value: false,
      },
      element: {
        value: null,
      },
      isLoadingOrSaving() {
        return this.is_saving ||
        this.block_type_change ||
        //  disable changing of object type while loading
        //  to prevent errors while speedily selecting different types
        this.is_loading;
      },
      availableTypes() {
        return groupTypes(GGRC.config.snapshotable_objects);
      },
      onAssessmentTemplateChanged({template}) {
        if (!template) {
          this.block_type_change = false;
        } else {
          this.block_type_change = true;
          this.type = template.objectType;
          this.assessmentTemplate = template;
        }
      },
      performGenerateAssessment(event) {
        const instance = businessModels[this.object].findInCacheById(
          this.join_object_id);

        event.preventDefault();

        if ($(event.target).hasClass('disabled') || this.is_saving) {
          return;
        }

        this.is_saving = true;

        return this.callback(this.selected, {
          type: this.type,
          target: this.object,
          instance: instance,
          assessmentTemplate: this.assessmentTemplate,
          context: this,
        });
      },
      closeModal() {
        this.is_saving = false;
        if (this.element) {
          this.element.find('.modal-dismiss').trigger('click');
        }
      },
    });
  },

  events: {
    inserted() {
      this.viewModel.selected.replace([]);
      this.viewModel.entries.replace([]);
      this.viewModel.element = this.element;

      // show loading indicator before actual
      // Assessment Template is loading
      this.viewModel.is_loading = true;
      this.viewModel.resultsRequested = true;
    },
  },
});
