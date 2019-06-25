/*
 Copyright (C) 2019 Google Inc.
 Licensed under http://www.apache.org/licenses/LICENSE-2.0 <see LICENSE file>
 */

import loKeys from 'lodash/keys';
import loDifference from 'lodash/difference';
import canMap from 'can-map';
import * as Mappings from '../mappings';
import Permission from '../../../permission';

describe('Mappings', function () {
  let allTypes = [];
  let notMappableModels = [];
  let modules = {
    core: {
      models: [
        'AccessGroup',
        'AccountBalance',
        'Assessment',
        'AssessmentTemplate',
        'Audit',
        'Contract',
        'Control',
        'DataAsset',
        'Document',
        'Evidence',
        'Facility',
        'Issue',
        'KeyReport',
        'Market',
        'Metric',
        'Objective',
        'OrgGroup',
        'Person',
        'Policy',
        'Process',
        'Product',
        'ProductGroup',
        'Program',
        'Project',
        'Regulation',
        'Requirement',
        'Standard',
        'System',
        'Vendor',
        'Risk',
        'TechnologyEnvironment',
        'Threat',
      ],
      notMappable: ['Assessment', 'AssessmentTemplate', 'Evidence', 'Person'],
      scope: {
        notMappable: ['Audit'],
      },
    },
    workflows: {
      models: [
        'TaskGroup',
        'TaskGroupTask',
        'Workflow',
        'CycleTaskGroupObjectTask',
        'CycleTaskGroup',
      ],
      notMappable: [
        'Workflow',
        'TaskGroup',
        'TaskGroupTask',
        'CycleTaskGroupObjectTask',
        'CycleTaskGroup',
      ],
    },
  };

  Object.keys(modules).forEach(function (module) {
    allTypes = allTypes.concat(modules[module].models);
    notMappableModels = notMappableModels.concat(modules[module].notMappable);
  });

  const filtered = loDifference(allTypes, notMappableModels);

  const unmappingRules = Object.freeze({
    AccessGroup: loDifference(filtered,
      modules.core.scope.notMappable, ['AccessGroup']),
    AccountBalance: loDifference(filtered, modules.core.scope.notMappable),
    Assessment: loDifference(filtered, ['Audit', 'Person', 'Program', 'Project',
      'Workflow', 'Assessment', 'Document']),
    AssessmentTemplate: [],
    Audit: ['Issue'],
    Contract: loDifference(filtered, ['Audit', 'Contract']),
    Control: loDifference(filtered, ['Audit']),
    CycleTaskGroupObjectTask: loDifference(filtered, ['Person',
      'Workflow', 'Assessment', 'Document']),
    DataAsset: loDifference(filtered, modules.core.scope.notMappable),
    Evidence: [],
    Document: loDifference(filtered,
      ['Audit', 'Assessment', 'Document', 'Person', 'Workflow']),
    Facility: loDifference(filtered, modules.core.scope.notMappable),
    Issue: loDifference(allTypes,
      ['Person', 'AssessmentTemplate', 'Evidence']
        .concat(modules.workflows.notMappable)),
    KeyReport: loDifference(filtered, modules.core.scope.notMappable),
    Market: loDifference(filtered, modules.core.scope.notMappable),
    Metric: loDifference(filtered, modules.core.scope.notMappable),
    Objective: loDifference(filtered, ['Audit']),
    OrgGroup: loDifference(filtered, modules.core.scope.notMappable),
    Person: [],
    Policy: loDifference(filtered, ['Audit', 'Policy']),
    Process: loDifference(filtered, modules.core.scope.notMappable),
    Product: loDifference(filtered, modules.core.scope.notMappable),
    ProductGroup: loDifference(filtered, modules.core.scope.notMappable),
    Program: loDifference(allTypes,
      ['Audit', 'Assessment', 'Person']
        .concat(modules.core.notMappable, modules.workflows.notMappable)),
    Project: loDifference(filtered, modules.core.scope.notMappable),
    Regulation: loDifference(filtered, ['Audit', 'Regulation']),
    Risk: loDifference(filtered, ['Audit']),
    Requirement: loDifference(filtered, ['Audit']),
    Standard: loDifference(filtered, ['Audit', 'Standard']),
    System: loDifference(filtered, modules.core.scope.notMappable),
    TaskGroup: loDifference(filtered, ['Audit', 'Person',
      'Workflow', 'Assessment', 'Document']),
    TechnologyEnvironment: loDifference(filtered,
      modules.core.scope.notMappable),
    Threat: loDifference(filtered, ['Audit']),
    Vendor: loDifference(filtered, modules.core.scope.notMappable),
  });

  describe('allowedToUnmap() method', () => {
    beforeEach(() => {
      spyOn(Permission, 'is_allowed_for').and.returnValue(true);
    });

    it('checks that types are mappable', () => {
      let result = Mappings.allowedToUnmap('SourceType', 'TargetType');

      expect(result).toBeFalsy();
      expect(Permission.is_allowed_for).not.toHaveBeenCalled();
    });

    it('checks permissions to update source', () => {
      let result = Mappings.allowedToUnmap('DataAsset', 'AccessGroup');

      expect(result).toBeTruthy();
      expect(Permission.is_allowed_for)
        .toHaveBeenCalledWith('update', 'DataAsset');
      expect(Permission.is_allowed_for.calls.count()).toEqual(1);
    });

    it('checks permissions to update target', () => {
      let source = new canMap({type: 'DataAsset'});
      let target = new canMap({type: 'AccessGroup'});
      let result = Mappings.allowedToUnmap(source, target);

      expect(result).toBeTruthy();
      expect(Permission.is_allowed_for.calls.count()).toEqual(2);
      expect(Permission.is_allowed_for.calls.argsFor(0))
        .toEqual(['update', source]);
      expect(Permission.is_allowed_for.calls.argsFor(1))
        .toEqual(['update', target]);
    });
  });

  describe('getAllowedToUnmapModels() method', () => {
    let modelsForTests = loDifference(allTypes, [
      'TaskGroupTask',
      'CycleTaskGroup',
      'Workflow',
    ]);

    modelsForTests.forEach(function (type) {
      it('returns mappable types for ' + type, function () {
        let expectedModels = unmappingRules[type];
        let result = Mappings.getAllowedToUnmapModels(type);
        let resultModels = loKeys(result);

        expect(expectedModels.sort()).toEqual(resultModels.sort());
      });
    });
  });
});
