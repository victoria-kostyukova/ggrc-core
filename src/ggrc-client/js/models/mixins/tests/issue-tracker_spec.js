/*
  Copyright (C) 2020 Google Inc.
  Licensed under http://www.apache.org/licenses/LICENSE-2.0 <see LICENSE file>
*/

import * as issueTrackerUtils from '../../../plugins/utils/issue-tracker-utils';
import {makeFakeInstance} from '../../../../js_specs/spec-helpers';
import Cacheable from '../../cacheable';
import IssueTracker from '../issue-tracker';

describe('IssueTracker mixin', () => {
  let Mixin;

  beforeAll(function () {
    GGRC.ISSUE_TRACKER_ENABLED = true;
    Mixin = IssueTracker;
  });

  describe('initIssueTracker() method', () => {
    let method;

    beforeAll(() => {
      method = Mixin.prototype.initIssueTracker;
      GGRC.ISSUE_TRACKER_ENABLED = false;
    });

    it('should show issue tracker if globally enabled and' +
       ' turn off by default', () => {
      GGRC.ISSUE_TRACKER_ENABLED = true;
      const stub = makeFakeInstance({model: Cacheable})();

      spyOn(issueTrackerUtils, 'initIssueTrackerObject');
      method.apply(stub);

      expect(issueTrackerUtils.initIssueTrackerObject.calls.count()).toEqual(1);
      const callArgs = issueTrackerUtils.initIssueTrackerObject
        .calls.mostRecent().args;

      expect(callArgs[1].enabled).toEqual(false); // turn off by default
      expect(callArgs[2]).toEqual(true); // show issue tracker controls
    });

    it('should show issue tracker if globally enabled and' +
       ' set up default values', () => {
      GGRC.ISSUE_TRACKER_ENABLED = true;
      const config = {
        hotlist_id: '766459',
        enabled: true,
      };

      const stub = makeFakeInstance({
        model: Cacheable,
        staticProps: {
          buildIssueTrackerConfig() {
            return config;
          },
        },
      })();

      spyOn(issueTrackerUtils, 'initIssueTrackerObject');
      method.apply(stub);

      expect(issueTrackerUtils.initIssueTrackerObject.calls.count()).toEqual(1);
      const callArgs = issueTrackerUtils.initIssueTrackerObject
        .calls.mostRecent().args;

      expect(callArgs[1]).toEqual(config);
      expect(callArgs[2]).toEqual(true); // show issue tracker controls
    });


    it('should hide issue tracker if globally disabled and' +
       ' turn off by default', () => {
      GGRC.ISSUE_TRACKER_ENABLED = false;
      const stub = makeFakeInstance({model: Cacheable})();

      spyOn(issueTrackerUtils, 'initIssueTrackerObject');
      method.apply(stub);

      expect(issueTrackerUtils.initIssueTrackerObject.calls.count()).toEqual(0);
      expect(stub.attr('issue_tracker.enabled')).toBeFalsy();
    });
  });

  describe('setDefaultHotlistAndComponent() method', () => {
    let method;

    beforeAll(() => {
      method = Mixin.prototype.setDefaultHotlistAndComponent;
    });

    it('should set up default hotlist and component ids', () => {
      const stub = makeFakeInstance({
        model: Cacheable,
        staticProps: {
          buildIssueTrackerConfig() {
            return {
              hotlist_id: 'hotlist_id',
              component_id: 'component_id',
            };
          },
        },
        instanceProps: {
          issue_tracker: {},
        },
      })();

      method.apply(stub);

      expect(stub.issue_tracker.hotlist_id).toBe('hotlist_id');
      expect(stub.issue_tracker.component_id).toBe('component_id');
    });
  });
});
