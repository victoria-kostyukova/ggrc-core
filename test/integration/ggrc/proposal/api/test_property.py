# Copyright (C) 2020 Google Inc.
# Licensed under http://www.apache.org/licenses/LICENSE-2.0 <see LICENSE file>

"""TestCase for proposal property api."""

import datetime

import ddt

from ggrc.models import all_models

from integration.ggrc.models import factories
from integration.ggrc.proposal.api import base


@ddt.ddt
class TestPropoertyProposals(base.BaseTestProposalApi):
  """Test case for proposal property api."""

  def test_simple_get_proposal(self):
    """Test simple get proposal."""
    with factories.single_commit():
      program = factories.ProgramFactory()
      proposal = factories.ProposalFactory(instance=program,
                                           content={"field": "a"},
                                           agenda="agenda content")
    instance_dict = {"id": program.id, "type": program.type}
    resp = self.api.get(all_models.Proposal, proposal.id)
    self.assert200(resp)
    self.assertIn("proposal", resp.json)
    data = resp.json["proposal"]
    self.assertIn("content", data)
    self.assertIn("instance", data)
    self.assertIn("agenda", data)
    self.assertDictEqual(instance_dict, data["instance"])
    self.assertDictEqual({"field": "a"}, data["content"])
    self.assertEqual("agenda content", data["agenda"])

  def test_simple_create_proposal(self):
    """Test simple create proposal."""
    new_recipients = "Program Managers,Program Editors"
    program = factories.ProgramFactory()
    program_id = program.id
    program.recipients = new_recipients
    self.assertEqual(0, len(program.comments))
    self.create_proposal(program,
                         full_instance_content=program.log_json(),
                         agenda="update title from 1 to 2",
                         context=None)
    program = all_models.Program.query.get(program_id)
    self.assertEqual(1, len(program.proposals))
    self.assertIn("fields", program.proposals[0].content)
    self.assertEqual({"recipients": new_recipients},
                     program.proposals[0].content["fields"])
    self.assertEqual(1, len(program.comments))

  def test_simple_apply_status(self):
    """Test simple apply status."""
    with factories.single_commit():
      program = factories.ProgramFactory(title="1")
      proposal = factories.ProposalFactory(
          instance=program,
          content={"fields": {"title": "2"}},
          agenda="agenda content")
    program_id = program.id
    proposal_id = proposal.id
    self.assertEqual(proposal.STATES.PROPOSED, proposal.status)
    self.assertEqual(0, len(program.comments))
    with self.number_obj_revisions_for(program):
      self.apply_proposal(proposal, apply_reason="approved")
    program = all_models.Program.query.get(program_id)
    proposal = all_models.Proposal.query.get(proposal_id)

    self.assertEqual(proposal.STATES.APPLIED, proposal.status)
    self.assertEqual("2", program.title)
    self.assertEqual("2", self.latest_revision_for(program).content['title'])
    self.assertEqual(1, len(program.comments))

  def test_simple_decline_status(self):
    """Test simple decline status."""
    with factories.single_commit():
      program = factories.ProgramFactory(title="1")
      proposal = factories.ProposalFactory(
          instance=program,
          content={"fields": {"title": "2"}},
          agenda="agenda content")
    program_id = program.id
    proposal_id = proposal.id
    self.assertEqual(proposal.STATES.PROPOSED, proposal.status)
    self.assertEqual(0, len(program.comments))
    with self.number_obj_revisions_for(program, increase_on=0):
      self.decline_proposal(proposal, decline_reason="declined bla")
    program = all_models.Program.query.get(program_id)
    proposal = all_models.Proposal.query.get(proposal_id)
    self.assertEqual(proposal.STATES.DECLINED, proposal.status)
    self.assertEqual("1", program.title)
    self.assertEqual(1, len(program.comments))

  @ddt.data(
      ("title", "new title"),
      ("description", "new description"),
      ("notes", "new note"),
      ("status", "Active"),
  )
  @ddt.unpack
  def test_update_field(self, field_name, value):
    """Test that fields are changeable"""
    program = factories.ProgramFactory()
    proposal = factories.ProposalFactory(
        instance=program,
        content={"fields": {field_name: value}},
        agenda="agenda content"
    )
    program_id = program.id
    self.apply_proposal(proposal)
    program = all_models.Program.query.get(program_id)
    self.assertEqual(value, getattr(program, field_name))

  @ddt.data(
      ("start_date", "2019-02-02"),
  )
  @ddt.unpack
  def test_update_dates(self, field_name, value):
    """Test that date fields are changeable"""
    program = factories.ProgramFactory()
    proposal = factories.ProposalFactory(
        instance=program,
        content={"fields": {field_name: value}},
        agenda="agenda content"
    )
    program_id = program.id
    self.apply_proposal(proposal)
    program = all_models.Program.query.get(program_id)
    self.assertEqual(datetime.datetime.strptime(value, "%Y-%m-%d").date(),
                     getattr(program, field_name))
