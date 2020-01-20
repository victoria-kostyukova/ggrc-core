/*
 Copyright (C) 2020 Google Inc., authors, and contributors
 Licensed under http://www.apache.org/licenses/LICENSE-2.0 <see LICENSE file>
 */

import canStache from 'can-stache';
import canMap from 'can-map';
import canComponent from 'can-component';
import '../../diff/instance-fields-diff';
import '../../diff/instance-acl-diff';
import '../../diff/instance-gca-diff';
import '../../diff/instance-mapping-fields-diff';
import '../../diff/instance-list-fields-diff';
import '../../revision-history/restored-revision-comparer-config';
import {getPersonInfo} from '../../../plugins/utils/user-utils';
import template from './templates/related-revisions-item.stache';

export default canComponent.extend({
  tag: 'related-revisions-item',
  view: canStache(template),
  leakScope: true,
  viewModel: canMap.extend({
    define: {
      revision: {
        set(newValue) {
          if (!newValue) {
            return this.attr('revision');
          }

          getPersonInfo(newValue.modified_by).then((person) => {
            this.attr('modifiedBy', person);
          });

          return newValue;
        },
      },
      isCreated: {
        get() {
          return this.attr('revision.action') === 'created';
        },
      },
    },
    instance: {},
    modifiedBy: {},
    lastRevision: {},
  }),
});
