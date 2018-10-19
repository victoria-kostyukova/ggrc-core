# Copyright (C) 2018 Google Inc.
# Licensed under http://www.apache.org/licenses/LICENSE-2.0 <see LICENSE file>
"""Conversions from UI dicts to App entities."""
from lib.entities import app_entity_factory
from lib.utils import date_utils


def ui_to_app(obj_name, ui_dict):
  """Converts ui_dict to app_entity."""
  method_name = {
      "workflow": workflow_ui_to_app
  }[obj_name]
  return method_name(ui_dict)


def workflow_ui_to_app(ui_dict):
  """Converts Workflow ui_dict to app_entity."""
  return app_entity_factory.WorkflowFactory().create_empty(
      obj_id=ui_dict["obj_id"],
      title=ui_dict["title"],
      admins=emails_to_app_people(ui_dict["admins"]),
      wf_members=emails_to_app_people(ui_dict["workflow_members"]),
      task_groups=[],
      code=ui_dict["code"]
  )


def task_group_ui_to_app(ui_dict):
  """Converts TaskGroup ui dict to App entity."""
  return app_entity_factory.TaskGroupFactory().create_empty(
      title=ui_dict["title"],
      assignee=email_to_app_person(ui_dict["assignee"])
  )


def task_group_task_ui_to_app(ui_dict):
  """Converts TaskGroupTask ui dict to App entity."""
  return app_entity_factory.TaskGroupTaskFactory().create_empty(
      obj_id=ui_dict.get("obj_id"),
      title=ui_dict["title"],
      assignees=emails_to_app_people(ui_dict.get("assignees")),
      start_date=str_to_date(ui_dict["start_date"]),
      due_date=str_to_date(ui_dict["due_date"])
  )


def emails_to_app_people(emails):
  """Converts emails to app people."""
  return [email_to_app_person(email) for email in emails]


def email_to_app_person(email):
  """Converts email to app person."""
  return app_entity_factory.PersonFactory().create_empty(
      email=email)


def str_to_date(date_str):
  """Converts date string to the date object."""
  return date_utils.str_to_date(date_str, "%m/%d/%Y")
