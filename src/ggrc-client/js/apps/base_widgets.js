/*
 Copyright (C) 2019 Google Inc.
 Licensed under http://www.apache.org/licenses/LICENSE-2.0 <see LICENSE file>
 */

import loEach from 'lodash/each';
import loDifference from 'lodash/difference';
import loAssign from 'lodash/assign';
import loMap from 'lodash/map';
import canMap from 'can-map';
import * as businessModels from '../models/business-models';
import {getRelatedWidgetNames} from '../plugins/utils/mega-object-utils';

/**
 * Tree View Widgets Configuration module
 */
let allCoreTypes = [
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
  'Risk',
  'Standard',
  'System',
  'TechnologyEnvironment',
  'Threat',
  'Vendor',
  'Workflow',
  'CycleTaskGroupObjectTask',
];
// NOTE: Widgets that have the order value are sorted by an increase values,
// the rest of widgets are sorted alphabetically
let defaultOrderTypes = {
  Standard: 10,
  Regulation: 20,
  Requirement: 30,
  Objective: 40,
  Risk: 45,
  Control: 50,
  Product: 60,
  System: 70,
  Metric: 75,
  TechnologyEnvironment: 77,
  ProductGroup: 78,
  Process: 80,
  Audit: 90,
  Person: 100,
};
// Items allowed for mapping via snapshot.
let snapshotWidgetsConfig = GGRC.config.snapshotable_objects || [];
let objectVersions = loMap(snapshotWidgetsConfig, function (obj) {
  return obj + '_version';
});

// Items allowed for relationship mapping
let excludeMappingConfig = [
  'AssessmentTemplate',
  'Evidence',
];
// Extra Tree View Widgets require to be rendered on Audit View
let auditInclusion = [
  'Assessment',
  'Person',
  'Program',
  'Issue',
  'Evidence',
];
let baseWidgetsByType;

let filteredTypes = loDifference(allCoreTypes, excludeMappingConfig);
// Audit is excluded and created a separate logic for it

let objectVersionWidgets = {};
snapshotWidgetsConfig.forEach(function (model) {
  objectVersionWidgets[model + '_version'] = [model];
});

baseWidgetsByType = {
  AccessGroup: loDifference(filteredTypes, ['AccessGroup']),
  AccountBalance: filteredTypes,
  Audit: [].concat(snapshotWidgetsConfig, excludeMappingConfig,
    auditInclusion).sort(),
  Contract: loDifference(filteredTypes, ['Contract']),
  Control: filteredTypes,
  Assessment: snapshotWidgetsConfig.concat(
    ['Audit', 'Issue', 'Evidence']).sort(),
  AssessmentTemplate: ['Audit'],
  DataAsset: filteredTypes,
  Document: loDifference(filteredTypes, ['Audit', 'Assessment', 'Document',
    'Person']),
  Evidence: ['Audit', 'Assessment'],
  Facility: filteredTypes,
  KeyReport: filteredTypes,
  Issue: objectVersions.concat(filteredTypes),
  Market: filteredTypes,
  Metric: filteredTypes,
  Objective: filteredTypes,
  OrgGroup: filteredTypes,
  Person: ['Evidence'].concat(loDifference(filteredTypes, ['Person'])),
  Policy: loDifference(filteredTypes, ['Policy']),
  Process: filteredTypes,
  Product: filteredTypes,
  ProductGroup: filteredTypes,
  Program: loDifference(filteredTypes, ['Program', 'Assessment']),
  Project: filteredTypes,
  Regulation: loDifference(filteredTypes, ['Regulation']),
  Requirement: filteredTypes,
  Standard: loDifference(filteredTypes, ['Standard']),
  System: filteredTypes,
  Risk: filteredTypes,
  TechnologyEnvironment: filteredTypes,
  Threat: filteredTypes,
  Vendor: filteredTypes,
};

loEach(baseWidgetsByType, (val, widget) => {
  if (businessModels[widget] && businessModels[widget].isMegaObject) {
    baseWidgetsByType[widget] = baseWidgetsByType[widget]
      .concat(getRelatedWidgetNames(widget));
  }
});

baseWidgetsByType = loAssign(baseWidgetsByType, objectVersionWidgets);

export default new canMap({
  base_widgets_by_type: baseWidgetsByType,
  defaultOrderTypes,
  basic_model_list: [],
  sub_tree_for: {},
});

