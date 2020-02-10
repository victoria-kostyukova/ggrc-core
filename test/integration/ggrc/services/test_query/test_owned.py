# Copyright (C) 2020 Google Inc.
# Licensed under http://www.apache.org/licenses/LICENSE-2.0 <see LICENSE file>

"""Tests for owned operator."""

import ddt

from integration.ggrc import TestCase
from integration.ggrc.query_helper import WithQueryApi
from integration.ggrc.models import factories


@ddt.ddt
class TestOwned(TestCase, WithQueryApi):
  """Test for correct working operator owned"""

  def setUp(self):
    super(TestOwned, self).setUp()
    self.client.get("/login")
    with factories.single_commit():
      self.person = factories.PersonFactory()
      self.control = factories.ControlFactory()

  @ddt.data(
      ((True, True), True),
      ((True, False), True),
      ((False, True), True),
      ((False, False), False),
  )
  @ddt.unpack
  def test_acl_people(self, my_work_flags, should_return):
    """Owned returns objects where person has role with my_work set."""
    with factories.single_commit():
      for my_work in my_work_flags:
        role = factories.AccessControlRoleFactory(object_type="Control",
                                                  my_work=my_work)
        acl = factories.AccessControlListFactory(
            ac_role=role,
            object=self.control,
        )
        factories.AccessControlPersonFactory(
            ac_list=acl,
            person=self.person,
        )

    control_id = self.control.id

    ids = self._get_first_result_set(
        {
            "object_name": "Control",
            "type": "ids",
            "filters": {
                "expression": {
                    "object_name": "Person",
                    "op": {"name": "owned"},
                    "ids": [self.person.id]
                }
            }
        },
        "Control", "ids"
    )

    if should_return:
      self.assertEqual(ids, [control_id])
    else:
      self.assertEqual(ids, [])

  def test_audit_count(self):
    """Test for Audit counts in My Work panel.

    For current user should return Audits where user is owner and
    Audits that have user-owned Assessments.
    Actual test - create 2 audits with different persons as Audit Captains,
    For second audits create asmnt with user1 as creator.
    Should return both audits for user1 as owner."""

    with factories.single_commit():
      another_person = factories.PersonFactory()
      audit_ids = []
      audit1 = factories.AuditFactory()
      audit1.add_person_with_role_name(self.person, "Audit Captains")
      audit_ids.append(audit1.id)
      audit2 = factories.AuditFactory()
      audit2.add_person_with_role_name(another_person, "Audit Captains")
      audit_ids.append(audit2.id)

      asmnt = factories.AssessmentFactory(audit=audit2)
      asmnt.add_person_with_role_name(self.person, "Creators")

    ids = self._get_first_result_set(
        {
            "object_name": "Audit",
            "type": "ids",
            "filters": {
                "expression": {
                    "object_name": "Person",
                    "op": {"name": "owned"},
                    "ids": [self.person.id]
                }
            }
        },
        "Audit", "ids"
    )
    self.assertEqual(ids, audit_ids)
