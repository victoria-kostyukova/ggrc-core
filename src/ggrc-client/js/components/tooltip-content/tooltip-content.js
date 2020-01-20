/*
    Copyright (C) 2020 Google Inc.
    Licensed under http://www.apache.org/licenses/LICENSE-2.0 <see LICENSE file>
*/

import canStache from 'can-stache';
import canMap from 'can-map';
import canComponent from 'can-component';
import template from './templates/tooltip-content.stache';

const viewModel = canMap.extend({
  content: '',
  placement: 'top',
  /**
   * @private
   */
  showTooltip: false,
  /**
   * @private
   */
  $el: null,
  updateOverflow() {
    const [trimTarget] = this.$el.find('[data-trim-target="true"]');
    this.attr('showTooltip', (
      trimTarget.offsetHeight < trimTarget.scrollHeight ||
      trimTarget.offsetWidth < trimTarget.scrollWidth
    ));
  },
});

const events = {
  inserted(element) {
    this.viewModel.$el = element;
    this.viewModel.updateOverflow();
  },
};

export default canComponent.extend({
  tag: 'tooltip-content',
  view: canStache(template),
  leakScope: true,
  viewModel,
  events,
});
