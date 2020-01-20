# Copyright (C) 2020 Google Inc.
# Licensed under http://www.apache.org/licenses/LICENSE-2.0 <see LICENSE file>

"""Module with gcalendar utils."""

import urllib
from urlparse import urljoin
from collections import defaultdict

import sqlalchemy as sa

from ggrc import db
from ggrc.models import all_models
from ggrc.utils import get_url_root


def get_active_cycle_tasks_url(due_date):
  """Get CycleTask notification url."""
  base = urljoin(get_url_root(), u"dashboard#!task&query=")
  active_filter = (
      u'(("Task Status" IN ("Finished","Declined")'
      u' and "Needs Verification"="Yes") or ('
      u'"Task Status" IN ("Assigned","In Progress")'
      u')) and "Task Due Date"={due_date}'
  ).format(due_date=due_date)
  return base + urllib.quote(active_filter.encode('utf-8'))


def get_cycle_tasks_url_by_slug(slug):
  """Get CycleTask notification url based on slug."""
  base = urljoin(get_url_root(), u"dashboard#!task&query=")
  active_filter = u'"task slug"={slug}'.format(slug=slug)
  return base + urllib.quote(active_filter.encode('utf-8'))


def get_relationship(left_id, left_model_name, right_id, right_model_name):
  """Get relationship between models."""
  rel_model = all_models.Relationship
  return rel_model.query.filter(sa.or_(
      sa.and_(
          rel_model.source_id == left_id,
          rel_model.source_type == left_model_name,
          rel_model.destination_id == right_id,
          rel_model.destination_type == right_model_name,
      ),
      sa.and_(
          rel_model.source_id == right_id,
          rel_model.source_type == right_model_name,
          rel_model.destination_id == left_id,
          rel_model.destination_type == left_model_name,
      ),
  )).first()


def get_related_mapping(left, right):
  """Fetch mapping between entities."""
  source_query = db.session.query(
      all_models.Relationship.source_id.label("left_id"),
      all_models.Relationship.destination_id.label("right_id"),
  ).filter(
      all_models.Relationship.destination_type == right.__name__,
      all_models.Relationship.source_type == left.__name__,
  )
  destination_query = db.session.query(
      all_models.Relationship.destination_id.label("left_id"),
      all_models.Relationship.source_id.label("right_id"),
  ).filter(
      all_models.Relationship.source_type == right.__name__,
      all_models.Relationship.destination_type == left.__name__,
  )
  mappings = destination_query.union(source_query).all()

  mappings_dict = defaultdict(set)
  for left_id, right_id in mappings:
    mappings_dict[left_id].add(right_id)

  return mappings_dict
