# Copyright (C) 2020 Google Inc.
# Licensed under http://www.apache.org/licenses/LICENSE-2.0 <see LICENSE file>
"""Export page with Export Panels."""

import os

from lib import base, environment
from lib.constants import locator, element
from lib.utils import selenium_utils, test_utils


class ExportItem(base.Component):
  """Export item on Export Page."""
  _locators = locator.ExportItem

  def __init__(self, driver, export_item_elem):
    super(ExportItem, self).__init__(driver)
    self.export_item_elem = export_item_elem

  def download_csv(self):
    self.export_item_elem.button(text="Download CSV").click()


class ExportPage(base.Component):
  """Export Page."""
  _locators = locator.ExportPage
  _elements = element.ExportPage

  def __init__(self, driver):
    super(ExportPage, self).__init__(driver)
    self.export_page = self._browser.element(
        class_name="content").element(id="csv_export")
    self.export_objs_btn = self._browser.button(id="export-csv-button")
    self.export_page_url = environment.app_url + "export"

  def open_export_page(self):
    selenium_utils.open_url(self.export_page_url)
    selenium_utils.wait_for_js_to_load(self._driver)

  def get_export_items(self):
    """Get the list of all Export Items which are present on Export Page."""
    return [ExportItem(self._driver, export_item_elem) for export_item_elem in
            self.export_page.elements(class_name="current-exports__item")]

  def download_obj_to_csv(self, path_to_export_dir):
    """Download as CSV and return path to the downloaded file."""
    export_item = self.get_export_items()[-1]
    selenium_utils.set_chrome_download_location(
        self._driver, path_to_export_dir)
    downloads_before = os.listdir(path_to_export_dir)
    export_item.download_csv()

    def path_to_downloaded_file():
      """Path to a file that has appeared."""
      difference = set(os.listdir(path_to_export_dir)) - set(downloads_before)
      if len(difference) == 1:
        filename = list(difference)[0]
        if not filename.endswith("crdownload"):  # file is not fully downloaded
          return os.path.join(path_to_export_dir, filename)
      return None
    return test_utils.wait_for(path_to_downloaded_file)
