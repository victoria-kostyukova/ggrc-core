/*
 Copyright (C) 2020 Google Inc.
 Licensed under http://www.apache.org/licenses/LICENSE-2.0 <see LICENSE file>
 */

import canStache from 'can-stache';
import canMap from 'can-map';
import canComponent from 'can-component';
import template from './templates/sub-tree-models.stache';
import childModelsMap from '../tree/child-models-map';
import {
  getModelsForSubTier,
} from '../../plugins/utils/tree-view-utils';
import {
  getWidgetConfig,
} from '../../plugins/utils/widgets-utils';

let viewModel = canMap.extend({
  define: {
    isActive: {
      type: Boolean,
      value: false,
    },
    displayModelsList: {
      get: function () {
        return this.attr('modelsList').map((model) => {
          const displayName = model.attr('widgetName')
            .replace(' ', '')
            .split(/(?=[A-Z])/)
            .join(' ');
          model.attr('displayName', displayName);
          return model;
        }).sort((a, b) => {
          return a.displayName > b.displayName ? 1 : -1;
        });
      },
    },
    selectedModels: {
      set: function (newModels) {
        let modelsList = this.attr('modelsList') || [];

        modelsList.forEach(function (item) {
          item.attr('display', newModels.indexOf(item.name) !== -1);
        });
        return newModels;
      },
    },
  },
  init: function () {
    let modelName = this.attr('type');
    let defaultModels = getModelsForSubTier(modelName).selected;
    this.attr('modelsList', this.getDisplayModels(modelName));

    // list of models can be changed in others tree-items
    childModelsMap.attr('container').bind(modelName, function (ev) {
      this.attr('selectedModels',
        childModelsMap.getModels(modelName) || defaultModels);
    }.bind(this));
  },
  type: null,
  modelsList: null,
  title: null,
  activate: function () {
    this.attr('isActive', true);
  },
  // is called when "Set Visibility" button is clicked
  setVisibility: function (ev) {
    let selectedModels = this.getSelectedModels();

    childModelsMap.setModels(this.attr('type'), selectedModels);

    this.attr('isActive', false);
    ev.stopPropagation();
  },
  getDisplayModels: function (parentType) {
    let savedModels = childModelsMap.getModels(parentType);
    let defaultModels = getModelsForSubTier(parentType);
    let selectedModels = savedModels || defaultModels.selected;
    let displayList;

    displayList = defaultModels.available.map(function (model) {
      let config = getWidgetConfig(model);

      return {
        widgetName: config.widgetName,
        name: model,
        display: selectedModels.indexOf(model) !== -1,
      };
    });
    return displayList;
  },
  getSelectedModels: function () {
    return this.attr('modelsList').filter((model) => model.display)
      .map((model) => model.name);
  },
  selectAll: function (ev) {
    ev.stopPropagation();
    this.attr('modelsList').forEach(function (item) {
      item.attr('display', true);
    });
  },
  selectNone: function (ev) {
    ev.stopPropagation();
    this.attr('modelsList').forEach(function (item) {
      item.attr('display', false);
    });
  },
});

let events = {
  '.sub-tree-models mouseleave': function () {
    this.viewModel.attr('isActive', false);
  },
};

export default canComponent.extend({
  tag: 'sub-tree-models',
  view: canStache(template),
  leakScope: true,
  viewModel: viewModel,
  events: events,
});

export {
  viewModel,
  events,
};
