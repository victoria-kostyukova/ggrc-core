/*
    Copyright (C) 2018 Google Inc.
    Licensed under http://www.apache.org/licenses/LICENSE-2.0 <see LICENSE file>
*/

import template from './multiselect-dropdown-wrapper.mustache';

export default can.Component.extend({
  tag: 'multiselect-dropdown-wrapper',
  template: template,
  viewModel: {
    placeholder: '',
    selected: [],
    selectedInternal: [],
    preparedOptions: [],
    define: {
      /*
        Multiselect-dropdown wrapper when data should be fetched first
        {modelConstructor}: Model definition to fetch
        {(selected)}: Two-way binding parent`s target attribute
      */
      modelConstructor: {
        set(newModelConstructor) {
          if (newModelConstructor) {
            newModelConstructor.findAll()
              .done(this.prepareOptions.bind(this));

            return newModelConstructor;
          }
        },
      },
    },
    prepareOptions: function (items) {
      let selected = this.attr('selected');
      let preparedOptions = [];
      let selectedInternal = [];

      items.forEach((item) => {
        let isSelected = _.find(selected, (selectedItem) => {
          return selectedItem.id === item.id;
        });

        let option = {
          value: item.name,
          id: item.id,
          checked: isSelected ? true : false,
        };

        preparedOptions.push(option);

        if (isSelected) {
          selectedInternal.push(option);
        }
      });

      // preparedOptions sent down to multiselect-dropdown
      this.attr('preparedOptions', preparedOptions);

      // selectedInternal is input models
      // converted into multiselect-dropdown format
      this.attr('selectedInternal', selectedInternal);
    },
    selectedChanged(event) {
      let newSelected = event.selected;
      let selected = [];
      let model = this.attr('modelConstructor');

      // add all new items from Cache
      newSelected.forEach((item) => {
        selected.push(model.findInCacheById(item.id));
      });

      this.attr('selected', selected);
    },
  },
});
