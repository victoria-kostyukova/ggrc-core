/*
 Copyright (C) 2019 Google Inc.
 Licensed under http://www.apache.org/licenses/LICENSE-2.0 <see LICENSE file>
 */

import {notifier} from './notifiers-utils';
import {ggrcGet} from '../ajax_extensions';

const issueTrackerStaticFields = {
  issue_tracker_enable_options: [
    {value: true, title: 'On'},
    {value: false, title: 'Off'},
  ],
  issue_tracker_priorities: ['P0', 'P1', 'P2', 'P3', 'P4'],
  issue_tracker_severities: ['S0', 'S1', 'S2', 'S3', 'S4'],
};

const isIssueTrackerInitialized = (instance) => {
  // 'issue_tracker' has already initialized if component_id is filled;
  return !!(instance.attr('issue_tracker.component_id'));
};

const isIssueCreated = (instance) => {
  return !!(instance.attr('issue_tracker.issue_url'));
};

const isIssueTrackerEnabled = (instance) => {
  return isIssueCreated(instance)
    && instance.attr('issue_tracker.enabled');
};

/**
 * Removes unnecessary fields from issue_tracker attr before save
 * @param {can.Map} instance - instance of model
 */
const cleanUpBeforeSave = (instance) => {
  const issueTracker = instance.attr('issue_tracker');
  if (!instance.attr('can_use_issue_tracker') || !issueTracker) {
    return;
  }

  if (!issueTracker.attr('enabled')) {
    issueTracker.attr({enabled: false}, true);
    return;
  }

  const isLinking = issueTracker.attr('is_linking');
  const issueId = issueTracker.attr('issue_id');

  if (issueId && isLinking) {
    const modifiedIssueTracker = {
      enabled: true,
      is_linking: true,
      issue_id: issueId,
    };

    issueTracker.attr(modifiedIssueTracker, true);
  }
};

/**
 * Initializes issue tracker data from predefined defaults if tracker
 * data is not available from server ( new/old instance with empty issue_tracker )
 * @param  {Object} [instance={}] instance of type
 * @param  {Object} [defaultValues={}] issue tracker properties
 * @param  {Boolean} [canUseIssueTracker=false] should IssueTracker controls be shown
 */
function initIssueTrackerObject(
  instance = {},
  defaultValues = {},
  canUseIssueTracker = false
) {
  if (!isIssueTrackerInitialized(instance)) {
    instance.attr('issue_tracker', defaultValues);
  }
  instance.attr('can_use_issue_tracker', canUseIssueTracker);
}

function cleanUpWarnings(instance) {
  // clear warnings because CanJS save prev value of warning after merge
  // current instance and response
  if (instance.attr('issue_tracker._warnings')) {
    instance.attr('issue_tracker._warnings', []);
  }
}

function checkWarnings(instance) {
  let warnings = instance.attr('issue_tracker._warnings');

  if (warnings && warnings.length) {
    let warningMessage = warnings.join('; ');
    notifier('warning', warningMessage);
  }
}

const loadComponentIds = async () => {
  const response = await ggrcGet('/api/issuetracker_components');
  const ids = response.issuetracker_component
    .map((idItem) => ({value: idItem.component_id}));

  return ids;
};

export {
  issueTrackerStaticFields,
  isIssueTrackerInitialized,
  isIssueTrackerEnabled,
  isIssueCreated,
  initIssueTrackerObject,
  checkWarnings,
  cleanUpWarnings,
  cleanUpBeforeSave,
  loadComponentIds,
};
