/*
 Copyright (C) 2018 Google Inc.
 Licensed under http://www.apache.org/licenses/LICENSE-2.0 <see LICENSE file>
 */

import Mappings from '../../models/mappers/mappings';

export default can.Component.extend({
  tag: 'assessment-object-type-dropdown',
  viewModel: {
    define: {
      objectTypes: {
        get: function () {
          let objectTypes = Mappings
            .groupTypes(GGRC.config.snapshotable_objects);

          // remove the groups that have ended up being empty
          objectTypes = _.pickBy(objectTypes, function (objGroup) {
            return objGroup.items && objGroup.items.length > 0;
          });

          return objectTypes;
        },
      },
    },
    assessmentType: '',
    instance: {},
  },
});
