# Copyright (C) 2020 Google Inc.
# Licensed under http://www.apache.org/licenses/LICENSE-2.0 <see LICENSE file>

"""ImportExport health check handlers."""
from logging import getLogger

import sqlalchemy as sa

from googleapiclient import errors

from ggrc import db
from ggrc.cloud_api import task_queue
from ggrc.models import all_models
from ggrc.notifications import job_emails

ACTIVE_IE_STATUSES = (
    all_models.ImportExport.ANALYSIS_STATUS,
    all_models.ImportExport.IN_PROGRESS_STATUS
)
IMPORT_EXPORT_OPERATIONS = ("import", "export",)
IMPORT_QUEUE = "ggrcImport"

logger = getLogger(__name__)


def check_import_export_jobs():
  """Check if import/export jobs are still run and correct status if not."""
  logger.info("Check running import/export jobs.")
  try:
    active_ie_task_names = task_queue.get_app_engine_tasks(IMPORT_QUEUE)
  except errors.HttpError as err:
    logger.error("Failed to collect active cloud tasks. Error: %s.", err)
    return

  for ie_job, bg_task in get_import_export_tasks():
    if bg_task.name not in active_ie_task_names:
      logger.info(
          "Task '%s' wasn't found in %s queue. It will be stopped.",
          bg_task.name,
          IMPORT_QUEUE,
      )
      bg_task.finish("Failure", {})
      ie_job.status = all_models.ImportExport.FAILED_STATUS
      notify_user(ie_job)
  db.session.plain_commit()
  logger.info("Finish import/export jobs health check.")


def get_import_export_tasks():
  """Get list of active import_export objects and related bg tasks."""
  bg_task = all_models.BackgroundTask
  bg_operation = all_models.BackgroundOperation
  bg_type = all_models.BackgroundOperationType
  import_export = all_models.ImportExport
  return db.session.query(import_export, bg_task).join(
      bg_operation,
      bg_operation.object_id == import_export.id
  ).join(
      bg_task,
      bg_task.id == bg_operation.bg_task_id
  ).join(
      bg_type,
      bg_type.id == bg_operation.bg_operation_type_id
  ).filter(
      bg_operation.object_type == "ImportExport",
      bg_type.name.in_(IMPORT_EXPORT_OPERATIONS),
      import_export.status.in_(ACTIVE_IE_STATUSES),
      bg_task.status == bg_task.RUNNING_STATUS
  ).options(
      sa.orm.Load(bg_task).undefer_group(
          "BackgroundTask_complete"
      ),
      sa.orm.Load(import_export).joinedload(
          "created_by"
      ).load_only(
          "email"
      )
  )


def notify_user(ie_job):
  """Send notification about crashed import/export."""
  logger.info(
      "Send notification to '%s' about failed %s.",
      ie_job.created_by.email,
      ie_job.job_type,
  )
  if ie_job.job_type == all_models.ImportExport.IMPORT_JOB_TYPE:
    job_emails.send_email(
        job_emails.IMPORT_FAILED,
        ie_job.created_by.email,
        ie_job.title
    )
  else:
    job_emails.send_email(job_emails.EXPORT_CRASHED, ie_job.created_by.email)
