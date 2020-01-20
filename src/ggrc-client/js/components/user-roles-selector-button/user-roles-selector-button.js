/*
  Copyright (C) 2020 Google Inc., authors, and contributors <see AUTHORS file>
  Licensed under http://www.apache.org/licenses/LICENSE-2.0 <see LICENSE file>
*/

import canMap from 'can-map';
import canComponent from 'can-component';
export default canComponent.extend({
  tag: 'user-roles-selector-button',
  leakScope: true,
  viewModel: canMap.extend({
    personId: null,
    async openModal(ev) {
      let $trigger = $(ev.target);
      const {
        'default': userRolesModalSelector,
      } = await import(
        /* webpackChunkName: "userRoleModalSelector" */
        '../../controllers/user-roles-selector-controller'
      );

      let options = {personId: this.attr('personId')};

      ev.preventDefault();
      ev.stopPropagation();

      // Trigger the controller
      userRolesModalSelector.launch($trigger, options);
    },
  }),
});
