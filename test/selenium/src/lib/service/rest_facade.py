# Copyright (C) 2018 Google Inc.
# Licensed under http://www.apache.org/licenses/LICENSE-2.0 <see LICENSE file>
"""A facade for RestService.
Reasons for a facade:
* It is not very convenient to use
* More high level functions are often needed
"""
from lib import factory
from lib.constants import roles
from lib.entities import entities_factory
from lib.entities.entity import Representation
from lib.service import rest_service


def create_program(**attrs):
  """Create a program"""
  return rest_service.ProgramsService().create_obj(factory_params=attrs)


def create_objective(program=None, **attrs):
  """Create an objective (optionally map to a `program`)."""
  return _create_obj_in_program_scope("Objectives", program, **attrs)


def create_control(program=None, **attrs):
  """Create a control (optionally map to a `program`)"""
  return _create_obj_in_program_scope("Controls", program, **attrs)


def create_audit(program, **attrs):
  """Create an audit within a `program`"""
  return rest_service.AuditsService().create_obj(
      program=program.__dict__,
      factory_params=attrs)


def create_asmt(audit, **attrs):
  """Create an assessment within an audit `audit`"""
  attrs["audit"] = audit.__dict__
  return rest_service.AssessmentsService().create_obj(factory_params=attrs)


def create_asmt_template(audit, **attrs):
  """Create assessment template."""
  obj_attrs, cad_attrs = _split_attrs(
      attrs, ["cad_type", "dropdown_types_list"])
  if "cad_type" in cad_attrs:
    cads = [entities_factory.AssessmentTemplatesFactory.generate_cad(
        **cad_attrs)]
    obj_attrs["custom_attribute_definitions"] = cads
  obj_attrs["audit"] = audit.__dict__
  return rest_service.AssessmentTemplatesService().create_obj(
      factory_params=obj_attrs)


def create_asmt_from_template(audit, asmt_template, obj_to_map):
  """Create an assessment from template"""
  snapshots = [Representation.convert_repr_to_snapshot(
      objs=obj_to_map, parent_obj=audit)]
  return rest_service.AssessmentsFromTemplateService().create_assessments(
      audit=audit, template=asmt_template, snapshots=snapshots
  )[0]


def create_gcad(**attrs):
  """Creates global CADs for all types."""
  return rest_service.CustomAttributeDefinitionsService().create_obj(
      factory_params=attrs)


def create_issue(program=None):
  """Create a issue (optionally map to a `program`)"""
  issue = rest_service.IssuesService().create_obj()
  if program:
    map_objs(program, issue)
  return issue


def create_user():
  """Create a user"""
  return rest_service.PeopleService().create_obj()


def create_user_with_role(role_name):
  """Create user a role `role_name`"""
  user = create_user()
  role = next(role for role in roles.global_roles()
              if role["name"] == role_name)
  rest_service.UserRolesService().create_obj(person=user.__dict__, role=role)
  user.system_wide_role = role["name"]
  return user


def create_access_control_role(**attrs):
  """Create a ACL role."""
  return rest_service.AccessControlRolesService().create_acl_role(**attrs)


def map_objs(src_obj, dest_obj):
  """Map two objects to each other"""
  rest_service.RelationshipsService().map_objs(
      src_obj=src_obj, dest_objs=dest_obj)


def get_obj(obj):
  """Get an object"""
  return rest_service.ObjectsInfoService().get_obj(obj)


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


def _create_obj_in_program_scope(obj_name, program, **attrs):
  """Create an object with `attrs`.
  Optionally map this object to program.
  """
  factory_params, attrs_remainder = _split_attrs(attrs, ["program"])
  obj = factory.get_cls_rest_service(object_name=obj_name)().create_obj(
      factory_params=factory_params, **attrs_remainder)
  if program:
    map_objs(program, obj)
  return obj


def _split_attrs(attrs, second_part_keys=None):
  """Split `attrs` dictionary into two parts:
  * Dict with keys that are not in `second_part_keys`
  * Remainder dict with keys in `second_part_keys`
  """
  dict_1 = {k: v for k, v in attrs.iteritems() if k not in second_part_keys}
  dict_2 = {k: v for k, v in attrs.iteritems() if k in second_part_keys}
  return dict_1, dict_2
