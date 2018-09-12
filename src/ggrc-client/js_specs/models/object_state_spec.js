/*
    Copyright (C) 2018 Google Inc.
    Licensed under http://www.apache.org/licenses/LICENSE-2.0 <see LICENSE file>
*/

import Audit from '../../js/models/business-models/audit';
import Assessment from '../../js/models/business-models/assessment';
import Issue from '../../js/models/business-models/issue';
import * as businessModels from '../../js/models/business-models';

describe('Model states test', function () {
  let basicStateObjects = ['AccessGroup', 'Clause', 'Contract',
    'Control', 'DataAsset', 'Facility', 'Market',
    'Objective', 'OrgGroup', 'Policy', 'Process', 'Product', 'Program',
    'Project', 'Regulation', 'Risk', 'Requirement', 'Standard', 'System',
    'Threat', 'Vendor'];

  basicStateObjects.forEach(function (object) {
    let expectedStatuses = ['Draft', 'Deprecated', 'Active'];
    it('checks if ' + object + ' has expected statuses', function () {
      expect(businessModels[object].statuses).toEqual(
        expectedStatuses, 'for object ' + object);
    });
  });
  it('checks if Audit has expected statuses', function () {
    let expectedStatuses = ['Planned', 'In Progress', 'Manager Review',
      'Ready for External Review', 'Completed', 'Deprecated'];
    expect(Audit.statuses).toEqual(expectedStatuses);
  });
  it('checks if Assessment has correct statuses', function () {
    let expectedStatuses = ['Not Started', 'In Progress', 'In Review',
      'Verified', 'Completed', 'Deprecated', 'Rework Needed'];
    expect(Assessment.statuses).toEqual(expectedStatuses);
  });
  it('checks if Issue has correct statuses', function () {
    let expectedStatuses = ['Draft', 'Deprecated', 'Active', 'Fixed',
      'Fixed and Verified'];
    expect(Issue.statuses).toEqual(expectedStatuses);
  });
});

describe('Model review state test', function () {
  const reviewObjects = ['Clause', 'Contract', 'Control', 'Objective',
    'Policy', 'Program', 'Regulation', 'Risk', 'Requirement', 'Standard',
    'Threat'];
  const objectsWithoutReview = ['AccessGroup', 'Assessment',
    'AssessmentTemplate', 'Audit', 'DataAsset', 'Facility', 'Issue', 'Market',
    'Metric', 'OrgGroup', 'Process', 'Product', 'ProductGroup', 'Project',
    'System', 'TechnologyEnvironment', 'Vendor'];

  reviewObjects.forEach(function (object) {
    it('checks if ' + object + ' has review status in attr_list', () => {
      const attrList = businessModels[object].tree_view_options.attr_list;

      expect(_.map(attrList, 'attr_title'))
        .toContain('Review State', 'for object ' + object);
      expect(_.map(attrList, 'attr_name'))
        .toContain('review_status', 'for object ' + object);
    });
  });

  objectsWithoutReview.forEach(function (object) {
    it('checks if ' + object + ' has not review status in attr_list', () => {
      const attrList = businessModels[object].tree_view_options.attr_list;

      expect(_.map(attrList, 'attr_name')).not.toContain('review_status');
    });
  });
});
