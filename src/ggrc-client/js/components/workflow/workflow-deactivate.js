
/*
  Copyright (C) 2020 Google Inc.
  Licensed under http://www.apache.org/licenses/LICENSE-2.0 <see LICENSE file>
*/

import canComponent from 'can-component';
import {getPageInstance} from '../../plugins/utils/current-page-utils';

export default canComponent.extend({
  tag: 'workflow-deactivate',
  events: {
    click: function () {
      let workflow = getPageInstance();
      workflow.refresh().then(function (workflow) {
        workflow.attr('recurrences', false).save();
      });
    },
  },
  leakScope: true,
});
