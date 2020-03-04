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
    initialEmail: null,
    _initialEmail: null,
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
      if (!value) {
        this.attr('showResults', false);
        return;
      }

      const type = this.attr('modelName');
      const externalServiceUrl = GGRC.config.external_services[type];
      const initialEmail = this.attr('_initialEmail');

      if (externalServiceUrl) {
        ggrcGet(
          externalServiceUrl,
          {
            prefix: value,
            limit: 10,
            initialEmail,
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
  events: {
    inserted() {
      const initialEmail = this.viewModel.attr('initialEmail');
      this.viewModel.attr('_initialEmail', initialEmail);
    },
  },
});
