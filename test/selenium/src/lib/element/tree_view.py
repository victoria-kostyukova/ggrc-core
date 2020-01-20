# Copyright (C) 2020 Google Inc.
# Licensed under http://www.apache.org/licenses/LICENSE-2.0 <see LICENSE file>
"""Tree View dropdown elements."""
# pylint: disable=too-few-public-methods

from lib import base
from lib.constants import locator
from lib.element import elements_list
from lib.page.modal import unified_mapper


class CommonDropdownSettings(elements_list.DropdownMenu):
  """Common for 3BBS button/dropdown settings on Tree View."""
  _locators = locator.CommonDropdown3bbsTreeView

  def __init__(self, driver, obj_name):
    super(CommonDropdownSettings, self).__init__(
        driver, self._locators.TREE_VIEW_3BBS_DD_CSS)
    self.obj_name = obj_name
    self.select_child_tree_locator = (
        self._locators.BTN_3BBS_SELECT_CHILD_TREE_CSS)
    self.import_locator = self._locators.BTN_3BBS_IMPORT_CSS

  def select_export(self):
    """Select Export objects in 3BBS dropdown modal."""
    base.Button(self._driver, self._locators.BTN_3BBS_EXPORT_CSS).click()


class Assessments(CommonDropdownSettings):
  """Assessments 3BBS button/dropdown settings on Tree View."""
  _locators = locator.AssessmentsDropdown3bbsTreeView

  def select_generate(self):
    """Select generate Assessments in 3BBS dropdown modal to
    open unified mapper modal.

    Return: GenerateAssessmentsModal
    """
    base.Button(self._driver, self._locators.BTN_3BBS_GENERATE_CSS).click()
    return unified_mapper.GenerateAssessmentsModal(self._driver, self.obj_name)


class AssessmentTemplates(CommonDropdownSettings):
  """Assessment Templates 3BBS button/dropdown settings on Tree View."""


class Audits(CommonDropdownSettings):
  """Audits 3BBS button/dropdown settings on Tree View."""


class Programs(CommonDropdownSettings):
  """Programs 3BBS button/dropdown settings on Tree View."""


class ProgramChilds(CommonDropdownSettings):
  """ProgramChilds 3BBS button/dropdown settings on Tree View."""


class Controls(CommonDropdownSettings):
  """Controls 3BBS button/dropdown settings on Tree View."""


class Objectives(CommonDropdownSettings):
  """Objectives 3BBS button/dropdown settings on Tree View."""


class Processes(CommonDropdownSettings):
  """Processes 3BBS button/dropdown settings on Tree View."""


class DataAssets(CommonDropdownSettings):
  """DataAssets 3BBS button/dropdown settings on Tree View."""


class Systems(CommonDropdownSettings):
  """Systems 3BBS button/dropdown settings on Tree View."""


class Products(CommonDropdownSettings):
  """Products 3BBS button/dropdown settings on Tree View."""


class TechnologyEnvironments(CommonDropdownSettings):
  """TechnologyEnvironments 3BBS button/dropdown settings on Tree View."""


class Projects(CommonDropdownSettings):
  """Projects 3BBS button/dropdown settings on Tree View."""


class OrgGroups(CommonDropdownSettings):
  """OrgGroups 3BBS button/dropdown settings on Tree View."""


class Issues(CommonDropdownSettings):
  """Issues 3BBS button/dropdown settings on Tree View."""


class Risks(CommonDropdownSettings):
  """Risks 3BBS button/dropdown settings on Tree View."""


class Regulations(CommonDropdownSettings):
  """Regulations 3BBS button/dropdown settings on Tree View."""
