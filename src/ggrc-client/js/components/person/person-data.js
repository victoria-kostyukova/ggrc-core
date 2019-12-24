/*
 Copyright (C) 2020 Google Inc.
 Licensed under http://www.apache.org/licenses/LICENSE-2.0 <see LICENSE file>
 */

import canStache from 'can-stache';
import canDefineMap from 'can-define/map/map';
import canComponent from 'can-component';
import RefreshQueue from '../../models/refresh-queue';
import template from './person-data.stache';
import {notifier} from '../../plugins/utils/notifiers-utils';
import Person from '../../models/business-models/person';

const ViewModel = canDefineMap.extend({
  personId: {
    type: 'number',
    set(newVal) {
      this.person = {id: newVal};
      return newVal;
    },
  },
  person: {
    set(newVal, setVal) {
      let actualPerson;
      if (!newVal || !newVal.id) {
        setVal({});
        return;
      }

      actualPerson = Person.findInCacheById(newVal.id) || {};
      if (actualPerson.email) {
        setVal(actualPerson);
      } else if (newVal.email) {
        setVal(newVal);
      } else {
        setVal({});
        actualPerson = new Person({id: newVal.id});
        new RefreshQueue()
          .enqueue(actualPerson)
          .trigger()
          .done(function (person) {
            person = Array.isArray(person) ? person[0] : person;
            setVal(person);
          })
          .fail(function () {
            setVal({});
            notifier('error',
              'Failed to fetch data for person ' + newVal.id + '.');
          });
      }
    },
  },
  personEmail: {
    get() {
      return (this.person && this.person.email) || false;
    },
  },
  personName: {
    get() {
      return (this.person && this.person.name) || this.personEmail;
    },
  },
  hasNoAccess: {
    get() {
      return this.person.system_wide_role === 'No Access';
    },
  },
});

/**
 * Person List Item Component
 */
export default canComponent.extend({
  tag: 'person-data',
  view: canStache(template),
  leakScope: true,
  ViewModel,
});
