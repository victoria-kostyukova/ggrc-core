# Copyright (C) 2020 Google Inc.
# Licensed under http://www.apache.org/licenses/LICENSE-2.0 <see LICENSE file>

"""Test Import Special Objects"""
import collections

from ggrc.models import Audit
from ggrc.models import Program
from ggrc.models import Person
from ggrc.models import all_models
from integration.ggrc import TestCase
from integration.ggrc.models import factories


class TestSpecialObjects(TestCase):

  """
  testing object with special columns such as workflows, audits, requirements

  """

  def setUp(self):
    super(TestSpecialObjects, self).setUp()
    self.client.get("/login")
    factories.PersonFactory(email="user1@example.com", name="user1")
    factories.PersonFactory(email="user2@example.com", name="user2")
    factories.PersonFactory(email="user11@example.com",
                            name="user11")
    factories.PersonFactory(email="user12@example.com",
                            name="user12")

  def test_audit_imports(self):
    """ this tests if the audit gets imported with a mapped program """

    # with factories.single_commit():
    program1 = factories.ProgramFactory(title="prog-1")
    audit_data = [
        collections.OrderedDict([
            ("object_type", "Audit"),
            ("Code*", ""),
            ("Program", program1.slug),
            ("Title", "Aud-1"),
            ("State", "Planned"),
            ("Audit Captains", "user1@example.com"),
            ("Auditors", "user2@example.com"),
        ]),
    ]

    response = self.import_data(*audit_data)
    self._check_csv_response(response, {})
    self.assertEqual(1, Audit.query.count())
    audit = Audit.query.filter(Audit.title == "Aud-1").first()
    self.assertEqual(audit.program_id, program1.id)

  def test_program_roles_imports(self):
    """ this tests program roles via imports """
    program_import = [
        collections.OrderedDict([
            ("object_type", "Program"),
            ("Code*", ""),
            ("Title*", "prog-1"),
            ("Program Managers", "user1@example.com\nuser11@example.com"),
            ("Program Editors", "user11@example.com"),
            ("Program Readers", "user12@example.com"),
        ])
    ]
    response = self.import_data(*program_import)
    self._check_csv_response(response, {})
    program1 = Program.query.filter(Program.title == "prog-1").first()
    self.assertEqual(1, Program.query.count())
    p1_acls = all_models.AccessControlList.query.filter(
        all_models.AccessControlList.object_id == program1.id,
        all_models.AccessControlList.object_type == "Program").all()

    # 2 Program Managers, 1 Primary Contact, 1 Secondary Contact,
    # 1 Program Editors, 1 Program Readers
    self.assertEqual(5, len(p1_acls))
    manager_ids = [acp.person_id
                   for acl in p1_acls
                   for acp in acl.access_control_people
                   if acl.ac_role.name == "Program Managers"]
    editor_ids = [acp.person_id
                  for acl in p1_acls
                  for acp in acl.access_control_people
                  if acl.ac_role.name == "Program Editors"]
    reader_ids = [acp.person_id
                  for acl in p1_acls
                  for acp in acl.access_control_people
                  if acl.ac_role.name == "Program Readers"]
    manager_emails = [p.email for p in
                      Person.query.filter(Person.id.in_(manager_ids)).all()]
    editor_emails = [p.email for p in
                     Person.query.filter(Person.id.in_(editor_ids)).all()]
    reader_emails = [p.email for p in
                     Person.query.filter(Person.id.in_(reader_ids)).all()]
    expected_owners = set(["user1@example.com", "user11@example.com"])
    expected_editors = set(["user11@example.com"])
    expected_readers = set(["user12@example.com"])
    self.assertEqual(set(manager_emails), expected_owners)
    self.assertEqual(set(editor_emails), expected_editors)
    self.assertEqual(set(reader_emails), expected_readers)
