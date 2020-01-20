/*
    Copyright (C) 2020 Google Inc.
    Licensed under http://www.apache.org/licenses/LICENSE-2.0 <see LICENSE file>
*/

import canStache from 'can-stache';
import canList from 'can-list';
import canMap from 'can-map';
import canComponent from 'can-component';
import template from './people-list.stache';
import {validateAttr} from '../../../plugins/utils/validation-utils';

const OtherOption = 'other';

export default canComponent.extend({
  tag: 'people-list',
  view: canStache(template),
  leakScope: true,
  viewModel: canMap.extend({
    peopleList: [],
    instance: null,
    hasEmptyValue: false,
    selectedValue: '',
    peopleListAttr: '',
    listName: '',
    labelName: '',
    peopleValues: [],
    mandatory: false,

    define: {
      peopleValues: {
        value: [],
        set: function (newValue) {
          if (this.attr('selectedValue')) {
            let listName = this.attr('listName');
            let defaultValue = this.attr('instance')
              .constructor.defaults.default_people[listName];
            let currentValue = this.attr('selectedValue');
            let isPresent = newValue.attr().findIndex((el) => {
              return el.value === currentValue;
            }) !== -1;
            if (!isPresent) {
              this.attr('selectedValue', defaultValue);
              this.updatePeopleList();
            }
          }
          return newValue;
        },
      },
      hidable: {
        get() {
          if (this.attr('mandatory')) {
            return false;
          }

          const isOtherSelected = this.attr('selectedValue') === OtherOption;
          const isNotEmptyPeople = !!this.attr('peopleList.length');

          return !isOtherSelected || (isOtherSelected && isNotEmptyPeople);
        },
      },
      validationError: {
        type: String,
        get() {
          let attr = this.attr('listName');
          return validateAttr(this.instance, `default_people.${attr}`);
        },
      },
    },
    /**
   * Event handler when a person is picked in an autocomplete form field.
   * It adds the picked person ID to the people list.
   *
   * @param {jQuery.Event} ev - the event that was triggered
   */
    personAdded({selectedItem}) {
      const peopleList = this.attr('peopleList');
      const id = selectedItem.id;

      if (peopleList.indexOf(id) === -1) {
        peopleList.push(id);
        this.updatePeopleList();
      }
    },

    /**
     * Remove user from people list
     *
     * @param {canMap} user - user which should be removed
     */
    removePerson({id}) {
      const peopleList = this.attr('peopleList');

      if (peopleList.indexOf(id) !== -1) {
        peopleList.splice(peopleList.indexOf(id), 1);
        this.updatePeopleList();
      }
    },

    /**
     * User changes the dropdown value.
    */
    dropdownChanged() {
      this.updatePeopleList();
    },

    updatePeopleList() {
      const peopleListAttr = this.attr('peopleListAttr');
      this.attr(`instance.${peopleListAttr}`, this.packPeopleData());
    },

    /**
     * Unpack the dropdown data.
    */
    unpackPeopleData() {
      const peopleListAttr = this.attr('peopleListAttr');
      const peopleIds = this.attr(`instance.${peopleListAttr}`);

      if (peopleIds instanceof canList) {
        this.attr('peopleList', peopleIds);
        this.attr('selectedValue', OtherOption);
      } else {
        this.attr('peopleList', []);
        this.attr('selectedValue', peopleIds);
      }
    },
    /**
     * Pack the dropdown data.
     *
     * @return {String} - the "peopleList" or "selectedValue" data
    */
    packPeopleData() {
      const data = this.attr('selectedValue');
      return data === OtherOption ? this.attr('peopleList') : data;
    },
  }),
  init() {
    this.viewModel.unpackPeopleData();
  },
});
