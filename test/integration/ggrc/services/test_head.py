# Copyright (C) 2020 Google Inc.
# Licensed under http://www.apache.org/licenses/LICENSE-2.0 <see LICENSE file>

"""
Test HEAD request
"""
import ddt

from ggrc import utils
from ggrc.models import all_models
from ggrc.services import common
from integration.ggrc import TestCase
from integration.ggrc.api_helper import Api
from integration.ggrc.models import factories


@ddt.ddt
class TestHeadRequest(TestCase):
  """Test HEAD request."""

  def setUp(self):
    super(TestHeadRequest, self).setUp()
    self.api = Api()

  @ddt.data(
      all_models.Control,
      all_models.Objective,
      all_models.Audit,
      all_models.Assessment,
      all_models.Program,
      all_models.Issue,
  )
  def test_head_etag(self, model):
    """Test correctness of HEAD request processing for {}"""
    obj = factories.get_model_factory(model.__name__)()
    response = self.api.head(model, obj.id)
    self.assert200(response)
    self.assertEqual(response.data, "")
    exp_etag = common.etag(getattr(obj, "updated_at"), common.get_info(obj))
    self.assertEqual(response.headers.get("Etag"), exp_etag)

  @ddt.data(
      all_models.Control,
      all_models.Objective,
      all_models.Audit,
      all_models.Assessment,
      all_models.Program,
      all_models.Issue,
  )
  def test_query_count(self, model):
    """Test count of queries on HEAD request processing for {}"""
    obj_id = factories.get_model_factory(model.__name__)().id
    with utils.QueryCounter() as counter:
      response = self.api.head(model, obj_id)
      self.assert200(response)
      self.assertEqual(counter.get, 3)

  def test_head_invalid_url_405(self):
    """Ensures 405 status code on non valid url via HEAD request"""
    response = self.api.client.head('/api/controls')
    self.assert405(response)

    response = self.api.client.head('/controls/1')
    self.assert405(response)
