# Copyright (C) 2020 Google Inc.
# Licensed under http://www.apache.org/licenses/LICENSE-2.0 <see LICENSE file>

"""Module for ggrc background tasks."""

import json
import traceback
import uuid
from email.utils import parseaddr
from logging import getLogger
from functools import wraps

from flask import request
from flask.wrappers import Response
from werkzeug import exceptions
from werkzeug.datastructures import Headers

from ggrc import db
from ggrc import settings
from ggrc.login import get_current_user
from ggrc.models.mixins import base
from ggrc.models.mixins import Base
from ggrc.models.deferred import deferred
from ggrc.models.mixins import Stateful
from ggrc.models.types import CompressedType
from ggrc.models import reflection
from ggrc.utils import benchmark, errors as app_errors


logger = getLogger(__name__)

BANNED_HEADERS = {
    "X-Appengine-Country",
    "X-Appengine-Queuename",
    "X-Appengine-Current-Namespace",
    "X-Appengine-Taskname",
    "X-Appengine-Tasketa",
    "X-Appengine-Taskexecutioncount",
    "X-Appengine-Taskretrycount",
    "X-Task-Name",
}

RETRY_OPTIONS = settings.RETRY_OPTIONS
DEFAULT_QUEUE = settings.DEFAULT_QUEUE


class BackgroundTask(base.ContextRBAC, Base, Stateful, db.Model):
  """Background task model."""
  __tablename__ = 'background_tasks'

  PENDING_STATUS = "Pending"
  RUNNING_STATUS = "Running"
  SUCCESS_STATUS = "Success"
  FAILURE_STATUS = "Failure"
  STOPPED_STATUS = "Stopped"

  VALID_STATES = [
      PENDING_STATUS,
      RUNNING_STATUS,
      SUCCESS_STATUS,
      FAILURE_STATUS,
      STOPPED_STATUS,
  ]
  name = db.Column(db.String, nullable=False, unique=True)
  parameters = deferred(db.Column(CompressedType), 'BackgroundTask')
  payload = deferred(db.Column(CompressedType), 'BackgroundTask')
  result = deferred(db.Column(CompressedType), 'BackgroundTask')

  bg_operation = db.relationship(
      "BackgroundOperation",
      backref='bg_task',
      uselist=False
  )

  _api_attrs_complete = reflection.ApiAttributes("id", "status", "type")

  _aliases = {
      "status": {
          "display_name": "State",
          "mandatory": False,
          "description": "Options are: \n{}".format('\n'.join(VALID_STATES))
      }
  }

  def start(self):
    """Mark the current task as running."""
    if self.status == self.PENDING_STATUS:
      self.status = self.RUNNING_STATUS
      db.session.add(self)
      db.session.commit()
    else:
      self.status = self.FAILURE_STATUS
      db.session.add(self)
      db.session.commit()
      raise exceptions.InternalServerError(app_errors.PREVIOUS_RUN_FAILED)

  def finish(self, status, result):
    """Finish the current bg task."""
    # Ensure to not commit any not-yet-committed changes
    db.session.rollback()

    if isinstance(result, Response):
      self.result = {'content': result.response[0],
                     'status_code': result.status_code,
                     'headers': result.headers.items()}
    else:
      self.result = {'content': result,
                     'status_code': 200,
                     'headers': [('Content-Type', 'text/html')]}
    self.status = status
    db.session.add(self)
    db.session.commit()

  def make_response(self, default=None):
    """Create task status response."""
    if self.result is None:
      return default
    from ggrc.app import app
    return app.make_response((self.result['content'],
                              self.result['status_code'],
                              self.result['headers']))

  def task_scheduled_response(self):
    """Create success response with info about scheduled task."""
    from ggrc.app import app
    return self.make_response(
        app.make_response((
            json.dumps("scheduled %s" % self.name),
            200,
            [("Content-Type", "application/json")]
        ))
    )

  def get_content(self):
    """Get result content of the task."""
    try:
      content_json = self.result.get("content", "{}") if self.result else "{}"
      content = json.loads(content_json)
    except (TypeError, ValueError):
      content = {}
    return content


def collect_task_headers():
  """Get headers required for appengine background task run."""
  headers = {}
  if hasattr(request, "headers"):
    headers = {k: v for k, v in request.headers if k not in BANNED_HEADERS}
  return Headers(headers)


# pylint: disable=too-many-arguments
def create_task(name, url, queued_callback=None, parameters=None,
                method="POST", operation_type=None, payload=None,
                queue=DEFAULT_QUEUE, retry_options=None):
  """Create and enqueue a background task."""
  with benchmark("Create background task"):
    parameters = parameters or dict()
    retry_options = retry_options or RETRY_OPTIONS
    bg_operation = None
    if operation_type:
      with benchmark("Create background task. Create BackgroundOperation"):
        bg_operation = _check_and_create_bg_operation(operation_type,
                                                      parameters)
    with benchmark("Create background task. Create BackgroundTask"):
      bg_task_name = "{}_{}".format(uuid.uuid4(), name)
      bg_task = _create_bg_task(
          name=bg_task_name,
          parameters=parameters,
          payload=payload,
          bg_operation=bg_operation)
    with benchmark("Create background task. Enqueue task"):
      # Task request have to contain data to pass content_type validation.
      payload = payload or "{}"
      # Task is limited to 100 KB by taskqueue, data should be extracted
      # from BackgroundTask object.
      _enqueue_task(
          name=bg_task_name,
          url=url,
          method=method,
          payload=payload,
          bg_task=bg_task,
          queued_callback=queued_callback,
          queue=queue,
          retry_options=retry_options)
    return bg_task


