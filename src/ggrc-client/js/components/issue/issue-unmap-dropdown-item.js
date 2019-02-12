/*
    Copyright (C) 2019 Google Inc.
    Licensed under http://www.apache.org/licenses/LICENSE-2.0 <see LICENSE file>
*/

import './issue-unmap';
import '../questionnaire-mapping-link/questionnaire-mapping-link';
import template from './issue-unmap-dropdown-item.stache';
import Mappings from '../../models/mappers/mappings';
import {
  isAuditScopeModel,
  isSnapshotParent,
} from '../../plugins/utils/snapshot-utils';
import {
  isAllObjects,
  isMyWork,
} from '../../plugins/utils/current-page-utils';

export default can.Component.extend({
  tag: 'issue-unmap-dropdown-item',
  template,
  leakScope: true,
  viewModel: {
    define: {
      issueUnmap: {
        get: function () {
          return this.attr('page_instance.type') === 'Issue' ||
            this.attr('instance.type') === 'Issue';
        },
      },
      denyIssueUnmap: {
        get: function () {
          return (this.attr('page_instance.type') === 'Audit'
              && !this.attr('instance.allow_unmap_from_audit'))
            || (this.attr('instance.type') === 'Audit'
              && !this.attr('page_instance.allow_unmap_from_audit'));
        },
      },
      isAllowedToUnmap: {
        get() {
          let pageInstance = this.attr('page_instance');
          let instance = this.attr('instance');
          let options = this.attr('options');

          return Mappings.allowedToMap(pageInstance, instance)
            && !isAuditScopeModel(instance.type)
            && !isSnapshotParent(instance.type)
            && !(isAllObjects() || isMyWork())
            && options.attr('isDirectlyRelated');
        },
      },
      isMappableExternally: {
        get() {
          let source = this.attr('page_instance.type');
          let destination = this.attr('instance.type');

          return Mappings.shouldBeMappedExternally(source, destination);
        },
      },
    },
    instance: {},
    page_instance: {},
    options: {},
  },
});
