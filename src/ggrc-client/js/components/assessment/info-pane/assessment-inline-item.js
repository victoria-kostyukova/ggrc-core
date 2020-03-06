/*
    Copyright (C) 2020 Google Inc.
    Licensed under http://www.apache.org/licenses/LICENSE-2.0 <see LICENSE file>
*/

import canStache from 'can-stache';
import canDefineMap from 'can-define/map/map';
import canComponent from 'can-component';
import './confirm-edit-action';
import template from './assessment-inline-item.stache';

const ViewModel = canDefineMap.extend({
  instance: {
    value: () => ({}),
  },
  propName: {
    value: '',
  },
  value: {
    value: '',
  },
  type: {
    value: '',
  },
  dropdownOptions: {
    value: () => [],
  },
  dropdownOptionsGroups: {
    value: () => ({}),
  },
  dropdownClass: {
    value: '',
  },
  isGroupedDropdown: {
    value: false,
  },
  dropdownNoValue: {
    value: false,
  },
  withReadMore: {
    value: false,
  },
  isEditIconDenied: {
    value: false,
  },
  onStateChangeDfd: {
    value: () => $.Deferred().resolve(),
  },
  mandatory: {
    value: false,
  },
  isConfirmationNeeded: {
    value: true,
  },
});

export default canComponent.extend({
  tag: 'assessment-inline-item',
  view: canStache(template),
  leakScope: true,
  ViewModel,
});
