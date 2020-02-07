/*
 Copyright (C) 2020 Google Inc.
 Licensed under http://www.apache.org/licenses/LICENSE-2.0 <see LICENSE file>
*/

import canStache from 'can-stache';
import canDefineMap from 'can-define/map/map';
import canComponent from 'can-component';
import template from './templates/three-dots-menu.stache';

const ViewModel = canDefineMap.extend({
  disabled: {
    value: true,
  },
  observer: {
    value: null,
  },
  manageEmptyList(menuNode) {
    // check to avoid rendering empty components
    const isEmpty = $(menuNode).find('li').length === 0;
    this.disabled = isEmpty;
  },
  mutationCallback(mutationsList) {
    mutationsList.forEach((mutation) => {
      const menuNode = mutation.target;
      this.manageEmptyList(menuNode);
    });
  },
  initObserver(menuNode) {
    const config = {childList: true};
    const observer = new MutationObserver(this.mutationCallback.bind(this));
    observer.observe(menuNode, config);
    this.observer = observer;
  },
});

const events = {
  inserted(element) {
    const [menuNode] = element.find('[role=menu]');
    this.viewModel.initObserver(menuNode);
    this.viewModel.manageEmptyList(menuNode);
  },
  removed() {
    this.viewModel.observer.disconnect();
  },
};

export default canComponent.extend({
  tag: 'three-dots-menu',
  view: canStache(template),
  leakScope: true,
  ViewModel,
  events,
});
