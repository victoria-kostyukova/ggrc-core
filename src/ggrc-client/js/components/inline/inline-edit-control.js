/*
    Copyright (C) 2020 Google Inc.
    Licensed under http://www.apache.org/licenses/LICENSE-2.0 <see LICENSE file>
*/

import canStache from 'can-stache';
import canDefineMap from 'can-define/map/map';
import canComponent from 'can-component';
import './readonly-inline-content';
import '../form/fields/checkbox-form-field';
import '../form/fields/multiselect-form-field';
import '../form/fields/date-form-field';
import '../form/fields/dropdown-form-field';
import '../form/fields/person-form-field';
import '../form/fields/rich-text-form-field';
import '../form/fields/text-form-field';
import '../form/fields/numberbox-form-field';
import {isInnerClick, getPlainText} from '../../plugins/ggrc-utils';
import template from './inline-edit-control.stache';

const ViewModel = canDefineMap.extend({
  isValid: {
    get() {
      if (this.mandatory) {
        let value = this.context.value;

        if (this.type === 'text') {
          value = getPlainText(value).trim();
        }

        return !!value;
      }
      return true;
    },
  },
  isShowContent: {
    get() {
      return this.hideContentInEditMode ? this.editMode : true;
    },
  },
  instance: {
    value: () => ({}),
  },
  editMode: {
    value: false,
  },
  withReadMore: {
    value: false,
  },
  isLoading: {
    value: false,
  },
  type: {
    value: '',
  },
  value: {
    value: '',
  },
  placeholder: {
    value: '',
  },
  propName: {
    value: '',
  },
  dropdownOptions: {
    value: () => [],
  },
  dropdownNoValue: {
    value: false,
  },
  dropdownOptionsGroups: {
    value: () => ({}),
  },
  isGroupedDropdown: {
    value: false,
  },
  isLastOpenInline: {
    value: false,
  },
  isEditIconDenied: {
    value: false,
  },
  hideContentInEditMode: {
    value: false,
  },
  mandatory: {
    value: false,
  },
  context: {
    value: () => ({
      value: null,
    }),
  },
  setEditModeInline(args) {
    this.isLastOpenInline = args.isLastOpenInline;
    this.editMode = true;
  },
  setPerson(scope, el, ev) {
    this.context.value = ev.selectedItem.serialize().id;
  },
  unsetPerson(scope, el, ev) {
    ev.preventDefault();
    this.context.value = null;
  },
  save() {
    let oldValue = this.value;
    let value = this.context.value;

    if (!this.isValid) {
      return;
    }

    this.editMode = false;

    if (typeof value === 'string') {
      value = value.trim();
    }

    if (oldValue === value) {
      return;
    }

    this.value = value;

    this.dispatch({
      type: 'inlineSave',
      value: value,
      propName: this.propName,
    });
  },
  cancel() {
    let value = this.value;
    this.editMode = false;
    this.context.value = value;
  },
  updateContext() {
    let value = this.value;
    this.context.value = value;
  },
  fieldValueChanged(args) {
    this.context.value = args.value;
  },
});

export default canComponent.extend({
  tag: 'inline-edit-control',
  view: canStache(template),
  leakScope: true,
  ViewModel,
  events: {
    init() {
      this.viewModel.updateContext();
    },
    '{viewModel} value'() {
      // update value in the readonly mode
      if (!this.viewModel.editMode) {
        this.viewModel.updateContext();
      }
    },
    '{window} mousedown': function (el, ev) {
      let viewModel = this.viewModel;
      let isInside;
      let editMode;

      // prevent closing of current inline after opening...
      if (viewModel.isLastOpenInline) {
        viewModel.isLastOpenInline = false;
        return;
      }

      isInside = isInnerClick(this.element, ev.target);
      editMode = viewModel.editMode;

      if (editMode && !isInside) {
        viewModel.cancel();
      }
    },
  },
});
