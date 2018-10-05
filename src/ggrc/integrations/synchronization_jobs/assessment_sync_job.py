# Copyright (C) 2018 Google Inc.
# Licensed under http://www.apache.org/licenses/LICENSE-2.0 <see LICENSE file>

"""Assessment integration functionality via cron job."""

import logging

from ggrc.integrations import issues, integrations_errors
from ggrc.integrations.synchronization_jobs import sync_utils


logger = logging.getLogger(__name__)


# A list of field to watch for changes in.
FIELDS_TO_CHECK = ('status', 'type', 'priority', 'severity')

# Status values maps from GGRC to IssueTracker.
ASSESSMENT_STATUSES_MAPPING = {
    'Not Started': 'ASSIGNED',
    'In Progress': 'ASSIGNED',
    'In Review': 'FIXED',
    'Rework Needed': 'ASSIGNED',
    'Completed': 'VERIFIED',
    'Deprecated': 'OBSOLETE',
}


def _compare_ccs(ccs_payload, ccs_issuetracker):
  """Validate CCs on payload and from third party server.

  Args:
    - ccs_payload: CCs on Issue Tracker Payload
    - ccs_issuetracker: CCs from Issue Tracker

  Returns:
    bool object with validate or not indicator (True/False)
  """
  ccs_payload = frozenset(cc.strip() for cc in ccs_payload)
  ccs_issuetracker = frozenset(cc.strip() for cc in ccs_issuetracker)

  return bool(ccs_payload == ccs_issuetracker)


def sync_assessment_statuses():
  """Synchronizes issue tracker ticket statuses with the Assessment statuses.

  Checks for Assessments which are in sync with Issue Tracker issues and
  updates their statuses in accordance to the corresponding Assessments
  if differ.
  """
  assessment_issues = sync_utils.collect_issue_tracker_info(
      "Assessment",
      include_ccs=True
  )
  if not assessment_issues:
    return
  logger.debug('Syncing state of %d issues.', len(assessment_issues))

  cli = issues.Client()
  processed_ids = set()
  for batch in sync_utils.iter_issue_batches(assessment_issues.keys()):
    for issue_id, issuetracker_state in batch.iteritems():
      issue_id = str(issue_id)
      issue_info = assessment_issues.get(issue_id)
      if not issue_info:
        logger.warning(
            'Got an unexpected issue from Issue Tracker: %s', issue_id)
        continue

      processed_ids.add(issue_id)
      assessment_state = issue_info['state']

      status_value = ASSESSMENT_STATUSES_MAPPING.get(
          assessment_state["status"]
      )
      if not status_value:
        logger.error(
            'Inexistent Issue Tracker status for assessment ID=%d '
            'with status: %s.', issue_info['object_id'], status_value
        )
        continue

      assessment_state["status"] = status_value
      if all(
          assessment_state.get(field) == issuetracker_state.get(field)
          for field in FIELDS_TO_CHECK
      ) and _compare_ccs(
          assessment_state.get("ccs", []),
          issuetracker_state.get("ccs", [])
      ):
        continue

      try:
        sync_utils.update_issue(cli, issue_id, assessment_state)
      except integrations_errors.Error as error:
        logger.error(
            'Unable to update status of Issue Tracker issue ID=%s for '
            'assessment ID=%d: %r',
            issue_id, issue_info['object_id'], error)

  logger.debug('Sync is done, %d issue(s) were processed.', len(processed_ids))

  missing_ids = set(assessment_issues) - processed_ids
  if missing_ids:
    logger.warning(
        'Some issues are linked to Assessments '
        'but were not found in Issue Tracker: %s',
        ', '.join(str(i) for i in missing_ids))
