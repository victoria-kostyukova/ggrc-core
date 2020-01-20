# Copyright (C) 2020 Google Inc.
# Licensed under http://www.apache.org/licenses/LICENSE-2.0 <see LICENSE file>

"""Test for reindex procedure."""

import ddt

from ggrc import fulltext
from ggrc.fulltext import mysql
from ggrc.fulltext import listeners
from integration.ggrc import TestCase, Api
from integration.ggrc.models import factories


@ddt.ddt
class TestReindex(TestCase):
  """Tests for reindex procedure."""

  def setUp(self):
    super(TestReindex, self).setUp()
    self.api = Api()

  def test_reindex(self):
    """Test reindex of big portion of objects."""
    obj_count = listeners.ReindexSet.CHUNK_SIZE + 1
    with factories.single_commit():
      audit = factories.AuditFactory()
      for _ in range(obj_count):
        factories.AssessmentFactory(audit=audit)

    indexer = fulltext.get_indexer()
    archived_index = indexer.record_type.query.filter(
        mysql.MysqlRecordProperty.type == "Assessment",
        mysql.MysqlRecordProperty.property == "archived",
        mysql.MysqlRecordProperty.content == "True"
    )
    self.assertEqual(archived_index.count(), 0)

    # Reindex of Audit.archived lead to reindex of all related assessments
    self.api.put(audit, {"archived": True})

    # Check that all Assessment.archived were properly reindexed
    self.assertEqual(archived_index.count(), obj_count)
