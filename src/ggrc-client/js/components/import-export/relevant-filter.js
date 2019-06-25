/*
    Copyright (C) 2019 Google Inc.
    Licensed under http://www.apache.org/licenses/LICENSE-2.0 <see LICENSE file>
*/

import loForEach from 'lodash/forEach';
import loFind from 'lodash/find';
import makeArray from 'can-util/js/make-array/make-array';
import canStache from 'can-stache';
import canMap from 'can-map';
import canComponent from 'can-component';
import template from './templates/relevant-filter.stache';
import * as businessModels from '../../models/business-models';
import TreeViewConfig from '../../apps/base_widgets';

export default canComponent.extend({
  tag: 'relevant-filter',
  view: canStache(template),
  leakScope: true,
  viewModel: canMap.extend({
    relevant_menu_item: '',
    operators: [{title: 'AND', value: 'AND'}, {title: 'OR', value: 'OR'}],
    addFilter: function () {
      let menu = this.menu();

      if (this.attr('relevant_menu_item') === 'parent' &&
           Number(this.attr('panel_index')) !== 0 &&
           !this.attr('has_parent')) {
        menu.unshift({
          title_singular: 'Previous objects',
          model_singular: '__previous__',
        });
      }

      this.attr('relevant').push({
        value: false,
        filter: new canMap(),
        textValue: '',
        menu: menu,
        model_name: menu[0].model_singular,
        operator: 'AND',
      });
    },
    menu() {
      const workflowRelatedTypes = ['Cycle', 'CycleTaskGroup',
        'CycleTaskGroupObjectTask', 'TaskGroup', 'Workflow'];
      const baseWidgetsTypes = canMap.keys(
        TreeViewConfig.attr('base_widgets_by_type')
      );

      return _(workflowRelatedTypes)
        .concat(baseWidgetsTypes)
        .map((mapping) => businessModels[mapping])
        .compact()
        .sortBy('model_singular')
        .value();
    },
    optionHidden: function (option) {
      let type = option.model_singular;
      return makeArray(this.attr('relevantTo'))
        .some(function (item) {
          return item.readOnly && item.type === type;
        });
    },
    removeFilter(el, index) {
      this.attr('relevant').splice(index, 1);
    },
  }),
  events: {
    init: function () {
      this.setRelevant();
    },
    setRelevant: function () {
      this.viewModel.attr('relevant').replace([]);

      const relevantTo = this.viewModel.attr('relevantTo') || [];
      loForEach(relevantTo, function (item) {
        let model = new businessModels[item.type](item);
        this.viewModel.attr('relevant').push({
          readOnly: item.readOnly,
          value: true,
          filter: model,
          textValue: '',
          menu: this.viewModel.attr('menu'),
          model_name: model.constructor.model_singular,
        });
      }, this);
    },
    '.ui-autocomplete-input autocomplete:select': function (el, ev, data) {
      let index = el.data('index');
      let panel = this.viewModel.attr('relevant')[index];
      let textValue = el.data('ggrc-autocomplete').term;

      panel.attr('filter', data.item.attr());
      panel.attr('value', true);
      panel.attr('textValue', textValue);
    },
    '.ui-autocomplete-input input': function (el) {
      let index = el.data('index');
      let panel = this.viewModel.attr('relevant')[index];

      panel.attr('value', false);
      panel.attr('textValue', el.val());
    },
    '{viewModel.relevant} change': function (list, item, which) {
      this.viewModel.attr('has_parent',
        loFind(this.viewModel.attr('relevant'),
          {model_name: '__previous__'}));
      if (!/model_name/gi.test(which)) {
        return;
      }
      item.target.attr('filter', new canMap());
      item.target.attr('value', false);
    },
  },
});
