/*
    Copyright (C) 2018 Google Inc.
    Licensed under http://www.apache.org/licenses/LICENSE-2.0 <see LICENSE file>
*/

import template from './templates/people-list.mustache';

export default can.Component.extend({
  tag: 'people-list',
  template,
  viewModel: {
    peopleList: [],
    instance: null,
    hasEmptyValue: false,
    selectedValue: '',
    peopleListAttr: '',
    listName: '',
    labelName: '',
    peopleValues: [
      {value: 'Admin', title: 'Object Admins'},
      {value: 'Audit Lead', title: 'Audit Captain'},
      {value: 'Auditors', title: 'Auditors'},
      {value: 'Principal Assignees', title: 'Principal Assignees'},
      {value: 'Secondary Assignees', title: 'Secondary Assignees'},
      {value: 'Primary Contacts', title: 'Primary Contacts'},
      {value: 'Secondary Contacts', title: 'Secondary Contacts'},
      {value: 'other', title: 'Others...'},
    ],
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
     * @param {can.Map} user - user which should be removed
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

      if (peopleIds instanceof can.List) {
        this.attr('peopleList', peopleIds);
        this.attr('selectedValue', 'other');
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
      return data === 'other' ? this.attr('peopleList') : data;
    },
  },
  init() {
    this.viewModel.unpackPeopleData();
  },
});
