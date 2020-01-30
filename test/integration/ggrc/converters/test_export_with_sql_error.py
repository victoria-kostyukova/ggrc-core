# Copyright (C) 2020 Google Inc.
# Licensed under http://www.apache.org/licenses/LICENSE-2.0 <see LICENSE file>

"""Tests for export with SQL error"""

import json

from datetime import datetime

import mock
import flask

from appengine import base
from sqlalchemy import exc

from ggrc import db
from ggrc.models import all_models
from ggrc.views.converters import run_export
from integration.ggrc import TestCase
from integration.ggrc.models import factories


@base.with_memcache
class TestExportSQLError(TestCase):
  """Test for failed export due to SQL error."""

  def setUp(self):  # pylint: disable=missing-docstring
    super(TestExportSQLError, self).setUp()
    self.client.get("/login")
    self.headers = {
        'Content-Type': 'application/json',
        "X-Requested-By": "GGRC",
        "X-export-view": "blocks",
    }

  @mock.patch("ggrc.notifications.common.send_email")
  def test_operational_error(self, _):
    """Test export with raise sqlalchemy exception"""
    user = all_models.Person.query.first()
    flask.g.__setattr__('_current_user', user)
    op_type = all_models.BackgroundOperationType.query.filter_by(
        name='export'
    ).one()

    with factories.single_commit():
      program = factories.ProgramFactory()
      ie_job = factories.ImportExportFactory(
          job_type='Export',
          status='In Progress',
          created_at=datetime.now(),
          created_by=user,
          title="test.csv",
      )

      bg_task = factories.BackgroundTaskFactory(
          name='test export',
          parameters={
              "ie_id": ie_job.id,
              "objects": [{
                  'object_name': program.type,
                  'filters': {'expression': {}},
                  'fields': program.log_json().keys()
              }],
              "exportable_objects": [],
              "parent": {
                  "type": "ImportExport",
                  "id": ie_job.id,
              }
          }
      )

      factories.BackgroundOperationFactory(
          object_type=ie_job.type,
          object_id=ie_job.id,
          bg_task_id=bg_task.id,
          bg_operation_type=op_type,
      )

    with mock.patch('ggrc.views.converters.make_export') as mocked_make_export:
      mocked_make_export.side_effect = exc.OperationalError(
          '',
          '',
          '(OperationalError) (2006, ''MySQL server has gone away'')'
      )
      run_export(bg_task)

    ie_result = db.session.query(all_models.ImportExport).get(ie_job.id)

    expected_response = ie_result.log_json(is_default=True, is_export=True)
    response = self.client.get(
        "/api/people/{}/exports".format(user.id),
        data=json.dumps({
            "objects": [{
                "object_name": "Program",
                "ids": [program.id]}],
            "current_time": str(datetime.now())}),
        headers=self.headers)

    self.assertEqual(response.status, '200 OK')
    self.assertEqual(json.loads(response.data)[0], expected_response)
