# Copyright (C) 2020 Google Inc.
# Licensed under http://www.apache.org/licenses/LICENSE-2.0 <see LICENSE file>

"""Test import of Audit and mapped objects."""

from collections import OrderedDict

from ggrc.models import all_models
from ggrc.converters import errors

from integration.ggrc import TestCase
from integration.ggrc.models import factories


class TestAuditImport(TestCase):
  """Audit import test class."""

  def setUp(self):
    """Set up for Audit test cases."""
    super(TestAuditImport, self).setUp()
    self.client.get("/login")

  def test_audit_import_db_lock(self):
    """Import 2 audits one of them with control"""
    with factories.single_commit():
      program = factories.ProgramFactory()
      control = factories.ControlFactory()
      factories.RelationshipFactory(source=program, destination=control)

    response = self.import_data(*[
        OrderedDict([
            ("object_type", "Audit"),
            ("Code", ""),
            ("Title", "Audit-import-2"),
            ("State", "In Progress"),
            ("Audit Captains", "user@example.com"),
            ("Program", program.slug),
            ("map:control versions", ""),
        ]),
        OrderedDict([
            ("object_type", "Audit"),
            ("Code", ""),
            ("Title", "Audit-import-3"),
            ("State", "Planned"),
            ("Audit Captains", "user@example.com"),
            ("Program", program.slug),
            ("map:control versions", control.slug),
        ])
    ])
    self.assertEquals(2, response[0]["created"])

  def test_update_audit_with_control(self):
    """Test import of existing Audit with mapped Control Snapshot."""
    with factories.single_commit():
      program = factories.ProgramFactory()
      audit = factories.AuditFactory(program=program)
      audit_id = audit.id
      control = factories.ControlFactory()
      factories.RelationshipFactory(source=program, destination=control)
      snapshot = self._create_snapshots(audit, [control])[0]
      factories.RelationshipFactory(source=audit, destination=snapshot)

    response = self.import_data(OrderedDict([
        ("object_type", "Audit"),
        ("Code*", audit.slug),
        ("Title", "New Title"),
        ("Audit Captains", "user@example.com"),
        ("Program", program.slug),
        ("map:control versions", control.slug),
    ]))
    self._check_csv_response(response, {})
    audit = all_models.Audit.query.get(audit_id)
    self.assertEqual(audit.title, "New Title")

  def test_create_audit_with_control(self):
    """Test import of new Audit with mapped Control Snapshot."""
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
    self.assertEqual(all_models.Audit.query.count(), 1)

  def test_audit_import_program_omit(self):
    """If program value for existing audit has changed ignore it"""
    with factories.single_commit():
      original_program = factories.ProgramFactory()
      original_program_slug = original_program.slug
      audit = factories.AuditFactory(program=original_program)
      new_program = factories.ProgramFactory()

    self.import_data(OrderedDict([
        ("object_type", "Audit"),
        ("Code", audit.slug),
        ("Title", audit.title),
        ("State", "In Progress"),
        ("Audit Captains", "user@example.com"),
        ("Program", new_program.slug),
        ("map:control versions", ""),
    ]))
    actual_program_slug = all_models.Audit.query.get(audit.id).program.slug
    self.assertEqual(actual_program_slug, original_program_slug)

  def test_audit_import_program_warn(self):
    """Test warning on import of existing audit with changed program"""
    with factories.single_commit():
      original_program = factories.ProgramFactory()
      audit = factories.AuditFactory(program=original_program)
      new_program = factories.ProgramFactory()

    response = self.import_data(OrderedDict([
        ("object_type", "Audit"),
        ("Code", audit.slug),
        ("Title", audit.title),
        ("State", "In Progress"),
        ("Audit Captains", "user@example.com"),
        ("Program", new_program.slug),
        ("map:control versions", ""),
    ]))

    expected_warnings = {
        'Audit': {
            'row_warnings': {
                errors.UNMODIFIABLE_COLUMN.format(
                    line=3,
                    column_name=original_program.type
                )
            },
        }
    }
    self._check_csv_response(response, expected_warnings)

  def test_invalid_audit_import(self):
    """Test audit import with invalid user"""
    with factories.single_commit():
      program = factories.ProgramFactory()

    response = self.import_data(*[
        OrderedDict([
            ("object_type", "Person"),
            ("Name", ""),
            ("Email", "bad@example.com"),
            ("Company", "Google"),
            ("Role", "Administrator"),
        ]),
        OrderedDict([
            ("object_type", "Audit"),
            ("Code", ""),
            ("Title", "Audit-import-3"),
            ("State", "Planned"),
            ("Audit Captains", "bad@example.com"),
            ("Program", program.slug),
        ])
    ])
    expected_messages = {
        "Audit": {
            "block_errors": {
                errors.UNKNOWN_ERROR.format(line=4),
            },
        },
        "Person": {
            "row_errors": {
                errors.MISSING_VALUE_ERROR.format(line=3, column_name="Name"),
            },
        },
    }
    self._check_csv_response(response, expected_messages)
