/*
 Copyright (C) 2019 Google Inc.
 Licensed under http://www.apache.org/licenses/LICENSE-2.0 <see LICENSE file>
 */

import loIsEmpty from 'lodash/isEmpty';
import loIsObject from 'lodash/isObject';
import canMap from 'can-map';
import canComponent from 'can-component';
/**
 * The component is used to integrate separate autocomplete component
 * with some old pards of code which are working with autocomplete plugin
 * and controllers.
 *
 * Generally it emulates autocomplete_select handlers from several controllers.
 */
export default canComponent.extend({
  tag: 'inline-autocomplete-wrapper',
  leakScope: true,
  viewModel: canMap.extend({
    /**
     * Contains a model.
     * @type {Can.Map}
     */
    instance: null,
    /**
     * Contains path to set object from autocomplete to instance.
     * @type {String}
     */
    path: '',
    /**
     * Contains a propery name that should be displayed in input after user
     * selects an item in autocomplete.
     * @type {String}
     */
    displayProp: '',
    /**
     * Contains value that should be displayed in autocomplete input.
     */
    textValue: '',
    /**
     * Applies user's input.
     * @param {Can.Map|String} item - The item picked in autocomplete or string pasted by user.
     */
    setItem(item) {
      let instance = this.attr('instance');
      let path = this.attr('path');

      if (loIsEmpty(item)) {
        instance.attr(path, null);
      } else if (loIsObject(item)) {
        instance.attr(path, item);
        this.updateTextValue(item);
      }

      this.updateTransient(item);
    },
    /**
     * Updates Custom Attribute value in instance object.
     * @param {Can.Map} item - The item picked in autocomplete.
     * @param {*} cadId - Custom Attribute defenition Id.
     */
    setCustomAttribute(item, cadId) {
      let instance = this.attr('instance');
      instance.customAttr(cadId, item && item.id);
      this.updateTextValue(item);
    },
    /**
     * Updates text displayed in autocomplete input.
     * @param {Can.Map|String} item - The item picked in autocomplete or any string.
     */
    updateTextValue(item) {
      let text = loIsObject(item) ? item.attr(this.attr('displayProp')) : item;
      this.attr('textValue', text);
    },
    /**
     * Updates '_transient' property in instance.
     * It used for change detection.
     * @param {*} value - the new property value.
     */
    updateTransient(value) {
      let instance = this.attr('instance');
      let path = this.attr('path');
      if (!instance.attr('_transient')) {
        instance.attr('_transient', canMap());
      }
      instance.attr('_transient.' + path, value);
    },
  }),
});
