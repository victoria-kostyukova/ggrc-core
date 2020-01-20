/*
    Copyright (C) 2020 Google Inc.
    Licensed under http://www.apache.org/licenses/LICENSE-2.0 <see LICENSE file>
*/

import canMap from 'can-map';
import Mixin from './mixin';
import * as issueTrackerUtils from '../../plugins/utils/issue-tracker-utils';
import {getPageInstance} from '../../plugins/utils/current-page-utils';
import {reify} from '../../plugins/utils/reify-utils';

export default class AssessmentIssueTracker extends Mixin {
  'after:init'() {
    this.initIssueTracker();
    this.trackAuditUpdates();
  }

  'before:refresh'() {
    issueTrackerUtils.cleanUpWarnings(this);
  }

  beforeEnqueue() {
    if (!GGRC.ISSUE_TRACKER_ENABLED) {
      return;
    }

    issueTrackerUtils.cleanUpBeforeSave(this);
  }

  afterRefresh() {
    this.initIssueTracker();
  }

  afterSave() {
    issueTrackerUtils.checkWarnings(this);
  }

  trackAuditUpdates() {
    const audit = this.attr('audit') && reify(this.attr('audit'));

    if (!audit) {
      return;
    }

    audit.bind('updated', (event) => {
      this.attr('audit', event.target);
      this.initIssueTrackerForAssessment();
    });
  }

  initIssueTracker() {
    if (!GGRC.ISSUE_TRACKER_ENABLED) {
      return $.Deferred().reject();
    }

    if (!this.attr('issue_tracker')) {
      this.attr('issue_tracker', new canMap({}));
    }

    let audit = this.getParentAudit();
    this.attr('audit', audit);
    this.initIssueTrackerForAssessment();
  }

  getParentAudit() {
    if (this.audit) {
      return this.audit;
    }

    if (this.isNew()) {
      const pageInstance = getPageInstance();
      if (pageInstance.type !== 'Audit') {
        throw new Error('Assessment must be created from Audit page only');
      }

      return pageInstance;
    }
  }

  /**
   * Initializes Issue Tracker for Assessment and Assessment Template
   */
  initIssueTrackerForAssessment() { // eslint-disable-line id-length
    let auditItr = this.attr('audit.issue_tracker') || {};
    let itrEnabled = this.isNew()
      // turned ON for Assessment & Assessment Template by default
      // for newly created instances
      ? (auditItr && auditItr.enabled)
      // for existing instance, the value from the server will be used
      : false;

    let issueTitle = this.title || '';

    let issueTracker = new canMap(auditItr).attr({
      title: issueTitle,
      enabled: itrEnabled,
    });

    issueTrackerUtils.initIssueTrackerObject(
      this,
      issueTracker,
      auditItr.enabled
    );
  }

  setDefaultHotlistAndComponent() { // eslint-disable-line id-length
    let config = this.attr('audit.issue_tracker');
    this.attr('issue_tracker').attr({
      hotlist_id: config.hotlist_id,
      component_id: config.component_id,
    });
  }

  issueCreated() {
    return this.attr('can_use_issue_tracker')
      && issueTrackerUtils.isIssueCreated(this);
  }

  issueTrackerEnabled() {
    return this.attr('can_use_issue_tracker')
      && issueTrackerUtils.isIssueTrackerEnabled(this);
  }
}

Object.assign(
  AssessmentIssueTracker,
  issueTrackerUtils.issueTrackerStaticFields
);
