/*
    Copyright (C) 2018 Google Inc.
    Licensed under http://www.apache.org/licenses/LICENSE-2.0 <see LICENSE file>
*/

import Mixin from './mixin';
import {
  buildParam,
  batchRequests,
} from '../../plugins/utils/query-api-utils';

export default Mixin({}, {
  updateScopeObject: function () {
    let objType = 'Audit';
    let queryType = 'values';
    let queryFields = ['id', 'type', 'title', 'context', 'issue_tracker'];
    let query =
      buildParam(objType, {
        current: 1,
        pageSize: 1,
      }, {
        type: this.attr('type'),
        operation: 'relevant',
        id: this.attr('id'),
      }, queryFields);
    return batchRequests(query)
      .done(function (valueArr) {
        let audit = valueArr[objType][queryType][0];

        this.attr('audit', audit);
      }.bind(this));
  },
});
