/*
 Copyright (C) 2020 Google Inc.
 Licensed under http://www.apache.org/licenses/LICENSE-2.0 <see LICENSE file>
 */

import canDefineMap from 'can-define/map/map';
import canComponent from 'can-component';
import {notifier} from '../../plugins/utils/notifiers-utils';
import {ggrcGet} from '../../plugins/ajax-extensions';

const ViewModel = canDefineMap.extend({
  /**
   * The search that should be used in request.
   * @type {String}
   */
  searchCriteria: {
    value: '',
  },
  /**
   * The type of model.
   * @type {String}
   */
  type: {
    value: null,
  },
  /**
   * The list of values returned from external source.
   * @type {Array}
   */
  values: {
    value: () => [],
  },
  /**
   * Indicates that system is loading results.
   * @type {Boolean}
   */
  loading: {
    value: false,
  },
  /**
   * The current request number.
   * It is used to process only latest request result.
   * @type {Number}
   */
  currentRequest: {
    value: 0,
  },
  request: {
    value: null,
  },
  /**
   * Loads data from external source.
   */
  loadData() {
    let searchCriteria = this.searchCriteria;
    let type = this.type;
    let requestNumber = this.currentRequest + 1;

    // We have to process only latest request because only latest search criteria is valid.
    // Otherwise intermediate data will be displayed.
    let executeForLastRequest = (callback) => {
      return (response) => {
        if (this.currentRequest === requestNumber) {
          callback(response);
        }
      };
    };

    this.loading = true;

    this.request = ggrcGet(
      GGRC.config.external_services[type],
      {
        prefix: searchCriteria,
      }
    ).done(executeForLastRequest((response) => {
      this.values = response;
    })).fail(executeForLastRequest(() => {
      notifier('error', `Unable to load ${type}s`);
    })).always(executeForLastRequest(() => {
      this.loading = false;
    }));

    this.currentRequest = requestNumber;
  },
});

/**
 * The component is used to load data for autocomplete component from external sources.
 */
export default canComponent.extend({
  tag: 'external-data-provider',
  leakScope: true,
  ViewModel,
  /**
   * Launch search when component is initialized.
   */
  init() {
    this.viewModel.loadData();
  },
  events: {
    /**
     * Launch search when search criteria was changed.
     */
    '{viewModel} searchCriteria'() {
      this.viewModel.loadData();
    },
  },
});
