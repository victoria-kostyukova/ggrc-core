# Copyright (C) 2020 Google Inc.
# Licensed under http://www.apache.org/licenses/LICENSE-2.0 <see LICENSE file>

"""Tests for Snapshot import."""

import collections
import json

import mock

from ggrc import utils
from ggrc.converters import errors
from ggrc.models import all_models
from integration import ggrc
from integration.ggrc.models import factories


class TestSnapshotImport(ggrc.TestCase):
  """Test for Snapshot import."""

  @staticmethod
  def _build_snapshot_import_data(object_type, ordered_dict):
    """Build data used in import request."""
    return [
        ["Object Type"],
        [object_type] + list(ordered_dict.keys()),
        [""] + list(ordered_dict.values()),
    ]

  @mock.patch("ggrc.gdrive.file_actions.get_gdrive_file_data",
              new=lambda x: (x, None, ''))
  def test_snapshot_import_forbidden(self):
    """Test that import of Snapshots is not available in GGRC system."""
    with factories.single_commit():
      audit = factories.AuditFactory()
      control = factories.ControlFactory()

    rev = all_models.Revision.query.filter(
        all_models.Revision.resource_id == control.id,
        all_models.Revision.resource_type == control.type,
    ).order_by(
        all_models.Revision.id.desc(),
    ).first()
    rev_content = rev.content

    import_data = self._build_snapshot_import_data(
        "Control Snapshot",
        collections.OrderedDict([
            ("Code", rev_content["slug"]),
            ("Audit", audit.slug),
            ("Revision Date", rev.created_at.strftime(utils.DATE_FORMAT_US)),
            ("Title", rev_content["title"]),
            ("Description", rev_content["description"]),
            ("Notes", rev_content["notes"]),
            ("Assessment Procedure", rev_content["test_plan"]),
            ("Effective Date", rev_content["start_date"]),
            ("Last Deprecated", rev_content["end_date"]),
            ("Archived", audit.archived),
            ("State", rev_content["status"]), ])
    )

    self.client.get("/login")
    user_id = all_models.Person.query.first().id
    response = self.client.post(
        "/api/people/{}/imports".format(user_id),
        data=json.dumps(import_data),
        headers={
            "Content-Type": "application/json",
            "X-Requested-By": ["GGRC"],
        },
    )

    expected_response = {
        "block_errors": {
            errors.SNAPSHOT_IMPORT_ERROR.format(line=2),
        },
    }

    self.assert200(response)
    self._check_csv_response(
        response.json["import_export"]["results"],
        {
            "Control Snapshot": expected_response,
        },
    )
