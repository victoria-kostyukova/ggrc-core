/*
 Copyright (C) 2020 Google Inc.
 Licensed under http://www.apache.org/licenses/LICENSE-2.0 <see LICENSE file>
 */

import canStache from 'can-stache';
import canDefineMap from 'can-define/map/map';
import canComponent from 'can-component';
import './mapper-results-item-status';
import './mapper-results-item-details';
import './mapper-results-item-attrs';
import '../object-selection/object-selection-item';
import template from './templates/mapper-results-item.stache';
import Snapshot from '../../models/service-models/snapshot';
import * as businessModels from '../../models/business-models';

const ViewModel = canDefineMap.extend({
  showOpenButton: {
    get() {
      return this.searchOnly || this.isBulkUpdateView();
    },
  },
  viewClass: {
    get() {
      return this.isBulkUpdateView() ? 'bulk-update-view' : '';
    },
  },
  itemData: {
    value: () => ({}),
  },
  searchOnly: {
    value: false,
  },
  drawRelatedAssessments: {
    value: false,
  },
  selectedColumns: {
    value: () => [],
  },
  serviceColumns: {
    value: () => [],
  },
  showDetails: {
    value: false,
  },
  itemDetailsViewType: {
    value: '',
  },
  title() {
    let displayItem = this.displayItem();
    return displayItem.title ||
      displayItem.name ||
      displayItem.email;
  },
  displayItem() {
    let itemData = this.itemData;
    return itemData.revision ?
      itemData.revision.content :
      itemData;
  },
  objectTypeIcon() {
    let objectType = this.objectType();
    let Model = businessModels[objectType];
    return 'fa-' + Model.table_singular;
  },
  toggleIconCls() {
    return this.showDetails ? 'fa-caret-down' : 'fa-caret-right';
  },
  toggleDetails() {
    this.showDetails = !this.showDetails;
  },
  isSnapshot() {
    return this.itemData.type === Snapshot.model_singular;
  },
  isBulkUpdateView() {
    return this.itemDetailsViewType === 'bulk-update';
  },
  objectType() {
    if (this.isSnapshot()) {
      return this.itemData.child_type;
    }
    return this.itemData.type;
  },
  showRelatedAssessments() {
    this.dispatch({
      type: 'showRelatedAssessments',
      instance: this.displayItem(),
    });
  },
});

const events = {
  // When item was deleted
  '{viewModel.itemData} destroyed'() {
    const viewModel = this.viewModel;

    viewModel.dispatch({
      type: 'itemDataDestroyed',
      itemId: viewModel.itemData.id,
    });
  },
};

export default canComponent.extend({
  tag: 'mapper-results-item',
  view: canStache(template),
  leakScope: true,
  ViewModel,
  events,
});
