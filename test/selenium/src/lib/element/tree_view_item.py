# Copyright (C) 2020 Google Inc.
# Licensed under http://www.apache.org/licenses/LICENSE-2.0 <see LICENSE file>
"""Module of TreeViewItem dropdownsMenu presented on Genetic TreeView."""
from lib.constants import element
from lib.element import elements_list
from lib.page.modal import unified_mapper


class CommonDropdownTreeViewItem(elements_list.DropdownMenu):
  """Common Dropdown for TreeView Item"""
  _elements = element.DropdownMenuItemTypes

  def __init__(self, driver, obj_name, parent_element):
    super(CommonDropdownTreeViewItem, self).__init__(driver, parent_element)
    self._driver = driver
    self.dropdown_btn = parent_element
    self.obj_name = obj_name

  def select_map(self):
    """
    Click on "Map to this object" button in dropdown. Before this, check
    whether the dropdown is display. If no open it
    Returns:
    Unified mapper
    """
    self.get_dropdown_item(self._elements.MAP).click()
    return unified_mapper.MapObjectsModal(self._driver, self.obj_name)


class SnapshotsDropdownTreeViewItem(CommonDropdownTreeViewItem):
  """Class for Dropdown of Snapshotable TreeViewItem"""


class AssessmentTemplates(CommonDropdownTreeViewItem):
  """Class for Dropdown of AssessmentTemplates TreeViewItem"""


class Audits(CommonDropdownTreeViewItem):
  """Class for Dropdown of Audits TreeViewItem"""


class Assessments(CommonDropdownTreeViewItem):
  """Class for Dropdown of Assessments TreeViewItem"""


class Issues(CommonDropdownTreeViewItem):
  """Class for Dropdown of Assessments TreeViewItem"""


class Controls(SnapshotsDropdownTreeViewItem):
  """Class for Dropdown of Controls TreeViewItem"""


class Objectives(SnapshotsDropdownTreeViewItem):
  """Class for Dropdown of Objectives TreeViewItem"""


class Threats(SnapshotsDropdownTreeViewItem):
  """Class for Dropdown of Threats TreeViewItem"""


class Programs(CommonDropdownTreeViewItem):
  """Class for Dropdown of Programs TreeViewItem"""


class ProgramChilds(CommonDropdownTreeViewItem):
  """Class for Dropdown of ProgramChilds TreeViewItem"""


class ProgramParents(CommonDropdownTreeViewItem):
  """Class for Dropdown of ProgramParents TreeViewItem"""


class DataAssets(SnapshotsDropdownTreeViewItem):
  """Class for Dropdown of DataAssets TreeViewItem"""


class Systems(SnapshotsDropdownTreeViewItem):
  """Class for Dropdown of Systems TreeViewItem"""


class Processes(SnapshotsDropdownTreeViewItem):
  """Class for Dropdown of Processes TreeViewItem"""


class Products(SnapshotsDropdownTreeViewItem):
  """Class for Dropdown of Products TreeViewItem"""


class TechnologyEnvironments(SnapshotsDropdownTreeViewItem):
  """Class for Dropdown of TechnologyEnvironments TreeViewItem"""


class Projects(SnapshotsDropdownTreeViewItem):
  """Class for Dropdown of Projects TreeViewItem"""


class OrgGroups(SnapshotsDropdownTreeViewItem):
  """Class for Dropdown of Products TreeViewItem"""


class Risks(SnapshotsDropdownTreeViewItem):
  """Class for Dropdown of Risks TreeViewItem"""


class Regulations(SnapshotsDropdownTreeViewItem):
  """Class for Dropdown of Regulations TreeViewItem"""


class Standards(SnapshotsDropdownTreeViewItem):
  """Class for Dropdown of Standards TreeViewItem"""


class Requirements(SnapshotsDropdownTreeViewItem):
  """Class for Dropdown of Requirements TreeViewItem"""


class Policies(SnapshotsDropdownTreeViewItem):
  """Class for Dropdown of Policies TreeViewItem"""


class Contracts(SnapshotsDropdownTreeViewItem):
  """Class for Dropdown of Contracts TreeViewItem"""


class KeyReports(SnapshotsDropdownTreeViewItem):
  """Class for Dropdown of Key Reports TreeViewItem"""


class AccessGroups(SnapshotsDropdownTreeViewItem):
  """Class for Dropdown of Access Groups TreeViewItem."""


class AccountBalances(SnapshotsDropdownTreeViewItem):
  """Class for Dropdown of Account Balances TreeViewItem."""


class Facilities(SnapshotsDropdownTreeViewItem):
  """Class for Dropdown of Facilities TreeViewItem."""


class Markets(SnapshotsDropdownTreeViewItem):
  """Class for Dropdown of Markets TreeViewItem."""


class Metrics(SnapshotsDropdownTreeViewItem):
  """Class for Dropdown of Metrics TreeViewItem."""


class ProductGroups(SnapshotsDropdownTreeViewItem):
  """Class for Dropdown of Product Groups TreeViewItem."""


class Vendors(SnapshotsDropdownTreeViewItem):
  """Class for Dropdown of Vendors TreeViewItem."""
