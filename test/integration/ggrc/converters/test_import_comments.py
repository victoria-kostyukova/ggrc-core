# Copyright (C) 2020 Google Inc.
# Licensed under http://www.apache.org/licenses/LICENSE-2.0 <see LICENSE file>

"""Tests import of comments."""

import collections

import ddt

from integration.ggrc import TestCase
from integration.ggrc import api_helper
from integration.ggrc.models import factories
from ggrc.models import Assessment, Comment


@ddt.ddt
class TestCommentsImport(TestCase):
  """Test comments import"""

  def setUp(self):
    """Log in before performing queries."""
    super(TestCommentsImport, self).setUp()
    self.client.get("/login")

  @ddt.data(("Assessment 1", ["comment", "new_comment1", "new_comment2"]),
            ("Assessment 2", ["some comment"]),
            ("Assessment 3", ["<a href=\"goooge.com\">link</a>"]),
            ("Assessment 4", ["comment1", "comment2", "comment3"]),
            ("Assessment 5", ["one;two", "three;", "four", "hello"]),
            ("Assessment 6", ["a normal comment with {} characters"]))
  @ddt.unpack
  def test_assessment_comments(self, title, expected_comments):
    """Test assessment comments import"""
    audit = factories.AuditFactory()
    audit_slug = audit.slug
    self.import_data(collections.OrderedDict([
        ("object_type", "Assessment"),
        ("Code*", ""),
        ("Title", title),
        ("Audit", audit_slug),
        ("Assignees", "user@example.com"),
        ("Creators", "user@example.com"),
        ("comments", ";;".join(expected_comments))
    ]))

    assmt = Assessment.query.filter_by(title=title).first()
    comments = [comment.description for comment in assmt.comments]
    self.assertEqual(comments, expected_comments)
    for comment in assmt.comments:
      assignee_roles = comment.assignee_type
      self.assertIn("Assignees", assignee_roles)
      self.assertIn("Creators", assignee_roles)

  # pylint: disable=invalid-name
  def test_assessment_comments_without_assignee_roles(self):
    """Test import of assessment comments, without assignee roles"""
    audit = factories.AuditFactory()
    audit_slug = audit.slug
    title = "Assessment 1"
    self.import_data(collections.OrderedDict([
        ("object_type", "Assessment"),
        ("Code*", ""),
        ("Title", title),
        ("Audit", audit_slug),
        ("Assignees", "user@example.com"),
        ("Creators", "user@example.com"),
        ("comments", "comment1")
    ]))

    assmt = Assessment.query.filter_by(title=title).first()
    assmt_slug = assmt.slug
    new_comments = ["new_comment1", "new_comment2"]

    self.import_data(collections.OrderedDict([
        ("object_type", "Assessment"),
        ("Code*", assmt_slug),
        ("comments", ";;".join(new_comments))
    ]))

    expected_comments = ["comment1", "new_comment1", "new_comment2"]
    assmt = Assessment.query.filter_by(title=title).first()
    comments = [comment.description for comment in assmt.comments]
    self.assertEqual(comments, expected_comments)
    for comment in assmt.comments:
      assignee_roles = comment.assignee_type
      self.assertIn("Assignees", assignee_roles)
      self.assertIn("Creators", assignee_roles)


class TestLCACommentsImport(TestCase):
  """Test import LCA comments"""

  def setUp(self):
    """Set up audit and cad for test cases."""
    super(TestLCACommentsImport, self).setUp()
    self.api = api_helper.Api()
    with factories.single_commit():
      self.audit = factories.AuditFactory()
      self.asmt = factories.AssessmentFactory(
          audit=self.audit,
          context=self.audit.context,
          status="In Progress",
      )
      factories.RelationshipFactory(
          source=self.audit,
          destination=self.asmt,
      )

  def test_custom_comment_import(self):
    """Test success import LCA comment for Dropdown CAD"""
    with factories.single_commit():
      cad = factories.CustomAttributeDefinitionFactory(
          attribute_type="Dropdown",
          definition_type="assessment",
          definition_id=self.asmt.id,
          multi_choice_options="comment_required",
          multi_choice_mandatory="1,2,3",
          mandatory=True,
      )
      factories.CustomAttributeValueFactory(
          custom_attribute=cad,
          attributable=self.asmt,
          attribute_value="comment_required",
      )
    self.assertEqual(self.asmt.status, "In Progress")
    response = self.import_data(collections.OrderedDict([
        ("object_type", "LCA Comment"),
        ("description", "test description"),
        ("custom_attribute_definition", cad.id),
    ]))
    self._check_csv_response(response, {})
    response = self.api.put(self.asmt, {
        "status": "Completed",
    })
    self.assertEqual(response.status_code, 200)
    new_comment = Comment.query.first()
    self.assertEqual(new_comment.description, "test description")
    self.assertEqual(new_comment.custom_attribute_definition_id, cad.id)
