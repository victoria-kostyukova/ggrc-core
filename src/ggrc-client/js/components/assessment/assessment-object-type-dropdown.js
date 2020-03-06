/*
 Copyright (C) 2020 Google Inc.
 Licensed under http://www.apache.org/licenses/LICENSE-2.0 <see LICENSE file>
 */

import loPickBy from 'lodash/pickBy';
import canDefineMap from 'can-define/map/map';
import canComponent from 'can-component';
import {groupTypes} from '../../plugins/utils/models-utils';

const ViewModel = canDefineMap.extend({
  objectTypes: {
    get() {
      let objectTypes = groupTypes(GGRC.config.snapshotable_objects);

      // remove the groups that have ended up being empty
      objectTypes = loPickBy(objectTypes, function (objGroup) {
        return objGroup.items && objGroup.items.length > 0;
      });

      return objectTypes;
    },
  },
  assessmentType: {
    value: '',
  },
  instance: {
    value: () => ({}),
  },
});

export default canComponent.extend({
  tag: 'assessment-object-type-dropdown',
  leakScope: true,
  ViewModel,
});
