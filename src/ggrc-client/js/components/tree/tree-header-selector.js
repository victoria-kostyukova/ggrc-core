/*
 Copyright (C) 2020 Google Inc.
 Licensed under http://www.apache.org/licenses/LICENSE-2.0 <see LICENSE file>
 */

import canDefineMap from 'can-define/map/map';
import canComponent from 'can-component';

const ViewModel = canDefineMap.extend({
  controller: {
    value: null,
  },
  $rootEl: {
    value: null,
  },
});

export default canComponent.extend({
  tag: 'tree-header-selector',
  leakScope: true,
  ViewModel,
  events: {
    init(element) {
      this.viewModel.controller = this;
      this.viewModel.$rootEl = $(element);
    },
    disable_attrs() {
      let MAX_ATTR = 7;
      let $check = this.element.find('.attr-checkbox');
      let $mandatory = $check.filter('.mandatory');
      let $selected = $check.filter(':checked');
      let $notSelected = $check.not(':checked');

      if ($selected.length === MAX_ATTR) {
        $notSelected.prop('disabled', true)
          .closest('li').addClass('disabled');
      } else {
        $check.prop('disabled', false)
          .closest('li').removeClass('disabled');
        // Make sure mandatory items are always disabled
        $mandatory.prop('disabled', true)
          .closest('li').addClass('disabled');
      }
    },
    'input.attr-checkbox click'(el, ev) {
      this.disable_attrs(el, ev);
      ev.stopPropagation();
    },
    '.dropdown-menu-form click'(el, ev) {
      ev.stopPropagation();
    },
    '.tview-dropdown-toggle click'(el, ev) {
      this.disable_attrs(el, ev);
    },
    '.set-tree-attrs,.close-dropdown click'() {
      this.viewModel.$rootEl.removeClass('open');
      this.viewModel.$rootEl.parents('.dropdown-menu')
        .parent().removeClass('open');
    },
  },
});
