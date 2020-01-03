# Copyright (C) 2020 Google Inc.
# Licensed under http://www.apache.org/licenses/LICENSE-2.0 <see LICENSE file>

"""Integration tests for log_json method."""

from types import NoneType
import ddt

from ggrc.models import all_models
from integration.ggrc import TestCase
from integration.ggrc.models import factories


SET_ALL_MODELS = set(all_models.all_models)
SET_MODELS_TO_EXCLUDE = {all_models.AttributeDefinitions,
                         all_models.AttributeTemplates,
                         all_models.AttributeTypes,
                         all_models.Attributes,
                         all_models.Namespaces,
                         all_models.ObjectTemplates,
                         all_models.ObjectTypes,
                         all_models.ImportExport,
                         all_models.Maintenance,
                         all_models.Automapping,
                         all_models.Revision,
                         all_models.ExternalMapping
                         }
SET_MODELS_WITH_LOG_JSON_METHOD = (SET_ALL_MODELS -
                                   SET_MODELS_TO_EXCLUDE)


@ddt.ddt
class TestLogJson(TestCase):
  """Test checks log_json method."""

  ATTRS_TO_EXCLUDE = "modified_by"
  ERROR_MESSAGE = "Model {} has problem with field {}, " \
                  "after calling log_json, it == {}"

  @staticmethod
  def _prepare_create_param(person, list_attr):
    """Method builds params for creating model."""
    create_param = {}
    for attr in list_attr:
      create_param[attr] = person
    return create_param

  def _check_json_representation(self, keys_attr, json_representation, model):
    """Result of calling log_json should not contain Person instance."""
    for item in keys_attr:
      if item in json_representation and item != self.ATTRS_TO_EXCLUDE:
        self.assertTrue(
            isinstance(json_representation[item], (dict, NoneType)),
            msg=self.ERROR_MESSAGE
            .format(model.__name__, item, json_representation[item])
        )

  @staticmethod
  def _get_person_type_attrs(model):
    """Get all model's person type attrs."""
    result = []
    for attr in dir(model):
      if (attr.endswith("_by") and not attr[0].isupper() and attr[0] != '_'):
        result.append(attr)
    return result

  @ddt.data(*SET_MODELS_WITH_LOG_JSON_METHOD)
  def test_person_type_log_json(self, model):
    """Test checks work of log_json method for person type attrs."""
    creator_email = "creator@example.com"
    creator = factories.PersonFactory(email=creator_email)
    person_type_attrs = self._get_person_type_attrs(model)
    attr_dict = self._prepare_create_param(creator, person_type_attrs)
    json_representation = model(**attr_dict).log_json()
    self._check_json_representation(
        person_type_attrs, json_representation, model
    )
