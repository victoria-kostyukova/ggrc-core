/*
  Copyright (C) 2018 Google Inc.
  Licensed under http://www.apache.org/licenses/LICENSE-2.0 <see LICENSE file>
*/

import Component from '../advanced-search-mapping-criteria';
import {getComponentVM} from '../../../../js_specs/spec_helpers';
import Mappings from '../../../models/mappers/mappings';

describe('advanced-search-mapping-criteria component', () => {
  let viewModel;

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
    AssessmentTemplate: _.difference(modules.core.concat(modules.audit),
      ['Evidence', 'Person']),
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
    Person: _.difference(modules.core, ['Person']).concat(['Assessment']),
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
    TaskGroupTask: [],
    TechnologyEnvironment: common,
    Threat: common,
    Vendor: common,
    Workflow: ['TaskGroup'],
  };

  beforeEach(() => {
    viewModel = getComponentVM(Component);
  });

  describe('mappingTypes() method', () => {
    Object.keys(types).forEach(function (type) {
      it('returns related types for ' + type, function () {
        viewModel.attr('modelName', type);
        let expectedModels = mappingRules[type];
        let result = viewModel.mappingTypes();
        let resultModels = result.length ? 
          result.map((model) => model.model_singular) : [];

        expect(expectedModels.sort()).toEqual(resultModels.sort());
      });
    });
  });
});
