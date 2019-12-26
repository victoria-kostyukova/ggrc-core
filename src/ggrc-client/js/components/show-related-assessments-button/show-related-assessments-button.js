/*
 Copyright (C) 2020 Google Inc.
 Licensed under http://www.apache.org/licenses/LICENSE-2.0 <see LICENSE file>
 */

import canStache from 'can-stache';
import canDefineMap from 'can-define/map/map';
import canComponent from 'can-component';
import '../related-objects/related-assessments';
import template from './show-related-assessments-button.stache';
import {hasRelatedAssessments} from '../../plugins/utils/models-utils';

const ViewModel = canDefineMap.extend({
  cssClasses: {
    get() {
      return !this.resetStyles ?
        'btn btn-lightBlue ' + this.extraBtnCss : '';
    },
  },
  resetStyles: {
    type: 'boolean',
    value: false,
  },
  showTitle: {
    type: 'boolean',
    value: true,
  },
  showIcon: {
    type: 'boolean',
    value: false,
  },
  title: {
    get() {
      return this.text || 'Assessments';
    },
  },
  instance: {
    value: () => ({}),
  },
  state: {
    value: () => ({
      open: false,
    }),
  },
  extraBtnCss: {
    value: '',
  },
  text: {
    value: '',
  },
  modalTitle: {
    value: 'Related Assessments',
  },
  showRelatedAssessments() {
    this.state.open = true;
  },
  // Temporary put this logic on the level of Component itself
  isAllowedToShow: function () {
    return hasRelatedAssessments(this.instance.attr('type'));
  },
});

export default canComponent.extend({
  tag: 'show-related-assessments-button',
  view: canStache(template),
  leakScope: true,
  ViewModel,
});
