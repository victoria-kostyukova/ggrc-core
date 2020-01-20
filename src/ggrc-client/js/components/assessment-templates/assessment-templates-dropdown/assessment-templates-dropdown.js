/*
    Copyright (C) 2020 Google Inc.
    Licensed under http://www.apache.org/licenses/LICENSE-2.0 <see LICENSE file>
*/

import loToArray from 'lodash/toArray';
import loForEach from 'lodash/forEach';
import canStache from 'can-stache';
import canMap from 'can-map';
import canComponent from 'can-component';
import '../../dropdown/dropdown-component';
import {
  buildParam,
  batchRequests,
} from '../../../plugins/utils/query-api-utils';
import template from './assessment-templates-dropdown.stache';
import tracker from '../../../tracker';

export default canComponent.extend({
  tag: 'assessment-templates-dropdown',
  view: canStache(template),
  leakScope: true,
  extraClassName: '',
  viewModel: canMap.extend({
    /**
     * List of dropdown items, which represent assessment templates
     */
    optionsList: [],
    instance: null,
    assessmentTemplate: '',
    needToSelectInitialTemplate: false,
    onTemplateChanged(value) {
      let template = null;

      if (value.length) {
        const [id, objectType] = value.split('-');
        template = {id: Number(id), objectType};
      }

      this.dispatch({
        type: 'onTemplateChanged',
        template,
      });
    },
    initDropdownOptions(templates) {
      const result = {};
      const noValue = {
        title: 'No template',
        value: '',
      };
      loForEach(templates, (instance) => {
        const type = instance.template_object_type;
        if (!result[type]) {
          result[type] = {
            group: type,
            subitems: [],
          };
        }
        result[type].subitems.push({
          title: instance.title,
          value: instance.id + '-' + type,
        });
      });

      this.attr('optionsList', [noValue].concat(loToArray(result)));
    },
    /**
     * Set the initial Assessment Template to be selected in the relevant
     * dropdown menu.
     *
     * By default, the first option from the first option group is selected,
     * unless such option does not exist.
     *
     * @param {Array} templates - a list of possible options for the dropdown
     */
    selectInitialTemplate() {
      const optionsList = this.attr('optionsList');


      // The first element is a dummy option, thus if there are no other
      // elements, simply don't pick anything.
      if (optionsList.length < 2) {
        return;
      }

      let initialTemplate;
      const WARN_EMPTY_GROUP = [
        'canComponent.assessmentTemplates: ',
        'An empty template group encountered, possible API error',
      ].join('');
      const nonDummyItem = optionsList[1]; // a single item or an object group

      if (!nonDummyItem.group) {
        // a single item
        initialTemplate = nonDummyItem.value;
      } else {
        if (!nonDummyItem.subitems || nonDummyItem.subitems.length === 0) {
          console.warn(WARN_EMPTY_GROUP);
          return; // an empty group, no option to pick from it
        }
        initialTemplate = nonDummyItem.subitems[0].value;
      }
      if (!this.attr('assessmentTemplate')) {
        this.attr('assessmentTemplate', initialTemplate);
        tracker.stop(tracker.FOCUS_AREAS.ASSESSMENT,
          tracker.USER_JOURNEY_KEYS.LOADING,
          tracker.USER_ACTIONS.ASSESSMENT.OPEN_ASMT_GEN_MODAL);
      }
    },
    initDropdown() {
      const instance = this.attr('instance');
      const param = buildParam('AssessmentTemplate', {}, {
        type: instance.type,
        id: instance.id,
      }, ['id', 'type', 'title', 'template_object_type']);

      batchRequests(param).then(({AssessmentTemplate: {values}}) => {
        this.initDropdownOptions(values);

        if (this.attr('needToSelectInitialTemplate')) {
          this.selectInitialTemplate();
        }

        this.dispatch('assessmentTemplateLoaded');
      });
    },
  }),
  init() {
    this.viewModel.initDropdown();
  },
  events: {
    '{viewModel} assessmentTemplate'(viewModel, event, template) {
      this.viewModel.onTemplateChanged(template);
    },
  },
});
