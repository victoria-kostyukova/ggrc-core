# Copyright (C) 2020 Google Inc.
# Licensed under http://www.apache.org/licenses/LICENSE-2.0 <see LICENSE file>
"""Workflow cron job related tests."""

import datetime

import ddt
import freezegun
from mock import patch

from ggrc.models import all_models
from ggrc_workflows import start_recurring_cycles
from integration.ggrc.models import factories
from integration.ggrc_workflows.helpers import rbac_helper
from integration.ggrc_workflows.helpers import workflow_test_case
from integration.ggrc_workflows.models import factories as wf_factories


@ddt.ddt
class TestWorkflowCron(workflow_test_case.WorkflowTestCase):
  """Tests related to Workflow cron job."""

  @patch("ggrc_workflows.logger")
  def test_build_cycle_without_admin(self, logger):
    """Build Cycle without Workflow Admin."""
    workflow_setup_data = {
        "WORKFLOW_WITHOUT_ADMIN": tuple(),
        "WORKFLOW_WITH_ADMIN": (rbac_helper.GA_RNAME, )
    }
    with freezegun.freeze_time(datetime.date(2017, 9, 25)):
      for slug, wfa_g_rnames in workflow_setup_data.iteritems():
        with factories.single_commit():
          workflow = self.setup_helper.setup_workflow(
              wfa_g_rnames,
              slug=slug,
              repeat_every=1,
              unit=all_models.Workflow.MONTH_UNIT,
          )
          task_group = wf_factories.TaskGroupFactory(workflow=workflow)
          wf_factories.TaskGroupTaskFactory(
              task_group=task_group,
              start_date=datetime.date(2017, 9, 26),
              end_date=datetime.date(2017, 9, 30),
          )
        self.api_helper.put(workflow, {
            "status": "Active",
            "recurrences": bool(workflow.repeat_every and workflow.unit)
        })

    with freezegun.freeze_time(datetime.date(2017, 10, 25)):
      from ggrc.login import noop
      noop.login()
      start_recurring_cycles()

    workflow_without_admin = all_models.Workflow.query.filter_by(
        slug="WORKFLOW_WITHOUT_ADMIN").one()
    self.assertEqual(len(workflow_without_admin.cycles), 0)
    logger.error.assert_called_once_with(
        "Cannot start cycle on Workflow with slug == '%s' and id == '%s', "
        "cause it doesn't have Admins",
        workflow_without_admin.slug, workflow_without_admin.id)

    workflow_with_admin = all_models.Workflow.query.filter_by(
        slug="WORKFLOW_WITH_ADMIN").one()
    self.assertEqual(len(workflow_with_admin.cycles), 1)
