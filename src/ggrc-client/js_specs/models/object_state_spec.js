/*
    Copyright (C) 2018 Google Inc.
    Licensed under http://www.apache.org/licenses/LICENSE-2.0 <see LICENSE file>
*/

describe('Model states test', function () {
  let basicStateObjects = ['AccessGroup', 'Clause', 'Contract',
    'Control', 'DataAsset', 'Facility', 'Market',
    'Objective', 'OrgGroup', 'Policy', 'Process', 'Product', 'Program',
    'Project', 'Regulation', 'Risk', 'Requirement', 'Standard', 'System',
    'Threat', 'Vendor'];

  basicStateObjects.forEach(function (object) {
    let expectedStatuses = ['Draft', 'Deprecated', 'Active'];
    it('checks if ' + object + ' has expected statuses', function () {
      expect(CMS.Models[object].statuses).toEqual(
        expectedStatuses, 'for object ' + object);
    });
  });
  it('checks if Audit has expected statuses', function () {
    let expectedStatuses = ['Planned', 'In Progress', 'Manager Review',
      'Ready for External Review', 'Completed', 'Deprecated'];
    expect(CMS.Models.Audit.statuses).toEqual(expectedStatuses);
  });
  it('checks if Assessment has correct statuses', function () {
    let expectedStatuses = ['Not Started', 'In Progress', 'In Review',
      'Verified', 'Completed', 'Deprecated', 'Rework Needed'];
    expect(CMS.Models.Assessment.statuses).toEqual(expectedStatuses);
  });
  it('checks if Issue has correct statuses', function () {
    let expectedStatuses = ['Draft', 'Deprecated', 'Active', 'Fixed',
      'Fixed and Verified'];
    expect(CMS.Models.Issue.statuses).toEqual(expectedStatuses);
  });
});

describe('Model review state test', function () {
  let reviewObjects = ['AccessGroup', 'Assessment', 'Audit', 'Clause',
    'Contract', 'Control', 'DataAsset', 'Facility', 'Issue', 'Market',
    'Objective', 'OrgGroup', 'Policy', 'Process', 'Product', 'Program',
    'Project', 'Regulation', 'Risk', 'Requirement', 'Standard', 'System',
    'Threat', 'Vendor'];
  reviewObjects.forEach(function (object) {
    it('checks if ' + object + ' has os state in attr_list', function () {
      expect(_.map(CMS.Models[object].attr_list, 'attr_title'))
        .toContain('Review State', 'for object ' + object);
      expect(_.map(CMS.Models[object].attr_list, 'attr_name'))
        .toContain('os_state', 'for object ' + object);
    });
  });
});
