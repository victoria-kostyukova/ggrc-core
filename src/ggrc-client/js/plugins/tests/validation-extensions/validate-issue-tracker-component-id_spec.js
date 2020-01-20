/*
  Copyright (C) 2020 Google Inc.
  Licensed under http://www.apache.org/licenses/LICENSE-2.0 <see LICENSE file>
*/

import canModel from 'can-model/src/can-model';
import canMap from 'can-map/can-map';

describe('validateIssueTrackerComponentId extension', () => {
  let TestModel;

  beforeEach(() => {
    TestModel = canModel.extend({}, {
      define: {
        issue_tracker: {
          value: {},
          validate: {
            validateIssueTrackerComponentId: true,
          },
        },
        can_use_issue_tracker: {
          value: true,
        },
      },
    });
  });

  it('should return TRUE. issue tracker is disabled', () => {
    const instance = new TestModel();
    instance.attr('issue_tracker', new canMap({
      enabled: false,
    }));
    expect(instance.validate()).toBeTruthy();
    expect(instance.errors.issue_tracker).toBeUndefined();
  });

  it('should return TRUE. issue tracker is empty object', () => {
    const instance = new TestModel();
    instance.attr('issue_tracker', {});
    expect(instance.validate()).toBeTruthy();
    expect(instance.errors.issue_tracker).toBeUndefined();
  });

  it('should return FALSE. issue tracker does not have component id', () => {
    const instance = new TestModel();
    instance.attr('issue_tracker', new canMap({
      enabled: true,
    }));
    expect(instance.validate()).toBeFalsy();
    expect(instance.errors.issue_tracker[0].component_id)
      .toEqual('cannot be blank');
  });

  it('should return TRUE. issue tracker has component id', () => {
    const instance = new TestModel();
    instance.attr('issue_tracker', new canMap({
      enabled: true,
      component_id: 1,
    }));
    expect(instance.validate()).toBeTruthy();
    expect(instance.errors.issue_tracker).toBeUndefined();
  });

  it('should return TRUE. can_use_issue_tracker - true, enabled - false',
    () => {
      const instance = new TestModel();
      instance.attr('issue_tracker', new canMap({
        enabled: false,
      }));
      expect(instance.validate()).toBeTruthy();
      expect(instance.errors.issue_tracker).toBeUndefined();
    }
  );

  it('should return TRUE. can_use_issue_tracker - false, enabled - false',
    () => {
      const instance = new TestModel();
      instance.attr('issue_tracker', new canMap({
        enabled: false,
      }));
      instance.attr('can_use_issue_tracker', false);
      expect(instance.validate()).toBeTruthy();
      expect(instance.errors.issue_tracker).toBeUndefined();
    }
  );
});
