/*
  Copyright (C) 2020 Google Inc.
  Licensed under http://www.apache.org/licenses/LICENSE-2.0 <see LICENSE file>
*/

import canModel from 'can-model/src/can-model';
import canMap from 'can-map/can-map';

describe('validateIssueTrackerTitle extension', () => {
  let TestModel;

  beforeAll(() => {
    TestModel = canModel.extend({}, {
      define: {
        issue_tracker: {
          value: {},
          validate: {
            validateIssueTrackerTitle: true,
          },
        },
        can_use_issue_tracker: {
          value: true,
        },
      },
    });
  });

  it('should return FALSE. issue tracker does not have title', () => {
    const instance = new TestModel();
    instance.attr('issue_tracker', new canMap({
      enabled: true,
    }));
    instance.attr('can_use_issue_tracker', true);
    expect(instance.validate()).toBeFalsy();
    expect(instance.errors.issue_tracker[0].title)
      .toEqual('cannot be blank');
  });

  it('should return FALSE. issue tracker has empty title', () => {
    const instance = new TestModel();
    instance.attr('issue_tracker', new canMap({
      enabled: true,
      title: '     ',
    }));
    instance.attr('can_use_issue_tracker', true);
    expect(instance.validate()).toBeFalsy();
    expect(instance.errors.issue_tracker[0].title)
      .toEqual('cannot be blank');
  });

  it('should return TRUE. issue tracker has title', () => {
    const instance = new TestModel();
    instance.attr('issue_tracker', new canMap({
      enabled: true,
      title: 'my title',
    }));
    instance.attr('can_use_issue_tracker', true);
    expect(instance.validate()).toBeTruthy();
    expect(instance.errors.issue_tracker).toBeUndefined();
  });

  it('should return TRUE. can_use_issue_tracker - true, enabled - false',
    () => {
      const instance = new TestModel();
      instance.attr('issue_tracker', new canMap({
        enabled: false,
      }));
      instance.attr('can_use_issue_tracker', true);
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

  it('should return TRUE. is_linking is TRUE', () => {
    const instance = new TestModel();
    instance.attr('issue_tracker', new canMap({
      enabled: true,
      title: undefined,
      is_linking: true,
    }));
    instance.attr('can_use_issue_tracker', true);
    expect(instance.validate()).toBeTruthy();
    expect(instance.errors.issue_tracker).toBeUndefined();
  });
});
