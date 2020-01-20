/*
  Copyright (C) 2020 Google Inc.
  Licensed under http://www.apache.org/licenses/LICENSE-2.0 <see LICENSE file>
*/

import canMap from 'can-map';
import {isMyAssessments} from '../../../plugins/utils/current-page-utils';

export default canMap.extend({
  isButtonView: false,
  parentInstance: null,
  getModalConfig() {
    const parentInstance = this.attr('parentInstance');
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
