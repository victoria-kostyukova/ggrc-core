/*
    Copyright (C) 2020 Google Inc.
    Licensed under http://www.apache.org/licenses/LICENSE-2.0 <see LICENSE file>
*/

import canMap from 'can-map';
import Mixin from './mixin';
import * as issueTrackerUtils from '../../plugins/utils/issue-tracker-utils';

export default class IssueTracker extends Mixin {
  'after:init'() {
    this.initIssueTracker();
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

  initIssueTracker() {
    if (!GGRC.ISSUE_TRACKER_ENABLED) {
      return;
    }

    if (!this.issue_tracker) {
      this.attr('issue_tracker', new canMap({}));
    }

    let config = this.constructor.buildIssueTrackerConfig
      ? this.constructor.buildIssueTrackerConfig(this)
      : {enabled: false};

    issueTrackerUtils.initIssueTrackerObject(
      this,
      config,
      true
    );
  }

  setDefaultHotlistAndComponent() { // eslint-disable-line id-length
    let config = this.constructor.buildIssueTrackerConfig ?
      this.constructor.buildIssueTrackerConfig(this) :
      {};

    this.attr('issue_tracker').attr({
      hotlist_id: config.hotlist_id,
      component_id: config.component_id,
    });
  }

  issueCreated() {
    return GGRC.ISSUE_TRACKER_ENABLED
      && issueTrackerUtils.isIssueCreated(this);
  }

  issueTrackerEnabled() {
    return GGRC.ISSUE_TRACKER_ENABLED
      && issueTrackerUtils.isIssueTrackerEnabled(this);
  }
}

Object.assign(
  IssueTracker,
  issueTrackerUtils.issueTrackerStaticFields
);
