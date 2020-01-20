# Copyright (C) 2020 Google Inc.
# Licensed under http://www.apache.org/licenses/LICENSE-2.0 <see LICENSE file>

"""Test audit RBAC"""

from collections import defaultdict
import ddt

from integration.ggrc import TestCase
from integration.ggrc.api_helper import Api
import integration.ggrc.generator
from integration.ggrc.access_control import acl_helper
from ggrc import db
from ggrc.models import all_models, get_model
from ggrc.snapshotter.rules import Types


DEFAULT_PERMISSIONS = defaultdict(lambda: 200)
DEFAULT_LACK_OF_PERMISSIONS = {
    "Snapshot": 403,
    "Audit": 403
}
DEFAULT_AUDITOR_PERMISSIONS = {
    "Snapshot": 200,
    "Audit": 403
}


@ddt.ddt
class TestAuditRBAC(TestCase):
  """Test audit RBAC"""
  # pylint: disable=too-many-instance-attributes

  def setUp(self):
    """Imports test_csvs/audit_rbac_snapshot_create.csv needed by the tests"""
    TestCase.clear_data()
    self.api = Api()
    self.objgen = integration.ggrc.generator.ObjectGenerator()

  def create_audit(self, audit_role, userid):
    """Create default audit for audit snapshot RBAC tests"""
    is_auditor = False
    if audit_role == "Auditors":
      is_auditor = True
      auditor_role = all_models.AccessControlRole.query.filter(
          all_models.AccessControlRole.name == "Auditors"
      ).one()

    program = db.session.query(all_models.Program).get(self.program_id)
    _, audit = self.objgen.generate_object(all_models.Audit, {
        "title": "Snapshotable audit",
        "program": {"id": self.program_id},
        "status": "Planned",
        "snapshots": {
            "operation": "create",
        },
        "access_control_list": [
            acl_helper.get_acl_json(auditor_role.id, userid)
        ] if is_auditor else None,
        "context": {
            "type": "Context",
            "id": program.context_id,
            "href": "/api/contexts/{}".format(program.context_id)
        }
    })
    return audit

  def create_program(self, program_role, userid):
    """Create default program for audit snapshot RBAC tests"""
    if program_role and program_role != "Auditors":
      program_role = all_models.AccessControlRole.query.filter(
          all_models.AccessControlRole.name == program_role
      ).one()
    else:
      program_role = None

    _, program = self.objgen.generate_object(all_models.Program, {
        "title": "test program",
        "access_control_list": [
            acl_helper.get_acl_json(program_role.id, userid)
        ] if program_role else None
    })

    for model_type in Types.all - Types.external:
      model = get_model(model_type)
      _, model_object = self.objgen.generate_object(model, {
          "title": "Test Snapshot - {}".format(model_type),
      })
      self.objgen.generate_relationship(program, model_object)

    return program

  def update_audit(self):
    """Update default audit"""
    for model_type in Types.all - Types.external:
      model = get_model(model_type)
      obj = model.query.filter_by(
          title="Test Snapshot - {}".format(model_type)).first()
      self.api.modify_object(obj, {
          "title": "Test Snapshot - {} EDIT".format(model_type)
      })

    audit = all_models.Audit.query.filter(
        all_models.Audit.title == "Snapshotable audit"
    ).one()

    self.api.modify_object(audit, {
        "snapshots": {
            "operation": "upsert"
        }
    })

  def read(self, objects):
    """Attempt to do a GET request for every object in the objects list"""
    responses = []
    for obj in objects:
      status_code = self.api.get(obj.__class__, obj.id).status_code
      responses.append((obj.type, status_code))
    return responses

  def update(self, objects):
    """Attempt to do a PUT request for every object in the objects list"""
    scope_response = self.api.get(all_models.Audit, self.audit_id)
    if scope_response.status_code == 200:
      self.update_audit()

    responses = []
    for obj in objects:
      response = self.api.get(obj.__class__, obj.id)
      status_code = response.status_code
      if response.status_code == 200:
        data = response.json
        if obj.type == "Snapshot":
          data.update({
              "update_revision": "latest"
          })
        put_call = self.api.put(obj, data)
        status_code = put_call.status_code
      responses.append((obj.type, status_code))
    return responses

  # pylint: disable=attribute-defined-outside-init
  @ddt.data(
      ("Administrator", "", DEFAULT_PERMISSIONS),
      ("Creator", "", DEFAULT_LACK_OF_PERMISSIONS),
      ("Reader", "", DEFAULT_PERMISSIONS),
      ("Editor", "", DEFAULT_PERMISSIONS),
      ("Administrator", "Program Managers", DEFAULT_PERMISSIONS),
      ("Creator", "Program Managers", DEFAULT_PERMISSIONS),
      ("Reader", "Program Managers", DEFAULT_PERMISSIONS),
      ("Editor", "Program Managers", DEFAULT_PERMISSIONS),
      ("Administrator", "Program Editors", DEFAULT_PERMISSIONS),
      ("Creator", "Program Editors", DEFAULT_PERMISSIONS),
      ("Reader", "Program Editors", DEFAULT_PERMISSIONS),
      ("Editor", "Program Editors", DEFAULT_PERMISSIONS),
      ("Administrator", "Program Readers", DEFAULT_PERMISSIONS),
      ("Creator", "Program Readers", DEFAULT_PERMISSIONS),
      ("Reader", "Program Readers", DEFAULT_PERMISSIONS),
      ("Editor", "Program Readers", DEFAULT_PERMISSIONS),
      ("Administrator", "Auditors", DEFAULT_PERMISSIONS),
      ("Creator", "Auditors", DEFAULT_PERMISSIONS),
      ("Reader", "Auditors", DEFAULT_PERMISSIONS),
      ("Editor", "Auditors", DEFAULT_PERMISSIONS),
  )
  @ddt.unpack
  def test_read_access_on_mapped(self, rolename, object_role, expected_status):
    """Test if {0} with {1} role, has READ access to
       snapshotted objects of default audit"""

    user = self.create_user_with_role(rolename)
    user_id = user.id

    program = self.create_program(object_role, user_id)
    self.program_id = program.id

    audit = self.create_audit(object_role, user_id)

    snapshots = all_models.Snapshot.eager_query().all()

    objects = snapshots + [audit]

    user = all_models.Person.query.get(user_id)
    self.api.set_user(user)

    responses = self.read(objects)
    all_errors = []
    for type_, code in responses:
      if code != expected_status[type_]:
        all_errors.append("{} does not have read access to {} ({})".format(
            user.email, type_, code))
    assert not all_errors, "\n".join(all_errors)

  # pylint: disable=attribute-defined-outside-init
  @ddt.data(
      ("Administrator", "", DEFAULT_PERMISSIONS),
      ("Creator", "", DEFAULT_LACK_OF_PERMISSIONS),
      ("Reader", "", DEFAULT_LACK_OF_PERMISSIONS),
      ("Editor", "", DEFAULT_PERMISSIONS),
      ("Administrator", "Program Managers", DEFAULT_PERMISSIONS),
      ("Creator", "Program Managers", DEFAULT_PERMISSIONS),
      ("Reader", "Program Managers", DEFAULT_PERMISSIONS),
      ("Editor", "Program Managers", DEFAULT_PERMISSIONS),
      ("Administrator", "Program Editors", DEFAULT_PERMISSIONS),
      ("Creator", "Program Editors", DEFAULT_PERMISSIONS),
      ("Reader", "Program Editors", DEFAULT_PERMISSIONS),
      ("Editor", "Program Editors", DEFAULT_PERMISSIONS),
      ("Administrator", "Program Readers", DEFAULT_PERMISSIONS),
      ("Creator", "Program Readers", DEFAULT_LACK_OF_PERMISSIONS),
      ("Reader", "Program Readers", DEFAULT_LACK_OF_PERMISSIONS),
      ("Editor", "Program Readers", DEFAULT_PERMISSIONS),
      ("Administrator", "Auditors", DEFAULT_PERMISSIONS),
      ("Creator", "Auditors", DEFAULT_AUDITOR_PERMISSIONS),
      ("Reader", "Auditors", DEFAULT_AUDITOR_PERMISSIONS),
      ("Editor", "Auditors", DEFAULT_PERMISSIONS),
  )
  @ddt.unpack
  def test_update_access_on_mapped(self, rolename,
                                   object_role, expected_status):
    """Test if {0} with {1} role, has UPDATE access to
       snapshotted objects of default audit"""

    user = self.create_user_with_role(rolename)
    user_id = user.id

    program = self.create_program(object_role, user_id)
    self.program_id = program.id

    audit = self.create_audit(object_role, user_id)
    self.audit_id = audit.id

    snapshots = all_models.Snapshot.eager_query().all()

    objects = snapshots + [audit]

    user = all_models.Person.query.get(user_id)
    self.api.set_user(user)

    responses = self.update(objects)
    all_errors = []
    for type_, code in responses:
      if code != expected_status[type_]:
        all_errors.append("{} does not have update access to {} ({})".format(
            user.email, type_, code))
    assert not all_errors, "\n".join(all_errors)
