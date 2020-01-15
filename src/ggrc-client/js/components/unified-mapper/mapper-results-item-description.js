/*
 Copyright (C) 2020 Google Inc.
 Licensed under http://www.apache.org/licenses/LICENSE-2.0 <see LICENSE file>
 */

import canStache from 'can-stache';
import canDefineMap from 'can-define/map/map';
import canComponent from 'can-component';
import template from './templates/mapper-results-item-description.stache';
import {getRolesForType} from '../../plugins/utils/acl-utils';

const viewModel = canDefineMap.extend({
  instance: {
    value: null,
  },
  hasNotes: {
    get() {
      return this.instance.attr('notes') !== undefined;
    },
  },
  hideBlock: {
    get() {
      const objectRoles =
        getRolesForType(this.instance.constructor.model_singular);
      const hasAdmin = objectRoles.find((item) => item.name === 'Admin');
      return !hasAdmin && !this.hasNotes;
    },
  },
  title: {
    get() {
      switch (this.instance.attr('type')) {
        case 'TaskGroup': {
          return 'Details';
        }
        case 'AssessmentTemplate': {
          return 'Default assessment procedure';
        }
        default: {
          return 'Description';
        }
      }
    },
  },
  description: {
    get() {
      return this.instance.attr('description')
        || this.instance.attr('procedure_description');
    },
  },
});

export default canComponent.extend({
  tag: 'mapper-results-item-description',
  view: canStache(template),
  leakScope: true,
  viewModel,
});
