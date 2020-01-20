/*
 Copyright (C) 2020 Google Inc.
 Licensed under http://www.apache.org/licenses/LICENSE-2.0 <see LICENSE file>
 */

import canStache from 'can-stache';
import canMap from 'can-map';
import canComponent from 'can-component';
import RefreshQueue from '../../models/refresh-queue';
import template from './person-data.stache';
import {notifier} from '../../plugins/utils/notifiers-utils';
import Person from '../../models/business-models/person';

/**
 * Person List Item Component
 */
export default canComponent.extend({
  tag: 'person-data',
  view: canStache(template),
  leakScope: true,
  viewModel: canMap.extend({
    define: {
      personId: {
        type: 'number',
        set: function (newVal) {
          this.attr('person', {id: newVal});
          return newVal;
        },
      },
      person: {
        set: function (newVal, setVal) {
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
        get: function () {
          return this.attr('person.email') || false;
        },
      },
      personName: {
        get: function () {
          return this.attr('person.name') || this.attr('personEmail');
        },
      },
      hasNoAccess: {
        get: function () {
          return this.attr('person.system_wide_role') === 'No Access';
        },
      },
    },
  }),
});
