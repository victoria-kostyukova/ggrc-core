/*
  Copyright (C) 2020 Google Inc.
  Licensed under http://www.apache.org/licenses/LICENSE-2.0 <see LICENSE file>
*/

import canDefineMap from 'can-define/map/map';
import {isMyAssessments} from '../../../plugins/utils/current-page-utils';

export default canDefineMap.extend({
  isButtonView: {
    value: false,
  },
  parentInstance: {
    value: null,
  },
  getModalConfig() {
    const parentInstance = this.parentInstance;
    return {
      isMyAssessmentsView: isMyAssessments(),
      mappedToItems: parentInstance ? [{
        id: parentInstance.attr('id'),
        type: parentInstance.attr('type'),
        title: parentInstance.attr('title'),
      }] : [],
    };
  },
});
