# Copyright (C) 2020 Google Inc.
# Licensed under http://www.apache.org/licenses/LICENSE-2.0 <see LICENSE file>

"""Integration tests for WithLastComment logic."""

from collections import defaultdict

import collections

from google.appengine.ext import deferred

from ggrc import db
from ggrc.fulltext import mysql
from ggrc.models import all_models

from integration.ggrc import TestCase, generator
from integration.ggrc.api_helper import Api
from integration.ggrc.query_helper import WithQueryApi
from integration.ggrc.models import factories
from integration.ggrc_workflows.models import factories as wf_factories


class TestWithLastCommentAssessment(TestCase, WithQueryApi):
  """
      Integration test suite for WithLastComment functionality
      for Assessments.
  """

  def setUp(self):
    super(TestWithLastCommentAssessment, self).setUp()
    self.client.get("/login")
    self.api = Api()
    self.gen = generator.ObjectGenerator()

    self.asmnt_comments = defaultdict(dict)
    with factories.single_commit():
      for _ in range(3):
        asmnt = factories.AssessmentFactory()
        for _ in range(3):
          comment = factories.CommentFactory(
              description=factories.random_str()
          )
          self.asmnt_comments[asmnt.id][comment.id] = comment.description
          factories.RelationshipFactory(source=asmnt, destination=comment)

    query = all_models.Revision.query.filter_by(resource_type="Comment")
    revision_ids = [revision.id for revision in query]
    self.api.send_request(
        self.api.client.post,
        api_link="/admin/compute_attributes",
        data={"revision_ids": revision_ids}
    )

  def test_last_comment_value(self):
    """Test assessment has proper value in last_comment field"""
    assessments = all_models.Assessment.query
    self.assertEqual(assessments.count(), len(self.asmnt_comments))
    for asmnt in assessments:
      last_comment_id = max(self.asmnt_comments[asmnt.id])
      self.assertEqual(
          asmnt.last_comment_id,
          last_comment_id
      )
      self.assertEqual(
          asmnt.last_comment,
          self.asmnt_comments[asmnt.id][last_comment_id]
      )

  def test_last_comment_filter(self):
    """Test filtration by last comment."""
    asmnt = all_models.Assessment.query.first()
    result = self._get_first_result_set(
        self._make_query_dict(
            "Assessment",
            expression=("Last Comment", "=", asmnt.last_comment),
            type_="ids",
        ),
        "Assessment",
    )
    self.assertEqual(result["count"], 1)
    self.assertEqual(result["ids"], [asmnt.id])

  def test_last_comment_order(self):
    """Test sorting by last comment."""
    result = self._get_first_result_set(
        self._make_query_dict(
            "Assessment",
            order_by=[{"name": "Last Comment"}],
            type_="ids"
        ),
        "Assessment",
        "ids",
    )
    asmnts = all_models.Assessment.query
    sorted_asmnts = sorted(asmnts, key=lambda k: k.last_comment)
    self.assertEqual(result, [i.id for i in sorted_asmnts])

  def test_export_last_comment(self):
    """Test export Last Comment for Assessments."""
    search_request = [{
        "object_name": "Assessment",
        "filters": {
            "expression": {},
        },
        "fields": "all",
    }]
    query = self.export_parsed_csv(search_request)["Assessment"]

    exported_comments = [asmnt["Last Comment"] for asmnt in query]
    db_comments = [a.last_comment for a in all_models.Assessment.query]
    self.assertEqual(exported_comments, db_comments)

  def test_import_last_comment(self):
    """Test Last Comment field read only on import Assessments."""
    audit = factories.AuditFactory()
    response = self.import_data(collections.OrderedDict([
        ("object_type", "Assessment"),
        ("Code*", ""),
        ("Audit", audit.slug),
        ("Assignees", "user@example.com"),
        ("Creators", "user@example.com"),
        ("Title", "Test title"),
        ("Last Comment", "some comment"),
    ]))
    self._check_csv_response(response, {})
    asmnt = all_models.Assessment.query.filter(
        all_models.Assessment.title == "Test title"
    ).first()
    self.assertEqual(asmnt.last_comment, None)

  def test_ca_create_on_import(self):
    """Test creating last_comment CA when comments imported"""
    audit = factories.AuditFactory()
    response = self.import_data(collections.OrderedDict([
        ("object_type", "Assessment"),
        ("Code*", ""),
        ("Audit", audit.slug),
        ("Assignees", "user@example.com"),
        ("Creators", "user@example.com"),
        ("Title", "Test title"),
        ("Comments", "new comment1;;new comment2;;new comment3"),
    ]))
    tasks = self.taskqueue_stub.get_filtered_tasks()
    deferred.run(tasks[0].payload)
    self._check_csv_response(response, {})
    asmnt = all_models.Assessment.query.filter_by(title="Test title").first()
    self.assertEqual(asmnt.last_comment, "new comment3")

  def test_ca_update_on_import(self):
    """Test updating of last_comment CA when comments imported"""
    asmnt_id = self.asmnt_comments.keys()[0]
    asmnt_slug = all_models.Assessment.query.get(asmnt_id).slug
    response = self.import_data(collections.OrderedDict([
        ("object_type", "Assessment"),
        ("Code*", asmnt_slug),
        ("Comments", "new comment1;;new comment2;;new comment3"),
    ]))
    tasks = self.taskqueue_stub.get_filtered_tasks()
    deferred.run(tasks[0].payload)
    self._check_csv_response(response, {})
    asmnt = all_models.Assessment.query.filter_by(slug=asmnt_slug).first()
    self.assertEqual(asmnt.last_comment, "new comment3")

  @staticmethod
  def get_model_fulltext(model_name, property, ids):
    """Get fulltext records for model."""
    # pylint: disable=redefined-builtin
    return db.session.query(mysql.MysqlRecordProperty).filter(
        mysql.MysqlRecordProperty.type == model_name,
        mysql.MysqlRecordProperty.property == property,
        mysql.MysqlRecordProperty.key.in_(ids),
    )

  def test_ca_cleanup_on_obj_delete(self):
    """Test cleaning of fulltext and attributes tables on obj delete"""
    asmnt_id = self.asmnt_comments.keys()[0]
    asmnt = all_models.Assessment.query.get(asmnt_id)
    last_comment_records = self.get_model_fulltext(
        "Assessment", "last_comment", [asmnt_id]
    )
    self.assertEqual(last_comment_records.count(), 1)
    last_comment_attrs = self.get_model_ca("Assessment", [asmnt_id])
    self.assertEqual(last_comment_attrs.count(), 1)

    response = self.api.delete(asmnt)
    self.assert200(response)

    last_comment_records = self.get_model_fulltext(
        "Assessment", "last_comment", [asmnt_id]
    )
    self.assertEqual(last_comment_records.count(), 0)
    last_comment_attrs = self.get_model_ca("Assessment", [asmnt_id])
    self.assertEqual(last_comment_attrs.count(), 0)

    # Check that other records weren't affected
    last_comment_records = self.get_model_fulltext(
        "Assessment", "last_comment", self.asmnt_comments.keys()
    )
    self.assertEqual(last_comment_records.count(), 2)
    last_comment_attrs = self.get_model_ca(
        "Assessment", self.asmnt_comments.keys()
    )
    self.assertEqual(last_comment_attrs.count(), 2)


