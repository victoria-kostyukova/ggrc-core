/*
    Copyright (C) 2020 Google Inc.
    Licensed under http://www.apache.org/licenses/LICENSE-2.0 <see LICENSE file>
*/

import canStache from 'can-stache';
import canMap from 'can-map';
import canComponent from 'can-component';
import {isMyAssessments} from '../../../plugins/utils/current-page-utils';
import {getAsmtCountForVerify} from '../../../plugins/utils/bulk-update-service';
import template from './assessment-tree-actions.stache';

export default canComponent.extend({
  tag: 'assessment-tree-actions',
  view: canStache(template),
  viewModel: canMap.extend({
    define: {
      showBulkSection: {
        get() {
          return isMyAssessments();
        },
      },
      showBulkComplete: {
        value: false,
      },
      showBulkVerify: {
        value: false,
        get(lastSetValue, setAttrValue) {
          setAttrValue(lastSetValue); // set default value before request

          getAsmtCountForVerify()
            .then((count) => {
              setAttrValue(count > 0);
            });
        },
      },
    },
    instance: null,
    parentInstance: null,
    model: null,
  }),
});
