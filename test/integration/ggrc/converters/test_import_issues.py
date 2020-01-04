# Copyright (C) 2020 Google Inc.
# Licensed under http://www.apache.org/licenses/LICENSE-2.0 <see LICENSE file>

# pylint: disable=maybe-no-member, invalid-name

"""Test Issue import and updates."""
from collections import OrderedDict

import ddt

from ggrc import models
from ggrc.converters import errors

from integration.ggrc.models import factories
from integration.ggrc import TestCase


@ddt.ddt
class TestImportIssues(TestCase):
  """Basic Issue import tests."""

  def setUp(self):
    """Set up for Issue test cases."""
    super(TestImportIssues, self).setUp()
    self.client.get("/login")

  def test_basic_issue_import(self):
    """Test basic issue import."""
    audit = factories.AuditFactory()
    for i in range(2):
      response = self.import_data(OrderedDict([
          ("object_type", "Issue"),
          ("Code*", ""),
          ("Title*", "Test issue {}".format(i)),
          ("Admin*", "user@example.com"),
          ("map:Audit", audit.slug),
          ("Due Date*", "2016-10-24T15:35:37")
      ]))
      self._check_csv_response(response, {})

    for issue in models.Issue.query:
      self.assertIsNotNone(
          models.Relationship.find_related(issue, audit),
          "Could not find relationship between: {} and {}".format(
              issue.slug, audit.slug)
      )

  def test_issue_due_date_import(self):
    """Test issue due date import."""
    test_due_date = "15/06/2018"
    response = self.import_data(OrderedDict([
        ("object_type", "Issue"),
        ("Code*", ""),
        ("Title*", "Test issue due_date"),
        ("Admin*", "user@example.com"),
        ("Due Date", test_due_date),
    ]))
    self._check_csv_response(response, {})
    issue = models.all_models.Issue.query.first()
    due_date = issue.due_date.strftime("%d/%m/%Y")
    self.assertEqual(due_date, test_due_date)

  def test_audit_change(self):
    """Test audit changing"""
    with factories.single_commit():
      audit = factories.AuditFactory()
      issue = factories.IssueFactory()

    response = self.import_data(OrderedDict([
        ("object_type", "Issue"),
        ("Code*", issue.slug),
        ("map:Audit", audit.slug),
    ]))
    self._check_csv_response(response, {})
    another_audit = factories.AuditFactory()

    response = self.import_data(OrderedDict([
        ("object_type", "Issue"),
        ("Code*", issue.slug),
        ("map:Audit", another_audit.slug),
    ]))
    self._check_csv_response(response, {
        "Issue": {
            "row_warnings": {
                errors.SINGLE_AUDIT_RESTRICTION.format(
                    line=3, mapped_type="Audit", object_type="Issue",
                )
            }
        }
    })

  @ddt.data(
      ("Deprecated", "Deprecated", 0),
      ("Fixed", "Deprecated", 1),
      ("Deprecated", "Fixed", 0),
  )
  @ddt.unpack
  def test_issue_deprecate_change(self, start_state, final_state, dep_count):
    """Test counter on changing state to deprecate"""
    with factories.single_commit():
      factories.AuditFactory()
      issue = factories.IssueFactory(status=start_state)

    response = self.import_data(OrderedDict([
        ("object_type", "Issue"),
        ("Code*", issue.slug),
        ("State", final_state),
    ]))
    self._check_csv_response(response, {})
    self.assertEqual(dep_count, response[0]['deprecated'])
    self.assertEqual(final_state, models.Issue.query.get(issue.id).status)

  def test_issue_state_import(self):
    """Test import of issue state."""
    audit = factories.AuditFactory()
    statuses = ["Fixed", "Fixed and Verified"]
    imported_data = []
    for i in range(2):
      imported_data.append(OrderedDict([
          ("object_type", "Issue"),
          ("Code*", ""),
          ("Title*", "Test issue {}".format(i)),
          ("Admin*", "user@example.com"),
          ("map:Audit", audit.slug),
          ("State", statuses[i]),
          ("Due Date*", "2016-10-24T15:35:37"),
      ]))

    response = self.import_data(*imported_data)
    self._check_csv_response(response, {})
    db_statuses = [i.status for i in models.Issue.query.all()]
    self.assertEqual(statuses, db_statuses)

  def test_import_issue_with_snapshot(self):
    """Test checks impossibility to map snapshot to issue via import"""
    with factories.single_commit():
      program = factories.ProgramFactory()
      control = factories.ControlFactory()
      factories.RelationshipFactory(source=program, destination=control)

    response = self.import_data(OrderedDict([
        ("object_type", "Audit"),
        ("Code*", ""),
        ("Title", "New Audit"),
        ("State", "Planned"),
        ("Audit Captains", "user@example.com"),
        ("Program", program.slug),
        ("map:control versions", control.slug),
    ]))
    self._check_csv_response(response, {})

    test_due_date = "15/06/2018"
    audit = models.Audit.query.first()
    response = self.import_data(OrderedDict([
        ("object_type", "Issue"),
        ("Code*", ""),
        ("Title*", "Test issue due_date"),
        ("Admin*", "user@example.com"),
        ("Due Date", test_due_date),
        ("map:Audit", audit.slug),
        ("map:control versions", control.slug),
    ]))
    expected_errors = {
        "Issue": {
            "row_warnings": {
                errors.ISSUE_SNAPSHOT_MAP_WARNING.format(
                    line=3, column_name=control.__class__.__name__
                ),
            }
        }
    }
    self._check_csv_response(response, expected_errors)