def _check_and_create_bg_operation(operation_type, parameters):
  """Check if there is running BackgroundOperation, if not create it"""
  parent_type, parent_id = None, None
  if isinstance(parameters, dict):
    parent_type = parameters.get("parent", {}).get("type")
    parent_id = parameters.get("parent", {}).get("id")
  if not (parent_type and parent_id):
    raise ValueError("parameters should contain parent.id and parent.type "
                     "if operation_type specified")
  if bg_operation_running(operation_type, parent_type, parent_id):
    raise exceptions.BadRequest(
        "Task '{}' already run for {} {}.".format(
            operation_type, parent_type, parent_id
        )
    )
  return create_bg_operation(operation_type, parent_type, parent_id)


def _create_bg_task(name, parameters=None, payload=None, bg_operation=None):
  """Create BackgroundTasks object"""
  parameters = parameters or dict()
  bg_task = BackgroundTask(
      name=name,
      bg_operation=bg_operation,
      parameters=parameters,
      payload=payload,
      modified_by=_bg_task_user(),
      status=BackgroundTask.PENDING_STATUS,
  )
  db.session.add(bg_task)
  return bg_task


def _bg_task_user():
  """Returns user for background task creation
  In case of log in request of new user without assigning Creator role
  get_current_user() returns Anonymous and function change it to Migrator"""
  current_user = get_current_user()
  if not current_user or (hasattr(current_user, "is_anonymous") and
                          current_user.is_anonymous()):
    from ggrc.models import Person
    _, email = parseaddr(settings.MIGRATOR)
    return Person.query.filter_by(email=email).first()
  return current_user


# pylint: disable=too-many-arguments
def _enqueue_task(name, url, bg_task=None, queued_callback=None,
                  parameters=None, method="POST", payload=None,
                  queue=DEFAULT_QUEUE, retry_options=None):
  """Create task in queue if running in AppEngine,
  otherwise execute queued_callback() """
  parameters = parameters or dict()
  retry_options = retry_options or RETRY_OPTIONS
  if getattr(settings, "APP_ENGINE", False):
    from google.appengine.api import taskqueue
    headers = collect_task_headers()
    if bg_task:
      headers.add("X-Task-Name", bg_task.name)
    try:
      task = taskqueue.Task(
          url=url,
          name=name,
          params=parameters,
          payload=payload,
          method=method,
          headers=headers,
          retry_options=taskqueue.TaskRetryOptions(**retry_options))
      queue_task = taskqueue.Queue(queue).add_async(task)
    except taskqueue.Error as error:
      logger.warning(error)
      if bg_task:
        bg_task.status = "Failure"
    if not getattr(settings, "CLOUD_APPSERVER", False):
      # On local SDK development appserver we need to wait result to
      # enqueue task. In Google Cloud async adding tasks works properly.
      queue_task.get_result()
  elif queued_callback:
    if bg_task:
      queued_callback(bg_task)
    else:
      queued_callback(**parameters)
  else:
    raise ValueError("Either queued_callback should be provided "
                     "or APP_ENGINE set to true.")


def create_bg_operation(operation_type, object_type, object_id):
  """Create background task operation instance."""
  bg_operation = None
  if operation_type:
    from ggrc import models
    bg_operation_type = models.BackgroundOperationType.query.filter_by(
        name=operation_type
    ).first()

    if bg_operation_type and object_type and object_id:
      bg_operation = models.BackgroundOperation(
          object_type=object_type,
          object_id=object_id,
          bg_operation_type=bg_operation_type,
          modified_by=_bg_task_user()
      )
  return bg_operation


def bg_operation_running(operation_type, object_type, object_id):
  """Check if there is a background task in running state related to object."""
  from ggrc import models
  bg_task = models.BackgroundTask
  bg_operation = models.BackgroundOperation
  bg_type = models.BackgroundOperationType
  tasks = bg_task.query.join(
      bg_operation,
      bg_operation.bg_task_id == bg_task.id
  ).join(
      bg_type,
      bg_type.id == bg_operation.bg_operation_type_id
  ).filter(
      bg_operation.object_type == object_type,
      bg_operation.object_id == object_id,
      bg_type.name == operation_type,
      bg_task.status.in_(("Pending", "Running")),
  )
  return db.session.query(tasks.exists()).scalar()


def queued_task(func):
  """Decorator for task queues."""
  from ggrc.app import app

  @wraps(func)
  def decorated_view(*args, **_):
    """Background task runner.

    This runner makes sure that the task is called with the task model as
    the parameter.
    """
    if args and isinstance(args[0], BackgroundTask):
      task = args[0]
    else:
      task_name = request.headers.get("X-Task-Name")
      task = BackgroundTask.query.filter_by(name=task_name).first()
    if not task:
      return app.make_response(('BackgroundTask not found. Retry later.',
                                503,
                                [('Content-Type', 'text/html')]))
    try:
      task.start()
      result = func(task)
    except:  # pylint: disable=bare-except
      # Bare except is allowed here so that we can respond with the correct
      # message to all exceptions.
      logger.exception("Task failed")
      task.finish("Failure", app.make_response((
          traceback.format_exc(), 200, [('Content-Type', 'text/html')])))

      # Return 200 so that the task is not retried
      return app.make_response((
          'failure', 200, [('Content-Type', 'text/html')]))
    task.finish("Success", result)
    result.status_code = 200
    return result
  return decorated_view


def reindex_on_commit():
  """Decide to reindex changed objects synchronously on commit
  or in background indexing task

  Adding indexing background task doesn't make sense
  if request already running in background
  """
  return running_in_background()


def running_in_background():
  """Check that current request is running in background task"""
  value = False
  try:
    if request.path.startswith("/_background_tasks/"):
      value = True  # running in BackgroundTask
  except RuntimeError:
    value = True  # running not in flask(possibly in deferred task)
  return value
