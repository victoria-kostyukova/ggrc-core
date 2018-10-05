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
      'Facility',
      'Issue',
      'Market',
      'Metric',
      'Objective',
      'OrgGroup',
      'Policy',
      'Process',
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

  const coreObjectsRules = _.concat(modules.core, modules.workflow,
    ['Assessment', 'Audit', 'Document', 'Person', 'Program']);

  const mappingRules = {
    AccessGroup: coreObjectsRules,
    Assessment: [...modules.core, 'Evidence', 'Assessment',
      'Audit', 'Person', 'Program'],
    AssessmentTemplate: ['Audit'],
    Audit: [...modules.audit, ...modules.core, 'Program'],
    Contract: coreObjectsRules,
    Control: coreObjectsRules,
    CycleTaskGroupObjectTask: [...modules.core, 'Audit', 'Program'],
    DataAsset: coreObjectsRules,
    Document: _.difference(coreObjectsRules, modules.workflow),
    Evidence: ['Assessment', 'Audit'],
    Facility: coreObjectsRules,
    Issue: coreObjectsRules,
    Market: coreObjectsRules,
    Metric: coreObjectsRules,
    Objective: coreObjectsRules,
    OrgGroup: coreObjectsRules,
    Person: [...modules.core, 'Assessment', 'Audit', 'Evidence', 'Document',
      'Program', 'TaskGroupTask', 'Workflow'],
    Policy: coreObjectsRules,
    Process: coreObjectsRules,
    Product: coreObjectsRules,
    ProductGroup: coreObjectsRules,
    Program: coreObjectsRules,
    Project: coreObjectsRules,
    Regulation: coreObjectsRules,
    Requirement: coreObjectsRules,
    Risk: coreObjectsRules,
    Standard: coreObjectsRules,
    System: coreObjectsRules,
    TaskGroup: [...modules.core, 'Program'],
    TaskGroupTask: ['Workflow'],
    TechnologyEnvironment: coreObjectsRules,
    Threat: coreObjectsRules,
    Vendor: coreObjectsRules,
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
