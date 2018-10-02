/*
  Copyright (C) 2018 Google Inc.
  Licensed under http://www.apache.org/licenses/LICENSE-2.0 <see LICENSE file>
*/

import {
  getChildTreeDisplayList,
  setChildTreeDisplayList,
} from '../../plugins/utils/display-prefs-utils';
import * as businessModels from '../../models/business-models/index';

const childModelsMap = can.Map.extend({
  container: {},
  getModels: function (parentType) {
    if (!this.attr('container.' + parentType)) {
      let savedModels = getChildTreeDisplayList(parentType);

      if (savedModels) {
        // filter types that do not exist
        savedModels = savedModels.filter((type) => businessModels[type]);
      }

      this.attr('container').attr(parentType, savedModels);
    }
    return this.attr('container.' + parentType);
  },
  setModels: function (parentType, newModels) {
    this.attr('container').attr(parentType, newModels);

    setChildTreeDisplayList(parentType, newModels);
  },
});

export default new childModelsMap();
