/*
 Copyright (C) 2020 Google Inc.
 Licensed under http://www.apache.org/licenses/LICENSE-2.0 <see LICENSE file>
 */

import canStache from 'can-stache';
import canDefineMap from 'can-define/map/map';
import canComponent from 'can-component';
import template from './templates/sub-tree-models.stache';
import childModelsMap from '../tree/child-models-map';
import {
  getModelsForSubTier,
} from '../../plugins/utils/tree-view-utils';
import {
  getWidgetConfig,
} from '../../plugins/utils/widgets-utils';

const ViewModel = canDefineMap.extend({
  type: {
    value: null,
  },
  modelsList: {
    value: null,
  },
  title: {
    value: null,
  },
  isActive: {
    type: 'boolean',
    value: false,
  },
  displayModelsList: {
    get() {
      return this.modelsList.map((model) => {
        const displayName = model.widgetName
          .replace(' ', '')
          .split(/(?=[A-Z])/)
          .join(' ');
        model.displayName = displayName;
        return model;
      }).sort((a, b) => {
        return a.displayName > b.displayName ? 1 : -1;
      });
    },
  },
  selectedModels: {
    set(newModels) {
      let modelsList = this.modelsList || [];

      modelsList.forEach((item) => {
        item.display = newModels.indexOf(item.name) !== -1;
      });
      return newModels;
    },
  },
  init() {
    let modelName = this.type;
    let defaultModels = getModelsForSubTier(modelName).selected;
    this.modelsList = this.getDisplayModels(modelName);

    // list of models can be changed in others tree-items
    childModelsMap.attr('container').bind(modelName, () => {
      this.selectedModels =
        childModelsMap.getModels(modelName) || defaultModels;
    });
  },
  activate() {
    this.isActive = true;
  },
  // is called when "Set Visibility" button is clicked
  setVisibility(ev) {
    let selectedModels = this.getSelectedModels();

    childModelsMap.setModels(this.type, selectedModels);

    this.isActive = false;
    ev.stopPropagation();
  },
  getDisplayModels(parentType) {
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
  getSelectedModels() {
    return this.modelsList
      .filter((model) => model.display)
      .map((model) => model.name);
  },
  selectAll(ev) {
    ev.stopPropagation();
    this.modelsList.forEach((item) => {
      item.display = true;
    });
  },
  selectNone(ev) {
    ev.stopPropagation();
    this.modelsList.forEach((item) => {
      item.display = false;
    });
  },
});

let events = {
  '.sub-tree-models mouseleave'() {
    this.viewModel.isActive = false;
  },
};

export default canComponent.extend({
  tag: 'sub-tree-models',
  view: canStache(template),
  leakScope: true,
  ViewModel,
  events,
});

export {
  ViewModel,
  events,
};
