# Copyright (C) 2020 Google Inc.
# Licensed under http://www.apache.org/licenses/LICENSE-2.0 <see LICENSE file>
"""3bbs element for info widget."""
from lib.element import three_bbs
from lib.page.modal import clone_object, delete_object, update_object


class InfoWidgetThreeBbbs(object):
  """3bbs element for info widget."""

  def __init__(self, root):
    self._root = root
    self._three_bbs = three_bbs.ThreeBbs(self._root)

  @property
  def edit_option(self):
    """Returns `Edit <Object>` option."""
    return self._three_bbs.option_by_icon_cls("fa-pencil-square-o")

  @property
  def delete_option(self):
    """Returns `Delete <Object>` option."""
    return self._three_bbs.option_by_text("Delete")

  def select_edit(self):
    """Selects `Edit <Object>` option."""
    self.edit_option.click()

  def select_get_permalink(self):
    """Selects `Get permalink` option."""
    self._three_bbs.option_by_text("Get permalink").click()

  @property
  def open_option(self):
    """Returns `Open <object>` option.`"""
    return self._three_bbs.option_by_icon_cls("fa-long-arrow-right")

  @property
  def unmap_option(self):
    """Returns `Unmap` option."""
    return self._three_bbs.option_by_text("Unmap")

  @property
  def unmap_in_new_frontend_option(self):
    """Returns `Unmap in new frontend` option."""
    return self._three_bbs.option_by_text("Unmap in new frontend")

  def select_unmap_in_new_frontend(self):
    """Selects `Unmap in new frontend` option."""
    self.unmap_in_new_frontend_option.click()

  def select_delete(self):
    """Selects `Delete` option.
    Return: modal.delete_object.DeleteObjectModal
    """
    self.delete_option.click()
    return delete_object.DeleteObjectModal()

  @property
  def exists(self):
    """Returns whether 3bbs element exists."""
    return self._three_bbs.exists


class AuditInfoWidgetThreeBbbs(InfoWidgetThreeBbbs):
  """3bbs element for Audit info widget."""

  def select_update_objs(self):
    """Selects `Update objects to latest version` option.
    Return: update_object.CompareUpdateObjectModal
    """
    self._three_bbs.option_by_text("Update objects to latest version").click()
    return update_object.CompareUpdateObjectModal()

  def select_clone(self):
    """Selects `Clone <Object>` option.
    Return: clone_object.CloneAuditModal
    """
    self._three_bbs.option_by_icon_cls("fa-clone").click()
    return clone_object.CloneAuditModal(self._root.browser.driver)


class AssessmentInfoWidgetThreeBbbs(InfoWidgetThreeBbbs):
  """3bbs element for Assessment info widget."""

  def select_deprecate(self):
    """Selects `Deprecate` option."""
    self._three_bbs.option_by_text("Deprecate").click()


class WorkflowInfoWidgetThreeBbbs(InfoWidgetThreeBbbs):
  """3bbs element for Workflow info widget."""

  def select_archive(self):
    """Selects `Archive workflow` option."""
    self._three_bbs.option_by_text("Archive workflow").click()


class ControlInfoWidgetThreeBbbs(InfoWidgetThreeBbbs):
  """3bbs element for Control info widget."""


class RiskInfoWidgetThreeBbbs(InfoWidgetThreeBbbs):
  """3bbs element for Risk info widget."""


class PersonTreeItemThreeBbbs(InfoWidgetThreeBbbs):
  """3bbs element for Person tree item widget."""

  def select_edit_authorizations(self):
    """Selects `Edit Authorizations` option."""
    self._three_bbs.option_by_text("Edit System Authorizations").click()


class AccessGroupInfoWidgetThreeBbbs(InfoWidgetThreeBbbs):
  """3bbs element for Access Group info widget."""


class AccountBalanceInfoWidgetThreeBbbs(InfoWidgetThreeBbbs):
  """3bbs element for Account Balance info widget."""


class DataAssetInfoWidgetThreeBbbs(InfoWidgetThreeBbbs):
  """3bbs element for Data Asset info widget."""


class FacilityInfoWidgetThreeBbbs(InfoWidgetThreeBbbs):
  """3bbs element for Facility info widget."""


class KeyReportInfoWidgetThreeBbbs(InfoWidgetThreeBbbs):
  """3bbs element for Key Report info widget."""


class MarketInfoWidgetThreeBbbs(InfoWidgetThreeBbbs):
  """3bbs element for Market info widget."""


class MetricInfoWidgetThreeBbbs(InfoWidgetThreeBbbs):
  """3bbs element for Metric info widget."""


class OrgGroupInfoWidgetThreeBbbs(InfoWidgetThreeBbbs):
  """3bbs element for Org Group info widget."""


class ProcessInfoWidgetThreeBbbs(InfoWidgetThreeBbbs):
  """3bbs element for Process info widget."""


class ProductInfoWidgetThreeBbbs(InfoWidgetThreeBbbs):
  """3bbs element for Product info widget."""


class ProductGroupInfoWidgetThreeBbbs(InfoWidgetThreeBbbs):
  """3bbs element for Product Group info widget."""


class ProjectInfoWidgetThreeBbbs(InfoWidgetThreeBbbs):
  """3bbs element for Project info widget."""


class SystemInfoWidgetThreeBbbs(InfoWidgetThreeBbbs):
  """3bbs element for System info widget."""


class TechnologyEnvironmentInfoWidgetThreeBbbs(InfoWidgetThreeBbbs):
  """3bbs element for Technology Environment info widget."""


class VendorInfoWidgetThreeBbbs(InfoWidgetThreeBbbs):
  """3bbs element for Vendor info widget."""


class RequirementInfoWidgetThreeBbbs(InfoWidgetThreeBbbs):
  """3bbs element for Requirement info widget."""


class PolicyInfoWidgetThreeBbbs(InfoWidgetThreeBbbs):
  """3bbs element for Policy info widget."""


class ContractInfoWidgetThreeBbbs(InfoWidgetThreeBbbs):
  """3bbs element for Contract info widget."""


class RegulationInfoWidgetThreeBbbs(InfoWidgetThreeBbbs):
  """3bbs element for Regulation info widget."""


class StandardInfoWidgetThreeBbbs(InfoWidgetThreeBbbs):
  """3bbs element for Standard info widget."""


class ObjectiveInfoWidgetThreeBbbs(InfoWidgetThreeBbbs):
  """3bbs element for Objective info widget."""


class ThreatInfoWidgetThreeBbbs(InfoWidgetThreeBbbs):
  """3bbs element for Threat info widget."""
