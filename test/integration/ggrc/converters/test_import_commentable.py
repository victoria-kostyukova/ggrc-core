# Copyright (C) 2018 Google Inc.
# Licensed under http://www.apache.org/licenses/LICENSE-2.0 <see LICENSE file>

# pylint: disable=maybe-no-member, invalid-name

"""Test import of commentable fields."""

from collections import OrderedDict

from ggrc.models import all_models
from ggrc.models import inflector
from ggrc.models import mixins
from integration.ggrc import TestCase
from integration.ggrc.models import factories

COMMENTABLE_MODELS = [
    all_models.Control,
    all_models.Objective,
    all_models.Requirement,
    all_models.Issue,
    all_models.Policy,
    all_models.Regulation,
    all_models.Standard,
    all_models.Contract,
    all_models.Risk,
    all_models.Threat,
    all_models.AccessGroup,
    all_models.DataAsset,
    all_models.Facility,
    all_models.Market,
    all_models.Metric,
    all_models.OrgGroup,
    all_models.Process,
    all_models.Product,
    all_models.ProductGroup,
    all_models.Project,
    all_models.System,
    all_models.TechnologyEnvironment,
    all_models.Vendor,
]

COMMENTABLE_MODELS_NAMES = [m.__name__ for m in COMMENTABLE_MODELS]

RECIPIENTS_MAPPING = dict((m.__name__, m.VALID_RECIPIENTS)
                          for m in COMMENTABLE_MODELS)


class TestCommentableImport(TestCase):
  """Class with tests of importing fields of Commentable mixin"""

  def setUp(self):
    """Set up for Assessment test cases."""
    super(TestCommentableImport, self).setUp()
    self.client.get("/login")
    # Audit should be in db when data will be imported
    audit = factories.AuditFactory().slug
    with factories.single_commit():
      for model, recipients in RECIPIENTS_MAPPING.iteritems():
        self.import_model(model, audit, ",".join(recipients), True)

  def import_model(self, model_name, audit, recipients, send_by_default):
    """Import model data with commentable fields"""
    # pylint: disable=protected-access
    import_data = [
        ("object_type", model_name),
        ("Code", "{}-1".format(model_name)),
        ("Title", "{}-Title".format(model_name)),
        ("Admin", "user@example.com"),
        ("Recipients", recipients),
        ("Send by default", send_by_default),
    ]
    model_cls = inflector.get_model(model_name)
    if issubclass(model_cls, mixins.ScopeObject):
      import_data.append(("Assignee", "user@example.com"))
      import_data.append(("Verifier", "user@example.com"))
    if model_name == "Control":
      import_data.append(("Assertions*", "Privacy"))
    if issubclass(model_cls, mixins.audit_relationship.AuditRelationship):
      import_data.append(("Map:Audit", audit))
    if (issubclass(model_cls, mixins.Described) and
       "description" not in model_cls._aliases) or model_name == "Risk":
      import_data.append(("description", "{}-Description".format(model_name)))
    if model_name == "Risk":
      import_data.append(("Risk Type", "Risk type text"))
    response = self.import_data(OrderedDict(import_data))
    self._check_csv_response(response, {})

  def test_commentable_import(self):
    """Test import of recipients and send_by_default fields"""
    for model_name, recipients in RECIPIENTS_MAPPING.iteritems():
      model_cls = inflector.get_model(model_name)
      obj = model_cls.query.first()
      self.assertEqual(sorted(obj.recipients.split(",")),
                       sorted(recipients))
      self.assertEqual(obj.send_by_default, True)
