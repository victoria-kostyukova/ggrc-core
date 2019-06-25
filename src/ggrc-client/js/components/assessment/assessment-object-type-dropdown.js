/*
 Copyright (C) 2019 Google Inc.
 Licensed under http://www.apache.org/licenses/LICENSE-2.0 <see LICENSE file>
 */

import loPickBy from 'lodash/pickBy';
import canMap from 'can-map';
import canComponent from 'can-component';
import {groupTypes} from '../../plugins/utils/models-utils';

export default canComponent.extend({
  tag: 'assessment-object-type-dropdown',
  leakScope: true,
  viewModel: canMap.extend({
    define: {
      objectTypes: {
        get: function () {
          let objectTypes = groupTypes(GGRC.config.snapshotable_objects);

          // remove the groups that have ended up being empty
          objectTypes = loPickBy(objectTypes, function (objGroup) {
            return objGroup.items && objGroup.items.length > 0;
          });

          return objectTypes;
        },
      },
    },
    assessmentType: '',
    instance: {},
  }),
});
