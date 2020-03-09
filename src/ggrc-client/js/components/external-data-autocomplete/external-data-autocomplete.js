/*
 Copyright (C) 2020 Google Inc.
 Licensed under http://www.apache.org/licenses/LICENSE-2.0 <see LICENSE file>
 */

import loDebounce from 'lodash/debounce';
import canStache from 'can-stache';
import canDefineMap from 'can-define/map/map';
import canComponent from 'can-component';
import './external-data-provider';
import './autocomplete-results';
import '../spinner-component/spinner-component';
import * as businessModels from '../../models/business-models';
import {reify, isReifiable} from '../../plugins/utils/reify-utils';
import template from './external-data-autocomplete.stache';

const ViewModel = canDefineMap.extend({
  /**
   * The flag indicating that results will be rendered.
   * @type {Boolean}
   */
  renderResults: {
    value: false,
    get() {
      let showResults = this.showResults;
      let minLength = this.minLength;
      let searchCriteria = this.searchCriteria || '';

      let result = showResults && searchCriteria.length >= minLength;

      return result;
    },
  },
  /**
  * The type of model.
  * @type {String}
  */
  type: {
    value: null,
  },
  /**
  * The search criteria read from input.
  * @type {String}
  */
  searchCriteria: {
    value: '',
  },
  /**
  * The minimal length of search criteria that run search.
  * @type {Number}
  */
  minLength: {
    value: 0,
  },
  /**
  * The placeholder that should be displayed in input.
  * @type {String}
  */
  placeholder: {
    value: '',
  },
  /**
  * Additional CSS classes which should be applied to input element.
  * @type {String}
  */
  extraCssClass: {
    value: '',
  },
  /**
  * The flag indicating that results should be shown.
  * @type {Boolean}
  */
  showResults: {
    value: false,
  },
  /**
  * The flag indicating that search criteria should be cleaned after user picks an item.
  * @type {Boolean}
  */
  autoClean: {
    value: true,
  },
  /**
  * The flag indicating that system is creating corresponding model for external item.
  */
  saving: {
    value: false,
  },
  /**
  * Opens results list section.
  */
  openResults() {
    this.showResults = true;
  },
  /**
  * Closes results list section.
  */
  closeResults() {
    this.showResults = false;
  },
  /**
  * Updates search criteria and dispatches corresponding event.
  * @param {Object} - input html element.
  */
  setSearchCriteria: loDebounce(function (element) {
    let newCriteria = element.val();
    this.searchCriteria = newCriteria;
    this.dispatch({
      type: 'criteriaChanged',
      value: newCriteria,
    });
  }, 500),
  /**
  * Creates model in system and dispatches corresponding event.
  * @param {Object} item - an item picked by user.
  * @return {Object} - Deferred chain.
  */
  onItemPicked(item) {
    this.saving = true;
    return this.createOrGet(item).then((model) => {
      if (this.autoClean) {
        this.searchCriteria = '';
      }

      this.dispatch({
        type: 'itemSelected',
        selectedItem: model,
      });
    }).always(() => {
      this.saving = false;
    });
  },
  /**
  * Creates new model or returns existing from cache.
  * @param {Object} item - model data.
  * @return {Promise} - promise indicates state of operation.
  */
  createOrGet(item) {
    const type = this.type;
    const ModelClass = businessModels[type];

    item.context = null;
    item.external = true;

    return ModelClass.create(item).then((response) => {
      let data = response[0];
      let model = data[1][ModelClass.root_object];

      model = isReifiable(model) ? reify(model) : model;

      let result = ModelClass.cache[model.id] || new ModelClass(model);

      return result;
    });
  },
});

/**
 * The autocomplete component used to load data from external sources.
 * When user picks an external item, system will create corresponding item in database.
 */
export default canComponent.extend({
  tag: 'external-data-autocomplete',
  view: canStache(template),
  leakScope: true,
  ViewModel,
});
