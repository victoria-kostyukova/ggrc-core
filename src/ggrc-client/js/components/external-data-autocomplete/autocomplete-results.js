/*
 Copyright (C) 2020 Google Inc.
 Licensed under http://www.apache.org/licenses/LICENSE-2.0 <see LICENSE file>
 */

import canStache from 'can-stache';
import canDefineMap from 'can-define/map/map';
import canComponent from 'can-component';
import '../spinner-component/spinner-component';
import template from './autocomplete-results.stache';

const ViewModel = canDefineMap.extend({
  /**
   * Collection containing a list of results.
   * Each item should contain the following properties:
   * - title {String} - The property containing title of element.
   * - info {String} - The property containing additional info.
   * - value {Object} - The object that should be passed when user picks corresponding element.
   * @type {canList}
   */
  results: {
    get() {
      let values = this.values;
      let titleFieldPath = this.titleFieldPath;
      let infoFieldPath = this.infoFieldPath;

      let results = values.map((result) => {
        return {
          title: titleFieldPath ? result.get(titleFieldPath) : '',
          info: infoFieldPath ? result.get(infoFieldPath) : '',
          value: result,
        };
      });

      return results;
    },
  },
  /**
   * Contains path to field that should be displayed as title.
   * @type {String}
   */
  titleFieldPath: {
    value: null,
  },
  /**
   * Contains path to field that should be displayed as info.
   */
  infoFieldPath: {
    value: null,
  },
  /**
   * Indicates that system is loading results.
   * It used to toggle spinner.
   * @type {Boolean}
   */
  loading: {
    value: false,
  },
  /**
   * The list of results which should be displayed.
   * @type {canList}
   */
  values: {
    value: () => [],
  },
  /**
   * Handles user's click and dispathes the event.
   * @param {Object} item - The item picked by user.
   * @param {Object} event - The corresponding event.
   */
  pickItem(item, event) {
    event.stopPropagation();
    this.dispatch({
      type: 'itemPicked',
      data: item,
    });
  },
});

/**
 * The component is used to show autocomplete results and handle user's clicks.
 */
export default canComponent.extend({
  tag: 'autocomplete-results',
  view: canStache(template),
  leakScope: true,
  ViewModel,
});
