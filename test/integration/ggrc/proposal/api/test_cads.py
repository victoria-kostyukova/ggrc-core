# Copyright (C) 2020 Google Inc.
# Licensed under http://www.apache.org/licenses/LICENSE-2.0 <see LICENSE file>

"""Test for proposal cav api."""

import ddt

from ggrc.models import all_models

from integration.ggrc.models import factories
from integration.ggrc.proposal.api import base


@ddt.ddt
class TestCADProposalsApi(base.BaseTestProposalApi):
  """Test for proposal cav api."""

  def test_change_cad(self):
    """Test create proposal with change CAVs."""
    with factories.single_commit():
      program = factories.ProgramFactory(title="1")
      cad = factories.CustomAttributeDefinitionFactory(
          definition_type="program")
      factories.CustomAttributeValueFactory(
          custom_attribute=cad,
          attributable=program,
          attribute_value="123")
    program_id = program.id
    cad_id = cad.id
    data = program.log_json()
    data["custom_attribute_values"][0]["attribute_value"] = "321"
    self.create_proposal(program,
                         full_instance_content=data,
                         agenda="update cav",
                         context=None)
    program = all_models.Program.query.get(program_id)
    self.assertEqual(1, len(program.proposals))
    self.assertIn("custom_attribute_values", program.proposals[0].content)
    self.assertEqual({unicode(cad_id): {"attribute_value": u"321",
                                        "attribute_object": None}},
                     program.proposals[0].content["custom_attribute_values"])
    self.assertEqual(1, len(program.comments))

  @ddt.data(
      ("1", "1", None),
      ("0", "0", None),
      ("1", "0", "0"),
      ("0", "1", "1"),
      (None, "0", None),
      (None, "1", "1"),
      ("1", True, None),
      ("0", False, None),
      ("1", False, "0"),
      ("0", True, "1"),
      (None, False, None),
      (None, True, "1"),
      ("1", 1, None),
      ("0", 0, None),
      ("1", 0, "0"),
      ("0", 1, "1"),
      (None, 0, None),
      (None, 1, "1"),
  )
  @ddt.unpack
  def test_change_checkbox(self, start_value, sent_value, expected_value):
    """Proposal for Checkbox CAVs if start value is {0} and sent is {1}."""
    checkbox_type = all_models.CustomAttributeDefinition.ValidTypes.CHECKBOX
    with factories.single_commit():
      program = factories.ProgramFactory(title="1")
      cad = factories.CustomAttributeDefinitionFactory(
          definition_type="program",
          attribute_type=checkbox_type,
      )
      if start_value is not None:
        factories.CustomAttributeValueFactory(
            custom_attribute=cad,
            attributable=program,
            attribute_value=start_value)

    program_id = program.id
    cad_id = cad.id
    data = program.log_json()
    data["custom_attribute_values"] = [{
        "custom_attribute_id": cad_id,
        "attribute_value": sent_value,
        "attribute_object": None
    }]
    self.create_proposal(program,
                         full_instance_content=data,
                         agenda="update cav",
                         context=None)
    program = all_models.Program.query.get(program_id)
    self.assertEqual(1, len(program.proposals))
    self.assertIn("custom_attribute_values", program.proposals[0].content)
    if expected_value is None:
      self.assertFalse(program.proposals[0].content["custom_attribute_values"])
    else:
      self.assertEqual({unicode(cad_id): {"attribute_value": expected_value,
                                          "attribute_object": None}},
                       program.proposals[0].content["custom_attribute_values"])
    self.assertEqual(1, len(program.comments))

  def test_apply_cad(self):
    """Test apply proposal with change CAVs."""
    with factories.single_commit():
      program = factories.ProgramFactory(title="1")
      cad = factories.CustomAttributeDefinitionFactory(
          definition_type="program")
    program_id = program.id
    proposal = factories.ProposalFactory(
        instance=program,
        content={
            "custom_attribute_values": {
                cad.id: {
                    "attribute_value": "321",
                    "attribute_object": None,
                },
            },
        },
        agenda="agenda content")
    with self.number_obj_revisions_for(program):
      self.apply_proposal(proposal)
    program = all_models.Program.query.get(program_id)
    self.assertEqual(
        "321",
        program.custom_attribute_values[0].attribute_value)

  def test_apply_mapping_cad(self):
    """Test apply mapping CAVs proposal."""
    with factories.single_commit():
      program = factories.ProgramFactory(title="1")
      cad = factories.CustomAttributeDefinitionFactory(
          definition_type="program",
          attribute_type="Text"
      )
      cav = factories.CustomAttributeValueFactory(
          custom_attribute=cad,
          attributable=program,
          attribute_value="Person",
      )
    self.assertEqual("Person",
                     program.custom_attribute_values[0].attribute_value)
    program_id = program.id
    proposal = factories.ProposalFactory(
        instance=program,
        content={
            "custom_attribute_values": {
                cad.id: {
                    "attribute_value": "Person123",
                    "attribute_object": None,
                },
            },
        },
        agenda="agenda content")
    with self.number_obj_revisions_for(program):
      self.apply_proposal(proposal)
    program = all_models.Program.query.get(program_id)
    cav = program.custom_attribute_values[0]
    self.assertEqual("Person123", cav.attribute_value)
