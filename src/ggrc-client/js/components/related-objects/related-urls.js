/*
    Copyright (C) 2020 Google Inc.
    Licensed under http://www.apache.org/licenses/LICENSE-2.0 <see LICENSE file>
*/

import loMap from 'lodash/map';
import canStache from 'can-stache';
import canComponent from 'can-component';
import canDefineMap from 'can-define/map/map';
import {isAllowedFor} from '../../permission';
import template from './templates/related-urls.stache';
import {notifier} from '../../plugins/utils/notifiers-utils';
import {sanitizer} from '../../plugins/utils/url-utils';

const ViewModel = canDefineMap.extend({
  canAddUrl: {
    get() {
      let canEditInstance = this.instance.isNew() ||
        isAllowedFor('update', this.instance);
      let isNotEditable = this.isNotEditable;

      return canEditInstance && !isNotEditable;
    },
  },
  canRemoveUrl: {
    get() {
      let canEditInstance = this.instance.isNew() ||
        isAllowedFor('update', this.instance);
      let isNotEditable = this.isNotEditable;
      let allowToRemove = this.allowToRemove;

      return canEditInstance && !isNotEditable && allowToRemove;
    },
  },
  emptyMessage: {
    get() {
      let canAddUrl = this.canAddUrl;

      return canAddUrl ? '' : 'None';
    },
  },
  showMore: {
    get() {
      return !this.isSnapshot;
    },
  },
  instance: {
    value: null,
  },
  isSnapshot: {
    value: false,
  },
  element: {
    value: null,
  },
  urls: {
    value: () => [],
  },
  value: {
    value: '',
  },
  isFormVisible: {
    value: false,
  },
  isDisabled: {
    value: false,
  },
  isNotEditable: {
    value: false,
  },
  allowToRemove: {
    value: true,
  },
  /**
   * @description Moves focus to the create url input element
   */
  moveFocusToInput() {
    let inputElements = this.element.find('input');
    if (inputElements.length) {
      inputElements[0].focus();
    }
  },
  /**
   * Handle changes during toggling form visibility.
   *
   * @param  {Boolean} isVisible - New value for form visibility
   * @param  {Boolean} [keepValue=false] - Whether to preserve the existing
   *   value of the form input field or not.
   */

  toggleFormVisibility(isVisible, keepValue) {
    this.isFormVisible = isVisible;
    if (!keepValue) {
      this.value = '';
    }
    if (isVisible) {
      this.moveFocusToInput();
    }
  },
  /**
   * @description Handles create url form submitting
   *
   * @param  {String} url - url to create
   * @return {Boolean} - it returns false to prevent page refresh
   */
  submitCreateUrlForm(url) {
    let newUrl = sanitizer(url);

    // non-valid user input case - empty string
    if (!newUrl.isValid) {
      return false;
    }

    // duplicate URLs check
    let existingUrls = loMap(this.urls, 'link');

    if (existingUrls.includes(newUrl.value)) {
      notifier('error', 'URL already exists.');
      return false;
    }

    this.createUrl(newUrl.value);

    this.toggleFormVisibility(false);
    return false;
  },
  /**
   * @description Dispatches 'createUrl' event with appropriate
   * data payload
   *
   * @param  {String} url - url to create
   */
  createUrl: function (url) {
    this.dispatch({
      type: 'createUrl',
      payload: url,
    });
  },
  /**
   * @description Dispatches 'removeUrl' event with appropriate
   * data payload
   *
   * @param  {string} url - url to delete
   */
  removeUrl: function (url) {
    this.dispatch({
      type: 'removeUrl',
      payload: url,
    });
  },
});

export default canComponent.extend({
  tag: 'related-urls',
  view: canStache(template),
  leakScope: true,
  ViewModel,
  events: {
    /**
     * @description Handler for 'inserted' event to save reference
     * to component element
     */
    inserted() {
      this.viewModel.element = this.element;
    },
  },
});
