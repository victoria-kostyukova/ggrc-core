/*
    Copyright (C) 2019 Google Inc.
    Licensed under http://www.apache.org/licenses/LICENSE-2.0 <see LICENSE file>
*/

import {getRoleableModels} from './utils/models-utils';

/**
 * Business objects collection without Workflow objects and specific Audit
 * objects (AssessmentTemplate and Evidence)
 */
export const businessObjects = [
  'Assessment', 'AccessGroup', 'Audit', 'Contract', 'Control', 'DataAsset',
  'Document', 'Facility', 'Issue', 'KeyReport', 'Market', 'Metric', 'Objective',
  'OrgGroup', 'Policy', 'Process', 'Product', 'ProductGroup', 'Program',
  'Project', 'Regulation', 'Requirement', 'Risk', 'Standard', 'System',
  'TechnologyEnvironment', 'Threat', 'Vendor',
];

/**
 * Business objects without Assessment, Audit, Document and Program
 */
export const coreObjects = _.difference(businessObjects,
  ['Assessment', 'Audit', 'Document', 'Program']);

/**
 * Scoping objects
 */
export const scopingObjects = [
  'AccessGroup', 'DataAsset', 'Facility', 'KeyReport', 'Market', 'Metric',
  'OrgGroup', 'Process', 'Product', 'ProductGroup', 'Project', 'System',
  'TechnologyEnvironment', 'Vendor',
];

/**
 * GGRCQ Directives
 */
export const ggrcqDirectiveObjects = [
  'Regulation', 'Standard',
];

/**
 * Snapshotable objects
 */
export const snapshotableObjects = GGRC.config.snapshotable_objects;

/**
 * Objects with custom roles
 */
export const roleableObjects = getRoleableModels()
  .map((model) => model.model_singular);