class TestWithLastCommentCycleTask(TestCase, WithQueryApi):
  """
      Integration test suite for WithLastComment functionality
      for Cycle Tasks.
  """
  def setUp(self):
    super(TestWithLastCommentCycleTask, self).setUp()
    self.client.get("/login")
    self.api = Api()

  def compute_attributes(self):
    """Method for computed_attributes job"""
    query = all_models.Revision.query.filter_by(resource_type="Comment")
    revision_ids = [revision.id for revision in query]
    self.api.send_request(
        self.api.client.post,
        api_link="/admin/compute_attributes",
        data={"revision_ids": revision_ids}
    )

  @staticmethod
  def get_model_fulltext(model_name, property, ids):
    """Get fulltext records for model."""
    # pylint: disable=redefined-builtin
    return db.session.query(mysql.MysqlRecordProperty).filter(
        mysql.MysqlRecordProperty.type == model_name,
        mysql.MysqlRecordProperty.property == property,
        mysql.MysqlRecordProperty.key.in_(ids),
    )

  def test_last_comment_value(self):
    """Test proper value in last_comment field"""
    with factories.single_commit():
      c_task = wf_factories.CycleTaskGroupObjectTaskFactory()
      c_task_id = c_task.id
      comment_1 = factories.CommentFactory(description=factories.random_str())
      comment_2 = factories.CommentFactory(description=factories.random_str())
      comment_2_id = comment_2.id
      factories.RelationshipFactory(source=c_task, destination=comment_1)
      factories.RelationshipFactory(source=c_task, destination=comment_2)

    self.compute_attributes()
    comment_2 = all_models.Comment.query.get(comment_2_id)
    c_task = all_models.CycleTaskGroupObjectTask.query.get(c_task_id)

    self.assertEqual(c_task.last_comment, comment_2.description)

  def test_last_comment_filter(self):
    """Test filtration by last comment."""
    with factories.single_commit():
      for _ in range(2):
        c_task = wf_factories.CycleTaskGroupObjectTaskFactory()
        comment = factories.CommentFactory(
            description=factories.random_str()
        )
        factories.RelationshipFactory(source=c_task, destination=comment)

    self.compute_attributes()

    c_task = all_models.CycleTaskGroupObjectTask.query.first()
    result = self._get_first_result_set(
        self._make_query_dict(
            "CycleTaskGroupObjectTask",
            expression=("Last Comment", "=", c_task.last_comment),
            type_="ids",
        ),
        "CycleTaskGroupObjectTask",
    )

    self.assertEqual(result["count"], 1)
    self.assertEqual(result["ids"], [c_task.id])

  def test_ca_cleanup_on_obj_delete(self):
    """Test cleaning of fulltext and attributes tables on obj delete"""
    with factories.single_commit():
      for _ in range(2):
        c_task = wf_factories.CycleTaskGroupObjectTaskFactory()
        comment = factories.CommentFactory(
            description=factories.random_str()
        )
        factories.RelationshipFactory(source=c_task, destination=comment)

    self.compute_attributes()

    c_task = all_models.CycleTaskGroupObjectTask.query.first()

    last_comment_records = self.get_model_fulltext(
        "CycleTaskGroupObjectTask", "last_comment", [c_task.id]
    )
    last_comment_attrs = self.get_model_ca(
        "CycleTaskGroupObjectTask",
        [c_task.id]
    )
    self.assertEqual(last_comment_records.count(), 1)
    self.assertEqual(last_comment_attrs.count(), 1)

    response = self.api.delete(c_task)
    self.assert200(response)

    last_comment_records = self.get_model_fulltext(
        "CycleTaskGroupObjectTask", "last_comment", [c_task.id]
    )

    last_comment_attrs = self.get_model_ca(
        "CycleTaskGroupObjectTask",
        [c_task.id]
    )
    self.assertEqual(last_comment_attrs.count(), 0)
    self.assertEqual(last_comment_records.count(), 0)

    # Check that other records weren't affected
    task_ids = [task.id for task in
                all_models.CycleTaskGroupObjectTask.query.all()]

    last_comment_records = self.get_model_fulltext(
        "CycleTaskGroupObjectTask", "last_comment", task_ids
    )
    last_comment_attrs = self.get_model_ca(
        "CycleTaskGroupObjectTask",
        task_ids,
    )

    self.assertEqual(last_comment_records.count(), 1)
    self.assertEqual(last_comment_attrs.count(), 1)
