# Copyright (C) 2018 Google Inc.
# Licensed under http://www.apache.org/licenses/LICENSE-2.0 <see LICENSE file>

"""This module contains common handlers for issue tracker integration."""

# pylint: disable=unused-argument

import itertools

from ggrc import settings
from ggrc.models import all_models
from ggrc.models.hooks.issue_tracker import handlers_mapping
from ggrc.services import signals


def handle_object_creation_event(sender, objects=None, **kwargs):
  """Common handler for 'collection_posted' event.
  Args:
      sender: A class of Resource handling the POST request.
      objects: A list of model instances created from the POSTed JSON.
      sources: A list of original POSTed JSON dictionaries.
  """
  if not settings.ISSUE_TRACKER_ENABLED:
    return

  sources = kwargs.get("sources", [])
  for obj, src in itertools.izip(objects, sources):
    object_handlers = handlers_mapping.ISSUE_TRACKER_HANDLERS.get(sender, {})
    issue_tracker_info = src.get("issue_tracker", {}) if src else {}
    object_handlers[handlers_mapping.CREATE_HANDLER_NAME](obj,
                                                          issue_tracker_info)


def handle_object_deletion_event(sender, obj=None, **kwargs):
  """Common handler for 'model_deleted' event.
  Args:
      sender: A class of Resource handling the DELETE request.
      obj: Model instance for deletion.
  """
  if not settings.ISSUE_TRACKER_ENABLED:
    return

  object_handlers = handlers_mapping.ISSUE_TRACKER_HANDLERS.get(sender, {})
  object_handlers[handlers_mapping.DELETE_HANDLER_NAME](obj)


def handle_object_updating_event(sender, obj=None, initial_state=None,
                                 **kwargs):
  """Common handler for 'model_put' event.
  Args:
      sender: A class of Resource handling the PUT request.
      obj: Model instance for update.
  """
  if not settings.ISSUE_TRACKER_ENABLED:
    return

  object_handlers = handlers_mapping.ISSUE_TRACKER_HANDLERS.get(sender, {})
  issue_tracker = kwargs.get("src", {}).get("issue_tracker")
  object_handlers[handlers_mapping.UPDATE_HANDLER_NAME](obj,
                                                        initial_state,
                                                        issue_tracker)


def handle_comment_creation_event(sender, objects=None, **kwargs):
  """Common handler for adding comment."""
  if not settings.ISSUE_TRACKER_ENABLED:
    return

  for obj in objects:
    comment, other = obj.source, obj.destination
    if comment.type != u"Comment":
      comment, other = other, comment

    for model, handlers in handlers_mapping.ISSUE_TRACKER_HANDLERS.items():
      if model.__name__ == other.type:
        if handlers_mapping.CREATE_COMMENT_HANDLER_NAME in handlers:
          handlers[handlers_mapping.CREATE_COMMENT_HANDLER_NAME](
              other, comment, obj.modified_by.name
          )


def init_hook():
  """Initialize common handlers for all models from handlers dict."""
  issue_tracker_handlers = handlers_mapping.ISSUE_TRACKER_HANDLERS
  for model, model_handlers in issue_tracker_handlers.iteritems():
    if handlers_mapping.CREATE_HANDLER_NAME in model_handlers:
      signals.Restful.collection_posted.connect(
          handle_object_creation_event,
          sender=model
      )

    if handlers_mapping.DELETE_HANDLER_NAME in model_handlers:
      signals.Restful.model_deleted.connect(
          handle_object_deletion_event,
          sender=model
      )

    if handlers_mapping.UPDATE_HANDLER_NAME in model_handlers:
      signals.Restful.model_put_before_commit.connect(
          handle_object_updating_event,
          sender=model
      )

    if handlers_mapping.CREATE_COMMENT_HANDLER_NAME in model_handlers:
      signals.Restful.collection_posted.connect(
          handle_comment_creation_event,
          sender=all_models.Relationship
      )
