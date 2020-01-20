/*
 Copyright (C) 2020 Google Inc.
 Licensed under http://www.apache.org/licenses/LICENSE-2.0 <see LICENSE file>
*/

import canComponent from 'can-component';
import canMap from 'can-map';
import {
  onAutocompleteSelect,
  onAutocompleteKeyup,
} from './utils';

const viewModel = canMap.extend({
  instance: null,
  isNewInstance: false,
  isQueryAutocompleteEnabled: false,
  pathToField: '',
  useInstanceInputHandler: false,
  initAutocomplete() {
    const $autocompleteInput = this.attr('element').find('[data-lookup]');
    const options = {
      onSelectCallback: onAutocompleteSelect(
        this.attr('instance'),
        this.attr('isNewInstance'),
        this.attr('useInstanceInputHandler')
      ),
    };

    if (this.attr('isQueryAutocompleteEnabled')) {
      $autocompleteInput.ggrc_query_autocomplete(options);
    } else {
      $autocompleteInput.ggrc_autocomplete(options);
    }
  },
});

const events = {
  inserted() {
    const viewModel = this.viewModel;
    viewModel.attr('element', this.element);

    viewModel.initAutocomplete();
  },
  // every time when instance is changed need to re-init autocomplete
  // (for example, it's changed when "Save & Add Another" button is clicked
  // on Create modals)
  '{viewModel} instance'() {
    this.viewModel.initAutocomplete();
  },
  'input[data-lookup] keyup'(el, ev) {
    onAutocompleteKeyup(this.viewModel.attr('instance'), el, ev);
  },
  /**
   * Need to track change of input's value via "input" event instead of
   * "change" event in order to setting of null will be performed before the
   * setting of selected value from autocomplete's list ("input" event
   * is called earlier then "change" event).
   */
  'input[data-lookup] input'([el]) {
    const viewModel = this.viewModel;
    const instance = viewModel.attr('instance');

    // when input's value is changed, validation should be triggered
    instance.removeAttr('_suppress_errors');

    // if input should be processed by instance's handler, we should use it
    // (for now, only cycle task has it)
    if (viewModel.attr('useInstanceInputHandler')) {
      instance.setValueFromInput(el.value);
    } else if (el.value === '') {
      // if nothing was typed in input, it's an empty string by default.
      // But for instance in order to send an empty stub (null) to the server,
      // this empty string should be converted to null.

      const [stubName] = viewModel.attr('pathToField').split('.');
      instance.attr(stubName, null);
    }
  },
};

export default canComponent.extend({
  tag: 'modal-autocomplete',
  leakScope: true,
  viewModel,
  events,
});
