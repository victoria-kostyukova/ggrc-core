/*
    Copyright (C) 2020 Google Inc.
    Licensed under http://www.apache.org/licenses/LICENSE-2.0 <see LICENSE file>
*/

import canComponent from 'can-component';
import baseAutocompleteWrapper from '../../custom-autocomplete/autocomplete-wrapper';
import {ggrcGet} from '../../../plugins/ajax-extensions';

export default canComponent.extend({
  tag: 'people-autocomplete-wrapper',
  leakScope: true,
  viewModel: baseAutocompleteWrapper.extend({
    currentValue: null,
    modelName: 'Person',
    queryField: 'email',
    result: [],
    objectsToExclude: [],
    showResults: false,
    showNewValue: false,
    actionKey: null,
    define: {
      currentValue: {
        set(newValue, setValue) {
          setValue(newValue);

          if (newValue !== null) {
            this.getResult(newValue);
          } else {
            this.attr('showResults', false);
          }
        },
      },
    },
    getResult(value) {
      const type = this.attr('modelName');
      const externalServiceUrl = GGRC.config.external_services[type];

      if (externalServiceUrl) {
        ggrcGet(
          externalServiceUrl,
          {
            prefix: value,
            limit: 10,
          },
        ).then(this.processItems.bind(this, value));
      } else {
        return this.requestItems(value)
          .then((data) => data[type].values)
          .then(this.processItems.bind(this, value));
      }
    },
    processItems(value, data) {
      if (value === this.attr('currentValue')) {
        if (data.length) {
          this.attr('result', data);
          this.attr('showResults', true);
        } else {
          this.attr('showResults', false);
        }
      }
    },
  }),
});
