/*
  Copyright (C) 2020 Google Inc.
  Licensed under http://www.apache.org/licenses/LICENSE-2.0 <see LICENSE file>
*/

import canMap from 'can-map';
import * as issueTrackerUtils from '../../../plugins/utils/issue-tracker-utils';
import {makeFakeInstance} from '../../../../js_specs/spec-helpers';
import * as CurrentPageUtils from '../../../plugins/utils/current-page-utils';
import AssessmentIssueTracker from '../assessment-issue-tracker';
import Assessment from '../../business-models/assessment';

describe('AssessmentIssueTracker mixin', () => {
  let Mixin;
  let audit;

  beforeAll(function () {
    GGRC.ISSUE_TRACKER_ENABLED = true;
    Mixin = AssessmentIssueTracker;

    audit = new canMap({
      id: 123,
      title: 'Audit',
      type: 'Audit',
      issue_tracker: {
        hotlist_id: 'hotlist_id',
        component_id: 'component_id',
      },
    });
  });

  describe('"after:init" event', () => {
    const asmtProto = Assessment.prototype;

    it('should call "initIssueTrackerForAssessment" for audit', () => {
      spyOn(asmtProto, 'getParentAudit').and.returnValue(audit);
      spyOn(asmtProto, 'initIssueTrackerForAssessment');
      makeFakeInstance({model: Assessment})({type: 'Assessment'});

      expect(asmtProto.initIssueTrackerForAssessment).toHaveBeenCalled();
    });

    it('should call "trackAuditUpdates" method', () => {
      spyOn(asmtProto, 'initIssueTracker');
      spyOn(asmtProto, 'trackAuditUpdates');
      makeFakeInstance({model: Assessment})({type: 'Assessment'});
      expect(asmtProto.trackAuditUpdates).toHaveBeenCalled();
    });
  });

  describe('getParentAudit() method: ', function () {
    let method;
    let assessment;

    beforeEach(function () {
      assessment = new canMap({
        audit,
      });
      method = Mixin.prototype.getParentAudit;
    });

    it('should resolve to assigned audit property', function () {
      let resolvedAudit = method.apply(assessment);

      expect(resolvedAudit).toEqual(audit);
    });

    it('should resolve to audit from page instance', function () {
      spyOn(CurrentPageUtils, 'getPageInstance')
        .and.returnValue(audit);

      assessment.isNew = () => true;
      assessment.attr('audit', null);

      let resolvedAudit = method.apply(assessment);
      expect(resolvedAudit).toEqual(audit);
    });
  });

  describe('initIssueTrackerForAssessment() method [new assessment]', () => {
    let method;
    let fakeAssessment;
    let fakeAudit;

    beforeAll(() => {
      method = Mixin.prototype.initIssueTrackerForAssessment;
    });

    beforeEach(() => {
      fakeAudit = new canMap({
        id: 1,
        type: 'Audit',
        issue_tracker: {
          enabled: true,
        },
      });
      fakeAssessment = new canMap({
        audit: fakeAudit,
        issue_tracker: {
          enabled: null,
        },
        isNew() {
          return !this.id;
        },
      });

      spyOn(issueTrackerUtils, 'initIssueTrackerObject');
    });

    it('should show ITR if enabled in audit',
      () => {
        fakeAssessment.attr('audit.issue_tracker.enabled', true);
        method.apply(fakeAssessment);

        const itrShowControls = issueTrackerUtils.initIssueTrackerObject
          .calls.mostRecent().args[2];
        expect(itrShowControls).toEqual(true); // show issue tracker controls
      });

    it('should hide ITR if disabled in audit',
      () => {
        fakeAssessment.attr('audit.issue_tracker.enabled', false);
        method.apply(fakeAssessment);

        const itrShowControls = issueTrackerUtils.initIssueTrackerObject
          .calls.mostRecent().args[2];
        expect(itrShowControls).toEqual(false); // show issue tracker controls
      });

    it('should enable ITR if enabled in audit', () => {
      fakeAssessment.attr('audit.issue_tracker.enabled', true);
      method.apply(fakeAssessment);

      const itrConfig = issueTrackerUtils.initIssueTrackerObject
        .calls.mostRecent().args[1];

      expect(itrConfig.enabled).toEqual(true); // turn on by default for assessment
    });

    it('should disable ITR if disable in audit', () => {
      fakeAssessment.attr('audit.issue_tracker.enabled', false);
      method.apply(fakeAssessment);

      const itrConfig = issueTrackerUtils.initIssueTrackerObject
        .calls.mostRecent().args[1];

      expect(itrConfig.enabled).toEqual(false); // turn on by default for assessment
    });
  });

  describe('initIssueTrackerForAssessment() method [existing assessment]',
    () => {
      let method;
      let fakeAssessment;
      let fakeAudit;

      beforeAll(() => {
        method = Mixin.prototype.initIssueTrackerForAssessment;
      });

      beforeEach(() => {
        fakeAudit = new canMap({
          id: 1,
          type: 'Audit',
          issue_tracker: {
            enabled: true,
          },
        });
        fakeAssessment = new canMap({
          id: 123,
          audit: fakeAudit,
          issue_tracker: {
            enabled: null,
          },
          isNew() {
            return !this.id;
          },
        });

        spyOn(issueTrackerUtils, 'initIssueTrackerObject');
      });

      it('should hide ITR if disabled in audit and enabled on instance',
        () => {
          let itrShowControls;
          fakeAssessment.attr('issue_tracker.enabled', true);

          // disabled in Audit
          fakeAssessment.attr('audit.issue_tracker.enabled', false);
          method.apply(fakeAssessment);
          itrShowControls = issueTrackerUtils.initIssueTrackerObject
            .calls.mostRecent().args[2];
          expect(itrShowControls).toEqual(false);
        }
      );

      it('should hide ITR if disabled on instance and in audit', () => {
        let itrShowControls;
        fakeAssessment.attr('issue_tracker.enabled', false);

        // disabled in Audit
        fakeAssessment.attr('audit.issue_tracker.enabled', false);
        method.apply(fakeAssessment);
        itrShowControls = issueTrackerUtils.initIssueTrackerObject
          .calls.mostRecent().args[2];
        expect(itrShowControls).toEqual(false);
      });

      it('should show ITR if enabled on instance and in audit', () => {
        let itrShowControls;
        fakeAssessment.attr('issue_tracker.enabled', true);

        // enabled in Audit
        fakeAssessment.attr('audit.issue_tracker.enabled', true);
        method.apply(fakeAssessment);
        itrShowControls = issueTrackerUtils.initIssueTrackerObject
          .calls.mostRecent().args[2];
        expect(itrShowControls).toEqual(true);
      });

      it('should show ITR if disabled on instance and enabled in audit',
        () => {
          let itrShowControls;
          fakeAssessment.attr('issue_tracker.enabled', false);

          // enabled in Audit
          fakeAssessment.attr('audit.issue_tracker.enabled', true);
          method.apply(fakeAssessment);
          itrShowControls = issueTrackerUtils.initIssueTrackerObject
            .calls.mostRecent().args[2];
          expect(itrShowControls).toEqual(true);
        }
      );
    }
  );

  describe('setDefaultHotlistAndComponent() method', () => {
    let method;

    beforeAll(() => {
      method = Assessment.prototype.setDefaultHotlistAndComponent;
    });

    it('should set up default hotlist and component ids', () => {
      spyOn(Assessment.prototype, 'getParentAudit').and.returnValue(audit);
      const stub = makeFakeInstance({model: Assessment})();

      stub.attr('issue_tracker').attr({
        hotlist_id: null,
        component_id: null,
      });

      method.apply(stub);

      expect(stub.issue_tracker.hotlist_id).toBe('hotlist_id');
      expect(stub.issue_tracker.component_id).toBe('component_id');
    });
  });
});
