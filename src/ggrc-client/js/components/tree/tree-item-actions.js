/*
 Copyright (C) 2020 Google Inc.
 Licensed under http://www.apache.org/licenses/LICENSE-2.0 <see LICENSE file>
 */

import canStache from 'can-stache';
import canDefineMap from 'can-define/map/map';
import canComponent from 'can-component';
import '../lazy-render/lazy-render';
import '../show-related-assessments-button/show-related-assessments-button';
import template from './templates/tree-item-actions.stache';
import {
  isSnapshot,
} from '../../plugins/utils/snapshot-utils';
import {
  getPageType,
} from '../../plugins/utils/current-page-utils';
import {isAllowedFor} from '../../permission';
import {getMappingList} from '../../models/mappers/mappings';

const forbiddenEditList = ['Cycle', 'CycleTaskGroup'];

const ViewModel = canDefineMap.extend({
  $el: {
    value: null,
  },
  instance: {
    value: null,
  },
  childOptions: {
    value: null,
  },
  addItem: {
    value: null,
  },
  isAllowToExpand: {
    value: null,
  },
  childModelsList: {
    value: null,
  },
  expanded: {
    value: false,
  },
  activated: {
    value: false,
  },
  deepLimit: {
    type: 'number',
    value: 0,
  },
  canExpand: {
    type: 'boolean',
    value: false,
  },
  expandIcon: {
    type: 'string',
    get() {
      return this.expanded ? 'compress' : 'expand';
    },
  },
  expanderTitle: {
    type: 'string',
    get() {
      return this.expanded ? 'Collapse tree' : 'Expand tree';
    },
  },
  isSnapshot: {
    type: 'boolean',
    get() {
      return isSnapshot(this.instance);
    },
  },
  denyEditAndMap: {
    type: 'boolean',
    get() {
      let instance = this.instance;
      let type = instance.attr('type');
      let isSnapshot = this.isSnapshot;
      let isArchived = instance.attr('archived');
      let isRestricted = instance.attr('_is_sox_restricted');
      let isInForbiddenList = forbiddenEditList.indexOf(type) > -1;
      return !isAllowedFor('update', instance) ||
        (isSnapshot || isInForbiddenList || isArchived || isRestricted);
    },
  },
  isAllowedToEdit: {
    type: 'boolean',
    get() {
      return !this.denyEditAndMap
        && !this.instance.constructor.isChangeableExternally
        && !this.instance.attr('readonly');
    },
  },
  isAllowedToMap: {
    type: 'boolean',
    get() {
      let type = this.instance.attr('type');

      if (type === 'Assessment') {
        let audit = this.instance.attr('audit');

        if (!isAllowedFor('read', audit)) {
          return false;
        }
      }

      let denyEditAndMap = this.denyEditAndMap;
      let mappingTypes = getMappingList(type);

      return !denyEditAndMap && !!mappingTypes.length;
    },
  },
  maximizeObject(scope, el, ev) {
    ev.preventDefault();
    ev.stopPropagation();

    this.dispatch({
      type: 'preview',
      element: el,
    });
  },
  openObject(scope, el, ev) {
    ev.stopPropagation();
  },
  expand(scope, el, ev) {
    this.dispatch('expand');
    ev.stopPropagation();
  },
  showReducedIcon() {
    let pages = ['Workflow'];
    let instanceTypes = [
      'Cycle',
      'CycleTaskGroup',
      'CycleTaskGroupObjectTask',
    ];
    return pages.includes(getPageType()) &&
      instanceTypes.includes(this.instance.type);
  },
  showReducedOptions() {
    let pages = ['Workflow'];
    let instanceTypes = [
      'Cycle',
      'CycleTaskGroup',
    ];
    return pages.includes(getPageType()) &&
      instanceTypes.includes(this.instance.type);
  },
});

export default canComponent.extend({
  tag: 'tree-item-actions',
  view: canStache(template),
  leakScope: true,
  ViewModel,
  events: {
    inserted() {
      let parents = this.element.parents('sub-tree-wrapper').length;
      let canExpand = parents < this.viewModel.deepLimit;
      this.viewModel.canExpand = canExpand;
      this.viewModel.$el = this.element;
    },
    '.tree-item-actions__content mouseenter'(el, ev) {
      let vm = this.viewModel;

      if (!vm.activated) {
        vm.activated = true;
      }
      // event not needed after render of content
      el.off(ev);
    },
  },
});
