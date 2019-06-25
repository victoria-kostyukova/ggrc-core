/*
    Copyright (C) 2019 Google Inc.
    Licensed under http://www.apache.org/licenses/LICENSE-2.0 <see LICENSE file>
*/

import loMap from 'lodash/map';
import loIncludes from 'lodash/includes';
import canComponent from 'can-component';
import canMap from 'can-map';

/*
  This component is for quickly updating the properties of an object through form fields.

  Field updates trigger updates to the model automatically, even on the server.
*/
export default canComponent.extend({
  tag: 'ggrc-quick-update',
  leakScope: true,
  viewModel: canMap.extend({
    define: {
      isDisabled: {
        get() {
          return this.attr('instance.responseOptionsEditable') ||
            this.attr('isSaving');
        },
      },
      checkboxOptions: {
        get() {
          let selectedOptions = this.attr('selectedOptions');

          return loMap(this.attr('options'), (option) => ({
            value: option,
            isSelected: loIncludes(selectedOptions, option),
          }));
        },
      },
    },
    instance: null,
    options: [],
    selectedOptions: [],
    checkboxChanged(option) {
      let selectedOptions = this.attr('selectedOptions');

      let index = selectedOptions.indexOf(option);

      if (index === -1) {
        selectedOptions.push(option);
      } else {
        selectedOptions.splice(index, 1);
      }

      this.save();
    },
    save() {
      this.attr('isSaving', true);
      this.attr('instance').save()
        .always(() => {
          this.attr('isSaving', false);
        });
    },
  }),
});
