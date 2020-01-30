/*
  Copyright (C) 2020 Google Inc.
  Licensed under http://www.apache.org/licenses/LICENSE-2.0 <see LICENSE file>
*/

import '../assessment-template-attributes/assessment-template-attributes';
import '../assessment-templates/assessment-templates-dropdown/assessment-templates-dropdown';
import '../spinner-component/spinner-component';
import loIsEqual from 'lodash/isEqual';
import loGroupBy from 'lodash/groupBy';
import canComponent from 'can-component';
import MappingOperationsVM from '../view-models/mapping-operations-vm';
import {
  toObject,
  extendSnapshot,
} from '../../plugins/utils/snapshot-utils';
import {loadObjectsByStubs} from '../../plugins/utils/query-api-utils';
import {notifier} from '../../plugins/utils/notifiers-utils';
import {getAjaxErrorInfo} from '../../plugins/utils/errors-utils';
import {getRoleById} from '../../plugins/utils/acl-utils';

const NOT_TRACKED_INST_PROPS = [
  'labels',
  'test_plan_procedure',
  'send_by_default',
  'recipients',
  'issue_tracker',
  'errors',
];
const TRACKED_ROLES = ['Assignees', 'Creators', 'Verifiers'];

export default canComponent.extend({
  tag: 'assessment-modal',
  leakScope: true,
  viewModel: MappingOperationsVM.extend({
    define: {
      /**
       * Indicates the situation, when the user chooses some assessment
       * template and in the same time it did not have some another preselected
       * template before choosing.
       */
      isInitialTemplateLoading: {
        get() {
          return (
            true &&
            this.attr('isAttributesLoading') &&
            !this.attr('assessmentTemplate')
          );
        },
      },
    },
    instance: null,
    backupInstance: null,
    isNewInstance: false,
    mappingsList: [],
    assessmentTemplate: null,
    isAttributesLoading: false,
    fields: ['id', 'type', 'child_type', 'revision', 'title', 'name', 'email'],
    isInserted: false,
    showStatusChangeMessage: false,
    loadData() {
      return this.attr('instance').getRelatedObjects()
        .then((data) => {
          let snapshots = data.Snapshot.map((snapshot) => {
            let snapshotObject = toObject(snapshot);
            return extendSnapshot(snapshot, snapshotObject);
          });

          this.attr('mappingsList').replace(snapshots);
        });
    },
    async setAssessmentTemplate(templateId) {
      const instance = this.attr('instance');
      const templateStub = {
        id: templateId,
        type: 'AssessmentTemplate',
      };

      this.attr('isAttributesLoading', true);
      try {
        const [loadedTemplate] = await loadObjectsByStubs(
          [templateStub],
          [
            'custom_attribute_definitions',
            'sox_302_enabled',
          ]
        );

        instance.attr('template', templateStub);
        this.attr('assessmentTemplate', loadedTemplate);
      } catch (xhr) {
        notifier('error', getAjaxErrorInfo(xhr).details);
      } finally {
        this.attr('isAttributesLoading', false);
      }
    },
    onAssessmentTemplateChanged({template}) {
      if (!template) {
        this.attr('assessmentTemplate', null);
        this.attr('instance.template', null);
      } else {
        this.setAssessmentTemplate(template.id);
      }
    },
    isTrackedPropertiesChanged() {
      const currentInstance = {...this.attr('instance').attr()};
      const backupInstance = {...this.attr('backupInstance').attr()};

      /**
       * Exclude some properties from the comparison
       */
      NOT_TRACKED_INST_PROPS.forEach((attr) => {
        currentInstance[attr] = undefined;
        backupInstance[attr] = undefined;
      });

      currentInstance.access_control_list =
        this.buildAclRoles(currentInstance.access_control_list);
      backupInstance.access_control_list =
        this.buildAclRoles(backupInstance.access_control_list);

      return !loIsEqual(currentInstance, backupInstance);
    },
    buildAclRoles(roles) {
      const filteredRoles = roles.filter((role) => {
        const roleTitle = getRoleById(role.ac_role_id).name;
        return TRACKED_ROLES.includes(roleTitle);
      });

      const groupedRoles = loGroupBy(filteredRoles, 'ac_role_id');

      const aclRoles = Object.entries(groupedRoles).map(([roleId, people]) => ({
        roleId,
        peopleIds: people.map((item) => item.person.id).sort((a, b) => a - b),
      }));

      return aclRoles;
    },
  }),
  events: {
    inserted() {
      const vm = this.viewModel;
      if (!vm.attr('isNewInstance')) {
        vm.loadData();
      }

      vm.attr('backupInstance', vm.attr('instance').attr());
      vm.attr('isInserted', true);
    },
    '{viewModel.instance} change'() {
      const vm = this.viewModel;

      if (vm.attr('isNewInstance') || !vm.attr('isInserted')) {
        return;
      }

      const instance = vm.attr('instance');
      const doneStatuses = instance.constructor.doneStatuses;

      if (!doneStatuses.includes(instance.attr('status'))) {
        return;
      }

      vm.attr('showStatusChangeMessage', vm.isTrackedPropertiesChanged());
    },
  },
});
