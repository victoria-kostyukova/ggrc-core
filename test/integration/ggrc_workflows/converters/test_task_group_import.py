# Copyright (C) 2018 Google Inc.
# Licensed under http://www.apache.org/licenses/LICENSE-2.0 <see LICENSE file>
"""Tests for TaskGroup import."""

import datetime
import collections

import ddt

from ggrc import db
from ggrc.converters import errors
from ggrc.models import all_models
from ggrc_risks.models import risk, threat
from ggrc_workflows import models
from integration.ggrc.models import factories
from integration.ggrc_workflows.helpers import workflow_test_case
from integration.ggrc_workflows.models import factories as wf_factories


@ddt.ddt
class TestTaskGroupImport(workflow_test_case.WorkflowTestCase):
  """Tests related to TaskGroup import."""

  @ddt.data(
      (all_models.OrgGroup.__name__, True),
      (all_models.Vendor.__name__, True),
      (all_models.AccessGroup.__name__, True),
      (all_models.System.__name__, True),
      (all_models.Process.__name__, True),
      (all_models.DataAsset.__name__, True),
      (all_models.Product.__name__, True),
      (all_models.Project.__name__, True),
      (all_models.Facility.__name__, True),
      (all_models.Market.__name__, True),
      (all_models.Program.__name__, True),
      (all_models.Regulation.__name__, True),
      (all_models.Policy.__name__, True),
      (all_models.Standard.__name__, True),
      (all_models.Contract.__name__, True),
      (all_models.Requirement.__name__, True),
      (all_models.Control.__name__, True),
      (all_models.Objective.__name__, True),
      (all_models.Issue.__name__, True),
      (risk.Risk.__name__, True),
      (threat.Threat.__name__, True),
      (all_models.Assessment.__name__, False),
      (all_models.Audit.__name__, False),
      (all_models.Metric.__name__, True),
      (all_models.ProductGroup.__name__, True),
      (all_models.TechnologyEnvironment.__name__, True),
  )
  @ddt.unpack
  def test_task_group_import_objects(self, model_name, is_mapped):
    """"Test import TaskGroup with mapping to object: {0}"""
    wf_slug = "WORKFLOW-1"
    tg_slug = "TASKGROUP-1"
    mapped_slug = "MAPPEDOBJECT-1"
    with factories.single_commit():
      factories.get_model_factory(model_name)(slug=mapped_slug)
      workflow = wf_factories.WorkflowFactory(slug=wf_slug)
      wf_factories.TaskGroupFactory(slug=tg_slug, workflow=workflow)

    tg_data = collections.OrderedDict([
        ("object_type", all_models.TaskGroup.__name__),
        ("code", tg_slug),
        ("workflow", wf_slug),
        ("objects", "{}: {}".format(model_name, mapped_slug))
    ])
    result = self.import_data(tg_data)
    task_group = all_models.TaskGroup.query.one()
    if is_mapped:
      self.assertEqual(len(task_group.task_group_objects), 1)
      self.assertEqual(task_group.task_group_objects[0].object.slug,
                       mapped_slug)
      self.assertEqual(len(result[0]['row_warnings']), 0)
    else:
      self.assertEqual(len(task_group.task_group_objects), 0)
      self.assertEqual(len(result[0]['row_warnings']), 1)
      self.assertEqual(
          result[0]['row_warnings'][0],
          errors.INVALID_TASKGROUP_MAPPING_WARNING.format(
              line=3, object_class=model_name
          )
      )


@ddt.ddt
class TestTaskGroupTaskImport(workflow_test_case.WorkflowTestCase):
  """Tests related to TaskGroupTask import."""

  def setUp(self):
    super(TestTaskGroupTaskImport, self).setUp()
    self.person = factories.PersonFactory()
    self.workflow = wf_factories.WorkflowFactory(repeat_every=7,
                                                 unit=models.Workflow.DAY_UNIT)
    self.task_group = wf_factories.TaskGroupFactory(workflow=self.workflow)

  @ddt.data((datetime.date(2018, 7, 13), datetime.date(2018, 7, 21),
             {u"Line 3: Task Due Date can not occur on weekends."}),
            (datetime.date(2018, 7, 14), datetime.date(2018, 7, 20),
             {u"Line 3: Task Start Date can not occur on weekends."}),
            (datetime.date(2018, 7, 14), datetime.date(2018, 7, 21),
             {u"Line 3: Task Due Date can not occur on weekends.",
              u"Line 3: Task Start Date can not occur on weekends."})
            )
  @ddt.unpack
  def test_task_group_task_weekend(self, start_date, end_date,
                                   expected_errors):
    """Test TaskGroupTask import can't start/end on weekends"""

    tgt_data = collections.OrderedDict([
        ("object_type", "Task Group Task"),
        ("code", "TASKGROUPTASK-1"),
        ("task type", "Rich Text"),
        ("task group", self.task_group.slug),
        ("summary", "Task group test task 1"),
        ("start date", start_date),
        ("end date", end_date),
        ("task assignees", self.person.email),
    ])

    object_count_before_import = all_models.TaskGroupTask.query.count()
    response = self.import_data(tgt_data)

    expected_messages = {
        "Task Group Task": {
            "row_errors": expected_errors,
        }
    }

    object_count_after_import = all_models.TaskGroupTask.query.count()
    self._check_csv_response(response, expected_messages)
    self.assertEqual(object_count_before_import, object_count_after_import)

  @ddt.data((datetime.date(2018, 7, 10), datetime.date(2018, 7, 21),
             {u"Line 3: Task Due Date can not occur on weekends."}),
            (datetime.date(2018, 7, 14), datetime.date(2018, 7, 17),
             {u"Line 3: Task Start Date can not occur on weekends."}),
            (datetime.date(2018, 7, 14), datetime.date(2018, 7, 21),
             {u"Line 3: Task Due Date can not occur on weekends.",
              u"Line 3: Task Start Date can not occur on weekends."})
            )
  @ddt.unpack
  def test_import_change_task_date(self, start_date, end_date,
                                   expected_errors):
    """Test import can't change start/end from weekdays to weekends"""

    wf_factories.TaskGroupTaskFactory(
        task_group=self.task_group,
        start_date=datetime.date(2018, 7, 10),
        end_date=datetime.date(2018, 7, 17),
    )

    task_group_task_before = db.session.query(models.TaskGroupTask).one()

    start_date_before = task_group_task_before.start_date
    end_date_before = task_group_task_before.end_date

    tgt_import_data = collections.OrderedDict([
        ("object_type", "Task Group Task"),
        ("code", task_group_task_before.slug),
        ("task type", "Rich Text"),
        ("task group", self.task_group.slug),
        ("summary", "Task group test task 1"),
        ("start date", start_date),
        ("end date", end_date),
        ("task assignees", self.person.email),
    ])

    response = self.import_data(tgt_import_data)

    task_group_task_after = db.session.query(models.TaskGroupTask).one()

    start_date_after = task_group_task_after.start_date
    end_date_after = task_group_task_after.end_date

    expected_messages = {
        "Task Group Task": {
            "row_errors": expected_errors,
        }
    }

    self._check_csv_response(response, expected_messages)
    self.assertEquals(start_date_before, start_date_after)
    self.assertEquals(end_date_before, end_date_after)
