/*
  Copyright (C) 2018 Google Inc.
  Licensed under http://www.apache.org/licenses/LICENSE-2.0 <see LICENSE file>
*/

import Mappings from '../mappings';

describe('Mappings', () => {
  const types = Mappings.get_canonical_mappings_for('MultitypeSearch');

  let modules = {
    core: [
      'AccessGroup',
      'Contract',
      'Control',
      'DataAsset',
      'Document',
      'Facility',
      'Issue',
      'Market',
      'Metric',
      'Objective',
      'OrgGroup',
      'Person',
      'Policy',
      'Process',
      'Program',
      'Product',
      'ProductGroup',
      'Project',
      'Regulation',
      'Requirement',
      'Risk',
      'Standard',
      'System',
      'TechnologyEnvironment',
      'Threat',
      'Vendor',
    ],
    audit: [
      'Evidence',
      'Assessment',
      'AssessmentTemplate',
      'Audit',
    ],
    workflow: [
      'TaskGroup',
      'Workflow',
    ],
  };

  const allTypes = _.concat(modules.core, modules.audit, modules.workflow);
  const common = _.difference(allTypes, ['Evidence']);

  const mappingRules = {
    AccessGroup: common,
    Assessment: modules.core.concat(modules.audit),
    AssessmentTemplate: ['Audit'],
    Audit: _.difference(modules.core, ['Person']).concat(modules.audit),
    Contract: common,
    Control: common,
    CycleTaskGroupObjectTask: _.difference(modules.core, ['Person', 'Document'])
      .concat('Audit'),
    DataAsset: common,
    Document: _.difference(modules.audit, ['Evidence']).concat(modules.core),
    Evidence: ['Assessment', 'Audit'],
    Facility: common,
    Issue: common,
    Market: common,
    Metric: common,
    Objective: common,
    OrgGroup: common,
    Person: _.difference(allTypes,
      ['AssessmentTemplate', 'TaskGroup', 'Person'])
      .concat('TaskGroupTask'),
    Policy: common,
    Process: common,
    Product: common,
    ProductGroup: common,
    Program: common,
    Project: common,
    Regulation: common,
    Requirement: common,
    Risk: common,
    Standard: common,
    System: common,
    TaskGroup: _.difference(modules.core, ['Document', 'Person']),
    TaskGroupTask: ['Workflow'],
    TechnologyEnvironment: common,
    Threat: common,
    Vendor: common,
    Workflow: ['TaskGroup', 'TaskGroupTask'],
  };

  describe('getAvailableMappings() method', () => {
    Object.keys(types).forEach(function (type) {
      it('returns available types for ' + type, function () {
        let expectedModels = mappingRules[type];
        let result = Mappings.getAvailableMappings(type);
        let resultModels = Object.keys(result);

        expect(expectedModels.sort()).toEqual(resultModels.sort());
      });
    });
  });
});
