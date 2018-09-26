# Copyright (C) 2018 Google Inc.
# Licensed under http://www.apache.org/licenses/LICENSE-2.0 <see LICENSE file>

"""Test for acl proposal api."""

import collections

import ddt

from ggrc.models import all_models

from integration.ggrc.models import factories
from integration.ggrc.proposal.api import base


@ddt.ddt
class TestACLProposalsApi(base.BaseTestProposalApi):
  """Test case for proposal acl api."""

  def test_proposal_for_acl(self):
    """Test simple add acl proposal."""
    with factories.single_commit():
      control = factories.ControlFactory(title="1")
      role = factories.AccessControlRoleFactory(name="role",
                                                object_type=control.type,
                                                internal=False)
      person = factories.PersonFactory()
    control_id = control.id
    role_id = unicode(role.id)
    person_id = person.id
    control_content = control.log_json()
    control_content["access_control_list"] = [
        {"ac_role_id": role_id, "person": {"type": "Person", "id": person.id}}
    ]
    self.create_proposal(control,
                         full_instance_content=control_content,
                         agenda="update access control roles",
                         context=None)
    control = all_models.Control.query.get(control_id)
    self.assertEqual(1, len(control.proposals))
    self.assertIn("access_control_list", control.proposals[0].content)
    acl = control.proposals[0].content["access_control_list"]
    self.assertIn(role_id, acl)
    role = control.proposals[0].content["access_control_list"][role_id]
    person = all_models.Person.query.get(person_id)
    self.assertEqual(
        {
            "added": [{"id": person_id, "email": person.email}],
            "deleted": [],
        },
        role)
    self.assertEqual(1, len(control.comments))

  @ddt.data(
      {
          "roles": [True],  # iternal
          "deleted": [False],
      },
      {
          "roles": [False],  # iternal
          "deleted": [True],
      },
      {
          "roles": [True, False],  # iternal
          "deleted": [False, True],
      },
      {
          "roles": [False, True],  # iternal
          "deleted": [True, False],
      },
      {
          "roles": [True, True],  # iternal
          "deleted": [False, False],
      },
      {
          "roles": [False, False],  # iternal
          "deleted": [True, True],
      },
  )
  @ddt.unpack
  def test_proposal_delete_acl(self, roles, deleted):
    """Test delete acl proposal for ACRs with internal flags as {roles}."""
    role_person_list = []
    with factories.single_commit():
      control = factories.ControlFactory(title="1")
      for idx, role_internal_flag in enumerate(roles):
        role = factories.AccessControlRoleFactory(name="role_{}".format(idx),
                                                  object_type="Control",
                                                  internal=role_internal_flag)
        person = factories.PersonFactory()
        role_person_list.append((role, person))
        acl = factories.AccessControlListFactory(
            ac_role=role,
            object=control,
        )
        factories.AccessControlPersonFactory(
            ac_list=acl,
            person=person,
        )
    with factories.single_commit():
      latest_revision = all_models.Revision.query.filter(
          all_models.Revision.resource_id == control.id,
          all_models.Revision.resource_type == control.type
      ).order_by(
          all_models.Revision.created_at.desc()
      ).first()
      latest_revision.content = control.log_json()

    control_id = control.id
    control_content = control.log_json()
    control_content["access_control_list"] = []
    expected_result = {}
    for idx, (role, person) in enumerate(role_person_list):
      if deleted[idx]:
        expected_result[str(role.id)] = {
            "added": [],
            "deleted": [{"id": person.id, "email": person.email}],
        }
    resp = self.api.post(
        all_models.Proposal,
        {"proposal": {
            "instance": {
                "id": control.id,
                "type": control.type,
            },
            # "content": {"123": 123},
            "full_instance_content": control_content,
            "agenda": "delete access control roles",
            "context": None,
        }})
    self.assertEqual(201, resp.status_code)
    control = all_models.Control.query.get(control_id)
    self.assertEqual(1, len(control.proposals))
    self.assertIn("access_control_list", control.proposals[0].content)
    acl = control.proposals[0].content["access_control_list"]
    self.assertEqual(expected_result, acl)
    self.assertEqual(1, len(control.comments))

  def test_apply_acl(self):  # pylint: disable=too-many-locals
    """Test simple apply acl proposal."""
    with factories.single_commit():
      role_1 = factories.AccessControlRoleFactory(
          name="role_1", object_type="Control")
      role_2 = factories.AccessControlRoleFactory(
          name="role_2", object_type="Control")
      role_3 = factories.AccessControlRoleFactory(
          name="role_3", object_type="Control")
      role_4 = factories.AccessControlRoleFactory(
          name="role_4", object_type="Control")
      role_5 = factories.AccessControlRoleFactory(
          name="role_5", object_type="Control")
    with factories.single_commit():
      control = factories.ControlFactory(title="1")
      person_1 = factories.PersonFactory()
      person_2 = factories.PersonFactory()
      person_3 = factories.PersonFactory()
      acl_1 = control.acr_acl_map[role_1]
      acl_2 = control.acr_acl_map[role_2]
      acl_3 = control.acr_acl_map[role_3]
      acl_4 = control.acr_acl_map[role_4]
      factories.AccessControlPersonFactory(
          ac_list=acl_1,
          person=person_1,
      )
      factories.AccessControlPersonFactory(
          ac_list=acl_2,
          person=person_2,
      )
      factories.AccessControlPersonFactory(
          ac_list=acl_3,
          person=person_3,
      )
      for person in [person_1, person_2, person_3]:
        factories.AccessControlPersonFactory(
            ac_list=acl_4,
            person=person,
        )

    with factories.single_commit():
      proposal = factories.ProposalFactory(
          instance=control,
          content={
              "access_control_list": {
                  role_1.id: {
                      "added": [{"id": person_2.id, "email": person_2.email}],
                      "deleted": []
                  },
                  role_2.id: {
                      "added": [{"id": person_1.id, "email": person_1.email}],
                      "deleted": [{"id": person_2.id, "email": person_2.email}]
                  },
                  role_3.id: {
                      "added": [{"id": person_3.id, "email": person_3.email}],
                      "deleted": [{"id": person_2.id, "email": person_2.email}]
                  },
                  role_4.id: {
                      "added": [],
                      "deleted": [{"id": person_1.id, "email": person_1.email},
                                  {"id": person_2.id, "email": person_2.email},
                                  {"id": person_3.id, "email": person_3.email}]
                  },
                  role_5.id: {
                      "added": [{"id": person_1.id, "email": person_1.email},
                                {"id": person_2.id, "email": person_2.email},
                                {"id": person_3.id, "email": person_3.email}],
                      "deleted": [],
                  },
              }
          },
          agenda="agenda content")
    control_id = control.id
    person_1_id = person_1.id
    person_2_id = person_2.id
    person_3_id = person_3.id
    role_1_id = role_1.id
    role_2_id = role_2.id
    role_3_id = role_3.id
    role_4_id = role_4.id
    role_5_id = role_5.id
    self.assertEqual(proposal.STATES.PROPOSED, proposal.status)
    revisions = all_models.Revision.query.filter(
        all_models.Revision.resource_type == control.type,
        all_models.Revision.resource_id == control.id
    ).all()
    self.assertEqual(1, len(revisions))
    resp = self.api.put(
        proposal, {"proposal": {"status": proposal.STATES.APPLIED}})
    self.assert200(resp)
    control = all_models.Control.query.get(control_id)
    result_dict = collections.defaultdict(set)
    for person, acl in control.access_control_list:
      result_dict[acl.ac_role_id].add(person.id)
    self.assertEqual({person_1_id, person_2_id}, result_dict[role_1_id])
    self.assertEqual({person_1_id}, result_dict[role_2_id])
    self.assertEqual({person_3_id}, result_dict[role_3_id])
    self.assertEqual(set([]), result_dict[role_4_id])
    self.assertEqual({person_1_id, person_2_id, person_3_id},
                     result_dict[role_5_id])
