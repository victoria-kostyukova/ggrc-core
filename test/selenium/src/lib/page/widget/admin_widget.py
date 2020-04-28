# Copyright (C) 2020 Google Inc.
# Licensed under http://www.apache.org/licenses/LICENSE-2.0 <see LICENSE file>
"""Widgets on Admin Dashboard page."""
# pylint: disable=too-few-public-methods

from lib import base, exception
from lib.constants import locator, objects
from lib.entities import entity
from lib.entities.entities_factory import PeopleFactory
from lib.page import dashboard
from lib.page.widget import widget_base
from lib.utils import date_utils, selenium_utils, string_utils


class Events(dashboard.AdminDashboard):
  """Event widget on Admin Dashboard."""
  _locators = locator.WidgetAdminEvents

  def __init__(self, driver):
    super(Events, self).__init__(driver)
    self.widget_header = base.Label(driver, self._locators.TREE_VIEW_HEADER)

  def _wait_to_be_init(self):
    """Wait when all rows will be visible and ppl emails will be loaded into
    last row.
    """
    selenium_utils.wait_for_js_to_load(self._driver)
    selenium_utils.get_when_all_visible(
        self._driver, self._locators.TREE_VIEW_ITEMS_W_PPL)

  @property
  def events(self):
    """Returns list of EventTreeItems."""
    self._wait_to_be_init()
    return [
        EventTreeItem(el).obj_dict
        for el in self._browser.elements(css=self._locators.TREE_VIEW_ITEMS)]

  def event_attrs(self, *attr_names):
    """Get list of attributes for events on the page of Events widget."""
    return self.events if not attr_names else string_utils.extract_items(
        self.events, *attr_names)

  @property
  def paging_buttons(self):
    """Get navigation buttons on the tab."""
    self._wait_to_be_init()
    return self._browser.element(id="events_list").elements(
        class_name="view-more-paging")

  def _get_btn_by_name(self, btn_name):
    """Returns buttons by provided name, otherwise None."""
    return next(btn for btn in self.paging_buttons if btn.text == btn_name)

  def _go_to_page(self, btn_name):
    """Find navigation button by name on click if such button exists
    otherwise raise an AttributeError exception.
    """
    self._get_btn_by_name(btn_name).click()
    return self

  def go_to_next_page(self):
    """Go to next page."""
    return self._go_to_page("NEXT PAGE")

  def go_to_prev_page(self):
    """Go to previous page."""
    return self._go_to_page("PREVIOUS PAGE")


class People(dashboard.AdminDashboard):
  """People widget on Admin Dashboard."""
  _locators = locator.WidgetAdminPeople

  def __init__(self, driver):
    super(People, self).__init__(driver)

  @property
  def people_tree_view(self):
    return base.AdminTreeView(self._driver)

  def get_people(self):
    """Get list of people that displayed in Tree View on People widget.
    """
    tree_view_items = self.people_tree_view.tree_view_items()
    people_as_lists = [item.text.splitlines() for item in tree_view_items]
    return [PeopleFactory().create(
        name=person[0], email=person[1], system_wide_role=person[2])
        for person in people_as_lists]

  def click_create_button(self):
    """Click on the Create button on People widget"""
    add_button = self._browser.link(text="Create").wait_until(
        lambda e: e.enabled)
    add_button.click()

  def filter_by_name_email_company(self, str_to_filter_by):
    """Filter people via filter by name email company text field"""
    filter_tf = base.TextInputField(
        self._driver, self._locators.FILTER_BY_NAME_EMAIL_COM_FIELD_SELECTOR)
    filter_tf.enter_text(str_to_filter_by)
    selenium_utils.wait_for_js_to_load(self._driver)
    filter_tf.send_enter_key()

  def expand_top_person(self):
    """Expand information panel for top person in the tree view if it is not
    expanded already.
    - Return: lib.page.widget.widget_base.PeopleItemContent"""
    self.people_tree_view.tree_view_items()[0].expand()
    return widget_base.PeopleItemContent()


class Roles(dashboard.AdminDashboard):
  """Admin roles widget on Admin Dashboard."""

  def __init__(self, driver):
    super(Roles, self).__init__(driver)
    self.roles_tree_view = base.AdminTreeView(self._driver)

  def get_role_scopes_text_as_dict(self):
    """Get dictionary of labels that displayed in Tree View on Roles widget.
    """
    tree_view_items = self.roles_tree_view.tree_view_items()
    return dict([item.text.splitlines() for item in tree_view_items])


class CustomRoles(dashboard.AdminDashboard):
  """Admin custom roles widget on Admin Dashboard."""

  def __init__(self, driver):
    super(CustomRoles, self).__init__(driver)
    self.custom_roles_tree_view = base.AdminTreeView(self._driver)

  def get_objects_text_as_set(self):
    """Get set of objects labels displayed in Tree View on Custom Roles widget.
    """
    tree_view_items = self.custom_roles_tree_view.tree_view_items()
    return set(item.text for item in tree_view_items)


class CustomAttributes(base.Widget):
  """Custom attributes widget on Admin Dashboard page."""

  def __init__(self, driver):
    super(CustomAttributes, self).__init__(driver)
    self.ca_tree_view = base.AdminTreeView(self._driver)

  def expand_collapse_group(self, item_title, expand=True):
    """Expand/collapse 2-nd tier of Tree View item."""
    items = self.get_items_list()
    for i in items:
      if i.text == item_title:
        if expand:
          i.expand()
          return widget_base.CustomAttributesItemContent(self._driver, i.text)
        return i.collapse()
    raise exception.ElementNotFound('{} in list {}'.format(item_title, items))

  def get_items_list(self):
    """Return Tree View item objects from current widget."""
    return self.ca_tree_view.tree_view_items()

  def get_custom_attributes_list(self, obj_type):
    """Collect custom attributes from expanded object type Tree View.

    Returns:
      list of Custom Attribute objects.
    """
    ca_item_content = self.expand_collapse_group(
        objects.get_normal_form(obj_type), expand=True)
    return ca_item_content.get_ca_list_from_group()

  def open_edit_modal(self, obj_type, ca_title):
    """Click "Edit" button to open edit modal window for specified custom
    attribute.

    Returns:
      lib.page.widget.widget_base.CustomAttributeModal
    """
    ca_item_content = self.expand_collapse_group(obj_type, expand=True)
    ca_list = self.get_custom_attributes_list(obj_type)
    return ca_item_content.open_edit_ca_modal(ca_list.index(
        entity.Representation.filter_objs_by_attrs(ca_list, title=ca_title)))


class EventTreeItem(object):
  """Event item row."""
  def __init__(self, root_element):
    self._root_element = root_element

  @property
  def time(self):
    """Get event time as datetime."""
    return date_utils.ui_str_with_zone_to_datetime(
        self._root_element.element(
            class_name="event-time").text.replace("on ", ""))

  @property
  def user_email(self):
    """Get user email as string."""
    return self._root_element.element(
        class_name="event-owner").text.replace("by\n", "")

  @property
  def actions(self):
    """Get actions as sorted list of strings."""
    action_elements = self._root_element.elements(tag_name="strong")
    return [] if not action_elements else (
        sorted([action_el.text for action_el in action_elements]))

  @property
  def obj_dict(self):
    """Return tree item as dict."""
    return {
        "time": self.time,
        "user_email": self.user_email,
        "actions": self.actions
    }
