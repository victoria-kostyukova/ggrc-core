/*
    Copyright (C) 2020 Google Inc.
    Licensed under http://www.apache.org/licenses/LICENSE-2.0 <see LICENSE file>
*/

import canDefineMap from 'can-define/map/map';

export default canDefineMap.extend({
  emptyListMessage: {
    get() {
      return this.showEmptyMessage ? 'None' : '';
    },
  },
  showEmptyMessage: {
    value: true,
  },
  required: {
    value: '',
  },
  people: {
    value: () => [],
  },
  groupId: {
    value: '',
  },
  canUnmap: {
    value: true,
  },
  instance: {
    value: () => ({}),
  },
  isLoading: {
    value: false,
  },
  unmapablePerson: function () {
    let required;
    let peopleLength;

    if (!this.canUnmap) {
      return false;
    }

    required = this.required;
    peopleLength = this.people.length;

    if (required) {
      if (peopleLength > 1) {
        return true;
      }
      return false;
    }
    return true;
  },
  unmap: function (person) {
    this.dispatch({
      type: 'unmap',
      person: person,
      groupId: this.groupId,
    });
  },
});
