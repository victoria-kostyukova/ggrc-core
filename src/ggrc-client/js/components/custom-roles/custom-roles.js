/*
 Copyright (C) 2020 Google Inc.
 Licensed under http://www.apache.org/licenses/LICENSE-2.0 <see LICENSE file>
 */

import canStache from 'can-stache';
import canComponent from 'can-component';
import '../related-objects/related-people-access-control';
import '../related-objects/related-people-access-control-group';
import '../people/editable-people-group';
import template from './templates/custom-roles.stache';
import viewModel from './custom-roles-vm';

export default canComponent.extend({
  tag: 'custom-roles',
  view: canStache(template),
  leakScope: true,
  viewModel,
});
