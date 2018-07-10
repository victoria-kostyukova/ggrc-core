# Copyright (C) 2018 Google Inc.
# Licensed under http://www.apache.org/licenses/LICENSE-2.0 <see LICENSE file>
"""A facade for RestService.
Reasons for a facade:
* It is not very convenient to use
* More high level functions are often needed
"""
from lib.constants.element import AdminWidgetCustomAttributes
from lib.entities.entities_factory import CustomAttributeDefinitionsFactory
from lib.entities.entity import Representation
from lib.service import rest_service
from lib.utils.string_utils import StringMethods


def create_program():
  """Create a program"""
  return rest_service.ProgramsService().create_objs(count=1)[0]


def create_objective(program=None):
  """Create an objecive (optionally map to a `program`)."""
  objective = rest_service.ObjectivesService().create_objs(count=1)[0]
  if program:
    map_objs(program, objective)
  return objective


def create_control(program=None):
  """Create a control (optionally map to a `program`)"""
  control = rest_service.ControlsService().create_objs(count=1)[0]
  if program:
    map_objs(program, control)
  return control


def create_audit(program):
  """Create an audit within a `program`"""
  return rest_service.AuditsService().create_objs(
      count=1, program=program.__dict__)[0]


def create_asmt_template(audit, **attrs):
  """Create assessment template."""
  attrs["audit"] = audit.__dict__
  return rest_service.AssessmentTemplatesService().create_objs(
      count=1, **attrs)[0]


def create_asmt_template_w_dropdown(audit, dropdown_types_list):
  """Create assessment template with dropdown custom attribute."""
  multi_choice_mandatory = {"file": "2", "url": "4", "comment": "1",
                            "file_url": "6", "url_comment": "5",
                            "file_comment": "3", "file_url_comment": "7",
                            "nothing": "0"}
  ca_definitions_factory = CustomAttributeDefinitionsFactory()
  custom_attribute_definitions = [ca_definitions_factory.create(
      title=(ca_definitions_factory.generate_ca_title(
          AdminWidgetCustomAttributes.DROPDOWN)),
      attribute_type=AdminWidgetCustomAttributes.DROPDOWN,
      definition_type=AdminWidgetCustomAttributes.DROPDOWN,
      multi_choice_mandatory=(",".join(
          multi_choice_mandatory[dropdown_type]
          for dropdown_type in dropdown_types_list)),
      multi_choice_options=(
          StringMethods.random_list_strings(
              list_len=len(dropdown_types_list))))]
  custom_attribute_definitions = (ca_definitions_factory.
                                  generate_ca_defenitions_for_asmt_tmpls(
                                      custom_attribute_definitions))
  return create_asmt_template(
      audit, custom_attribute_definitions=custom_attribute_definitions)


def create_asmt_from_template_rest(
    audit, control, asmt_template
):
  """Create new Assessment based on Assessment Template via REST API.
  Return: lib.entities.entity.AssessmentEntity
  """
  control_snapshots = [Representation.convert_repr_to_snapshot(
      objs=control, parent_obj=audit)]
  assessments_service = rest_service.AssessmentsFromTemplateService()
  assessments = assessments_service.create_assessments(
      audit=audit,
      template=asmt_template,
      control_snapshots=control_snapshots
  )
  return assessments[0]


def create_assessment(audit, **attrs):
  """Create an assessment within an audit `audit`"""
  attrs["audit"] = audit.__dict__
  return rest_service.AssessmentsService().create_objs(
      count=1, **attrs)[0]


def create_assessment_template(audit, **attrs):
  """Create an assessment template"""
  attrs["audit"] = audit.__dict__
  return rest_service.AssessmentTemplatesService().create_objs(
      count=1, **attrs)[0]


def create_assessment_from_template(audit, template, **attrs):
  """Create an assessment from template"""
  return rest_service.AssessmentsFromTemplateService().create_assessments(
      audit=audit, template=template, **attrs)[0]


def create_issue(program=None):
  """Create a issue (optionally map to a `program`)"""
  issue = rest_service.IssuesService().create_objs(count=1)[0]
  if program:
    map_objs(program, issue)
  return issue


def map_objs(src_obj, dest_obj):
  """Map two objects to each other"""
  rest_service.RelationshipsService().map_objs(
      src_obj=src_obj, dest_objs=dest_obj)


def get_snapshot(obj, parent_obj):
  """Get (or create) a snapshot of `obj` in `parent_obj`"""
  return rest_service.ObjectsInfoService().get_snapshoted_obj(
      origin_obj=obj, paren_obj=parent_obj)


def map_to_snapshot(src_obj, obj, parent_obj):
  """Create a snapshot of `obj` in `parent_obj`.
  Then map `src_obj` to this snapshot.
  """
  snapshot = get_snapshot(obj, parent_obj)
  map_objs(src_obj, snapshot)
