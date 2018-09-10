# Copyright (C) 2018 Google Inc.
# Licensed under http://www.apache.org/licenses/LICENSE-2.0 <see LICENSE file>

"""This module contains common utils for integration functionality."""

from ggrc import db
from ggrc import settings
from ggrc.models import exceptions
from ggrc.models import all_models


def validate_issue_tracker_info(info):
  """Validates that component ID and hotlist ID are integers."""
  component_id = info.get('component_id')
  if component_id:
    try:
      int(component_id)
    except (TypeError, ValueError):
      raise exceptions.ValidationError('Component ID must be a number.')

  hotlist_id = info.get('hotlist_id')
  if hotlist_id:
    try:
      int(hotlist_id)
    except (TypeError, ValueError):
      raise exceptions.ValidationError('Hotlist ID must be a number.')


def is_already_linked(ticket_id):
  """Checks if ticket with ticket_id is already linked to GGRC object"""
  exists_query = db.session.query(
      all_models.IssuetrackerIssue.issue_id
  ).filter_by(issue_id=ticket_id).exists()
  return db.session.query(exists_query).scalar()


def normalize_issue_tracker_info(info):
  """Insures that component ID and hotlist ID are integers."""
  # TODO(anushovan): remove data type casting once integration service
  #   supports strings for following properties.
  component_id = info.get('component_id')
  if component_id:
    try:
      info['component_id'] = int(component_id)
    except (TypeError, ValueError):
      raise exceptions.ValidationError('Component ID must be a number.')

  hotlist_id = info.get('hotlist_id')
  if hotlist_id:
    try:
      info['hotlist_id'] = int(hotlist_id)
    except (TypeError, ValueError):
      raise exceptions.ValidationError('Hotlist ID must be a number.')


def build_issue_tracker_url(issue_id):
  """Build issue tracker URL by issue id."""
  issue_tracker_tmpl = settings.ISSUE_TRACKER_BUG_URL_TMPL
  url_tmpl = issue_tracker_tmpl if issue_tracker_tmpl else 'http://issue/%s'
  return url_tmpl % issue_id


def exclude_auditor_emails(emails):
  """Returns new email set with excluded auditor emails."""
  acl = all_models.AccessControlList
  acr = all_models.AccessControlRole

  if not isinstance(emails, set):
    emails = set(emails)

  auditor_emails = db.session.query(
      all_models.Person.email
  ).join(
      acl, acl.person_id == all_models.Person.id
  ).join(
      acr
  ).filter(
      acr.name == "Auditors",
      all_models.Person.email.in_(emails)
  ).distinct().all()

  emails_to_exlude = {line.email for line in auditor_emails}
  return emails - emails_to_exlude
