/*
 Copyright (C) 2020 Google Inc.
 Licensed under http://www.apache.org/licenses/LICENSE-2.0 <see LICENSE file>
 */

import canDefineMap from 'can-define/map/map';
import {
  getPageType,
} from '../../plugins/utils/current-page-utils';
import tracker from '../../tracker';
import {trigger} from 'can-event';

export default canDefineMap.extend({
  expanded: {
    type: 'boolean',
    value: false,
  },
  instance: {
    value: null,
  },
  limitDepthTree: {
    value: 0,
  },
  itemSelector: {
    value: '',
  },
  $el: {
    value: null,
  },
  onExpand(event) {
    let isExpanded = this.expanded;

    if (event && isExpanded !== event.state) {
      if (isExpanded !== event.state) {
        this.expanded = event.state;
      }
    } else {
      this.expanded = !isExpanded;
    }
  },
  onClick($element, event) {
    if ($(event.target).is('.link')) {
      event.stopPropagation();
      return;
    }

    let instance = this.instance;

    switch (instance.attr('type')) {
      case 'Cycle':
      case 'CycleTaskGroup':
        if (getPageType() === 'Workflow') {
          this.expanded = !this.expanded;
          return;
        }
        break;
    }

    this.select($element);
  },
  collapseAndHighlightItem() {
    const animationDuration = 2000;
    let el = this.$el;
    this.expanded = false;

    el.addClass('tree-item-refresh-animation')
      .delay(animationDuration)
      .queue((next) => {
        el.removeClass('tree-item-refresh-animation');
        next();
      });
  },
  select($element) {
    let instance = this.instance;
    let itemSelector = this.itemSelector;

    if (instance.type === 'Assessment') {
      tracker.start(instance.type,
        tracker.USER_JOURNEY_KEYS.INFO_PANE,
        tracker.USER_ACTIONS.INFO_PANE.OPEN_INFO_PANE);
    }

    $element = $element.closest(itemSelector);
    trigger.call($element[0], 'selectTreeItem', [$element, instance]);
  },
});
