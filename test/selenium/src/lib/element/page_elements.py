# Copyright (C) 2020 Google Inc.
# Licensed under http://www.apache.org/licenses/LICENSE-2.0 <see LICENSE file>
"""Page objects for child elements of pages"""
# pylint: disable=too-few-public-methods
import time

from lib.constants import objects
from lib.constants.element import AdminWidgetCustomAttributes
from lib.utils import selenium_utils, ui_utils, date_utils


class InlineEdit(object):
  """Inline edit page element."""
  def __init__(self, root):
    self._root = root

  def open(self):
    """Opens inline edit."""
    # Hovering over element and clicking on it using Selenium / Nerodia
    # doesn't open the inline edit control for some reason
    self._root.wait_until(lambda e: e.present)
    self._root.element(class_name="fa-pencil").js_click()

  def confirm(self):
    """Saves changes via inline edit."""
    save_btn = self._root.element(class_name="fa-check")
    save_btn.click()
    # Wait for inline edit element to be removed
    save_btn.wait_until_not(lambda e: e.exists)
    # Wait for JS to work, there are no DOM changes and HTTP requests
    # during some period (GGRC-5891).
    time.sleep(1)
    ui_utils.wait_for_spinner_to_disappear()


class AssessmentFormField(object):
  """Represents form field on Assessment info widget."""

  def __init__(self, container, label):
    self._root = container.element(
        class_name="ggrc-form__title", text=label).parent(class_name="inline")

  @property
  def text(self):
    """Returns text of description."""
    return self._root.element(class_name="inline__content").text


class InfoPaneFormField(object):
  """Represents info pane form field."""

  def __init__(self, container, label):
    self._root = container.element(
        class_name="info-pane__section-title", text=label).parent()

  @property
  def text(self):
    """Returns text of description."""
    return self._root.span().text


class SimpleField(object):
  """Represents a simple field
  (with h6 header and a text within the same element).
  """

  def __init__(self, container, label, with_inline_edit=False):
    self._label_text = label
    self._container = container
    if with_inline_edit:
      self.inline_edit = InlineEdit(self.root)
      self.input = self.root.input()

  @property
  def root(self):
    """Returns root element."""
    root = self._container.h6(text=self._label_text).parent()
    if "action-toolbar" in root.classes:
      root = root.parent()
    return root

  @property
  def text(self):
    """Returns text of element."""
    return self.root.text[len(self._label_text):].strip()


class EditableSimpleField(SimpleField):
  """Represents an editable simple field
  (with header and text within the same element).
  """

  @property
  def root(self):
    """Returns root element."""
    return self._container.element(
        tag_name="base-inline-control-title", text=self._label_text).parent(
        tag_name="inline-edit-control")


class Datepicker(object):
  """Represents datepicker."""

  def __init__(self, container):
    self._root = container

  def get_value(self):
    """Gets a date."""
    return self._root.text_field().value

  def set_value(self, date):
    """Sets a date in JQuery UI Datepicker."""
    self._open_datepicker()
    self._set_date(date)
    self._click_active_date()

  def _open_datepicker(self):
    """Opens JQuery UI datepicker."""
    self._root.text_field().focus()

  def _set_date(self, date):
    """Sets active date in datepicker using JQuery UI Datepicker API."""
    jquery_ui_picker_el = self._root.element(class_name="datepicker__calendar")
    date = date if isinstance(date, str) else date.strftime("%Y-%m-%d")
    self._root.browser.execute_script("""
      var datepicker_el = $(arguments[0]);
      var date = arguments[1];
      datepicker_el.datepicker("setDate", date);
    """, jquery_ui_picker_el, date)

  def _click_active_date(self):
    """Clicks date that is marked as active."""
    self._root.element(class_name="ui-state-active").click()


class AssertionsDropdown(object):
  """Assertions Dropdown element."""
  def __init__(self, container):
    self.text = "Assertions"
    self._root = container.element(
        class_name="custom-attr-wrap").element(text=self.text)
    self.assertions_values = self._root.parent().text.splitlines()[1:]
    self.inline_edit = InlineEdit(self._root)
    self.input = self._root.select(class_name="input-block-level")


class RelatedPeopleList(object):
  """Represents related people element"""

  def __init__(self, container, acr_name, with_inline_edit=True):
    self._root = container.element(
        class_name="people-group__title", text=acr_name).parent(
            class_name="people-group")
    if with_inline_edit:
      self.inline_edit = InlineEdit(self._root)
    else:
      self.inline_edit = None

  @property
  def add_person_text_field(self):
    """Returns 'Add person' text field object."""
    return self._root.text_field(placeholder="Add person")

  def add_person(self, person):
    """Adds person to Related People list."""
    if self.inline_edit:
      self.inline_edit.open()
    email = person.email
    self.add_person_text_field.set(email)
    ui_utils.select_user(self._root, email)
    if self.inline_edit:
      self.inline_edit.confirm()

  def get_people_emails(self):
    """Get emails of people"""
    return [el.text for el in self._root.elements(class_name="person-name")]

  def exists(self):
    """Returns whether element exists."""
    return self._root.exists


class RelatedUrls(object):
  """Represents reference / evidence url section on info widgets"""

  def __init__(self, container, label):
    self._root = container.element(
        class_name="related-urls__title", text=label).parent(
            class_name="related-urls")
    self.add_button = self._root.button(class_name="related-urls__toggle")


class AssessmentEvidenceUrls(object):
  """Represents assessment urls section on info widgets"""

  def __init__(self, container):
    self._root = container.element(
        class_name="info-pane__section-title_spinnerable",
        text="Evidence URL").parent()

  def add_url(self, url):
    """Add url"""
    self._root.button(text="Add").click()
    self._root.text_field(class_name="create-form__input").set(url)
    self._root.element(class_name="create-form__confirm").click()

  def get_urls(self):
    """Get urls"""
    return [el.text for el in self._root.elements(
        class_name="editable-evidence-item__content__link")]


class CustomAttributeManager(object):
  """Manager for custom attributes.
  It finds them based on object type, whether it is
  global / local, inline / popup.
  Also it provides access to overall operations like getting all titles.
  """

  def __init__(self, browser, obj_type, is_global, is_inline):
    self._browser = browser
    self.obj_type = obj_type
    self.is_global = is_global
    self.is_inline = is_inline
    self.all_labels = self._get_all_labels()

  def _get_all_labels(self):
    """Returns list of all labels."""
    if self.is_global:
      if not self.is_inline:
        # Workaround https://github.com/watir/watir/issues/759
        elements = self._browser.element(
            tag_name="gca-controls").wait_until(lambda e: e.exists).elements(
            class_name="ggrc-form-item__label-text")
      elif self.obj_type == objects.ASSESSMENTS:
        elements = self._browser.element(
            tag_name="assessment-custom-attributes").elements(
            class_name="ggrc-form__title")
      else:
        elements = self._browser.element(
            tag_name="global-custom-attributes").elements(
            class_name="info-pane__section-title")
    else:
      elements = self._browser.element(
          tag_name="assessment-local-ca").elements(
          class_name="field__title-text")
    return list(elements)

  def all_ca_titles(self):
    """Returns all CA titles."""
    return [el.text for el in self.all_labels]

  def find_ca_elem_by_title(self, title):
    """Finds CA page element based on title."""
    return CustomAttribute(title, self)


class CustomAttribute(object):
  """Custom attribute page element."""

  def __init__(self, title, ca_manager):
    self._ca_manager = ca_manager
    self._label_el = self._get_label_el(title)
    self._root = self._get_root(self._label_el)
    self._ca_strategy = {
        AdminWidgetCustomAttributes.TEXT: TextCAActionsStrategy,
        AdminWidgetCustomAttributes.RICH_TEXT: RichTextCAActionsStrategy,
        AdminWidgetCustomAttributes.DATE: DateCAActionsStrategy,
        AdminWidgetCustomAttributes.CHECKBOX: CheckboxCAActionsStrategy,
        AdminWidgetCustomAttributes.MULTISELECT: MultiselectCAActionsStrategy,
        AdminWidgetCustomAttributes.DROPDOWN: DropdownCAActionsStrategy,
        AdminWidgetCustomAttributes.PERSON: PersonCAActionsStrategy
    }[self.ca_type](self._root, self._label_el)

  def _get_label_el(self, title):
    """Finds label element by title."""
    return selenium_utils.filter_by_text(self._ca_manager.all_labels, title)

  def _get_root(self, label_el):
    """Finds root element of CA by label element."""
    if self._ca_manager.is_global:
      root_cls = "ggrc-form-item"
    else:
      root_cls = "field-wrapper flex-size-1"
    return label_el.parent(class_name=root_cls)

  @property
  def ca_type(self):
    """Returns type of CA element."""
    if self._ca_manager.is_global and self._ca_manager.is_inline:
      js_el = self._root.element(class_name="inline-edit-control")
    else:
      js_el = self._root.element(class_name="form-field__content")
    js_type = js_el.browser.execute_script(
        "return $(arguments[0]).viewModel().attr('type')", js_el)
    return {
        "input": AdminWidgetCustomAttributes.TEXT,
        "text": AdminWidgetCustomAttributes.RICH_TEXT,
        "date": AdminWidgetCustomAttributes.DATE,
        "checkbox": AdminWidgetCustomAttributes.CHECKBOX,
        "multiselect": AdminWidgetCustomAttributes.MULTISELECT,
        "dropdown": AdminWidgetCustomAttributes.DROPDOWN,
        "person": AdminWidgetCustomAttributes.PERSON
    }[js_type]

  def get_value(self):
    """Gets value of custom attribute element."""
    if self._ca_manager.is_global:
      value = self._ca_strategy.get_gcas_from_inline()
    else:
      value = self._ca_strategy.get_lcas_from_inline()
    empty_string_strategies = (
        TextCAActionsStrategy, RichTextCAActionsStrategy,
        MultiselectCAActionsStrategy, DropdownCAActionsStrategy)
    if isinstance(self._ca_strategy, empty_string_strategies) and value == "":
      return None
    elif (isinstance(self._ca_strategy, DateCAActionsStrategy) and
          value not in ("", "None")):
      value = value.split("/")
      return unicode("{y}-{m}-{d}".format(y=value[2], m=value[0], d=value[1]))
    return value

  def set_value(self, value):
    """Sets value for custom attribute element."""
    if self._ca_manager.is_inline:
      if self._ca_manager.is_global:
        self._ca_strategy.set_gcas_from_inline(value)
      else:
        self._ca_strategy.set_lcas_from_inline(value)
      # Wait for JS to work, there are no DOM changes and HTTP requests
      # during some period (GGRC-5891).
      time.sleep(1)
    else:
      self._ca_strategy.set_gcas_from_popup(value)

  def open_edit(self):
    """Opens edit form for custom attribute."""
    self._ca_strategy.open_gcas_from_inline()
    return self._ca_strategy


class CAActionsStrategy(object):
  """Parent class for custom attribute actions."""
  def __init__(self, root, label_el):
    self._root = root
    self._label_el = label_el
    self._inline_edit = InlineEdit(self._root)

  def open_gcas_from_inline(self):
    """Opens GCA inline field for editing."""
    self._inline_edit.open()

  def get_gcas_from_inline(self):
    """Gets value of inline GCA field."""
    return self._root.element(class_name="inline__content").text

  def set_gcas_from_inline(self, value):
    """Sets value of inline GCA field."""
    self._inline_edit.open()
    self._fill_input_field(value)
    self._inline_edit.confirm()

  def set_gcas_from_popup(self, value):
    """Sets value of GCA field in popup."""
    self._fill_input_field(value)

  def _fill_input_field(self, value):
    """Fills input field."""
    raise NotImplementedError


class TextCAActionsStrategy(CAActionsStrategy):
  """Actions for Text CA."""

  def __init__(self, *args):
    super(TextCAActionsStrategy, self).__init__(*args)
    self._input = self._root.text_field(class_name="text-field")

  def get_lcas_from_inline(self):
    """Gets value of inline LCA field."""
    return self._input.value

  def set_lcas_from_inline(self, value):
    """Sets value of inline LCA field."""
    self._input.send_keys(value)
    self._label_el.click()

  def _fill_input_field(self, value):
    """Fills input field."""
    self._input.send_keys(value)


class RichTextCAActionsStrategy(CAActionsStrategy):
  """Actions for Rich text CA."""

  def __init__(self, *args):
    super(RichTextCAActionsStrategy, self).__init__(*args)
    self._input = self._root.element(class_name="ql-editor")

  @property
  def is_inline_edit_opened(self):
    """Checks if input opened."""
    return self._input.exists

  def get_lcas_from_inline(self):
    """Gets value of inline LCA field."""
    return self._input.text

  def set_lcas_from_inline(self, value):
    """Sets value of inline LCA field."""
    self._input.send_keys(value)
    self._label_el.click()

  def _fill_input_field(self, value):
    """Fills input field."""
    self._input.send_keys(value)


class DateCAActionsStrategy(CAActionsStrategy):
  """Actions for Date CA."""

  def __init__(self, *args):
    super(DateCAActionsStrategy, self).__init__(*args)
    self._datepicker = Datepicker(self._root)

  def get_lcas_from_inline(self):
    """Gets value of inline LCA field."""
    return self._datepicker.get_value()

  def set_lcas_from_inline(self, value):
    """Sets value of inline LCA field."""
    self._fill_input_field(value)

  def _fill_input_field(self, value):
    """Fills input field."""
    self._datepicker.set_value(date_utils.str_to_date(value, "%Y-%m-%d"))


class CheckboxCAActionsStrategy(CAActionsStrategy):
  """Actions for Checkbox CA."""

  def __init__(self, *args):
    super(CheckboxCAActionsStrategy, self).__init__(*args)
    self._input = self._root.checkbox()

  def get_gcas_from_inline(self):
    """Gets value of inline GCA field."""
    return self._input.is_set

  def get_lcas_from_inline(self):
    """Gets value of inline LCA field."""
    return self._input.is_set

  def set_lcas_from_inline(self, value):
    """Sets value of inline LCA field."""
    # in case no action performed, status will not be changed
    # double click on checkbox equals to not checked
    self._input.click()
    self._input.set(value)

  def _fill_input_field(self, value):
    """Fills input field."""
    self._input.set(value)


class MultiselectCAActionsStrategy(CAActionsStrategy):
  """Actions for Multiselect CA."""

  def __init__(self, *args):
    super(MultiselectCAActionsStrategy, self).__init__(*args)
    self._dropdown = MultiselectDropdown(self._root)

  def get_lcas_from_inline(self):
    """Gets value of inline LCA field."""
    return self._dropdown.value

  def set_lcas_from_inline(self, value):
    """Sets value of inline LCA field."""
    self._dropdown.set_option_status(value)

  def set_gcas_from_popup(self, value):
    """Sets value of GCA field."""
    self._dropdown.set_option_status(value)

  def _fill_input_field(self, value):
    """Fills input field."""
    self._dropdown.set_option_status(value, is_inline=True)


class DropdownCAActionsStrategy(CAActionsStrategy):
  """Actions for Dropown CA."""

  def _gcas_input(self):
    """Gets global custom attribute input element."""
    return self._root.select(class_name="input-block-level")

  def _lcas_input(self):
    """Gets local custom attribute input element."""
    return self._root.input(class_name="dropdown-wrap-text__input")

  def get_gcas_from_inline(self):
    """Gets value of inline GCA field."""
    return self._gcas_input().value

  def get_lcas_from_inline(self):
    """Gets value of inline LCA field."""
    return self._lcas_input().value

  def set_lcas_from_inline(self, value):
    """Sets value of inline LCA field."""
    dropdown = self._root.element(tag_name="dropdown-wrap-text")
    dropdown.click()
    dropdown.div(text=value).click()

  def _fill_input_field(self, value):
    """Fills input field."""
    self._gcas_input().select(value)


class PersonCAActionsStrategy(CAActionsStrategy):
  """Actions for person CA."""

  def __init__(self, *args):
    super(PersonCAActionsStrategy, self).__init__(*args)
    self._input = self._root.text_field(data_lookup="Person")
    self._chosen_person_el = self._root.element(
        class_name="person-name")

  def get_gcas_from_inline(self):
    """Gets value of inline GCA field."""
    if self._chosen_person_el.exists:
      return self._chosen_person_el.text
    return None

  def get_lcas_from_inline(self):
    """Gets value of inline LCA field."""
    if self._chosen_person_el.exists:
      return self._chosen_person_el.text
    return None

  def set_lcas_from_inline(self, value):
    """Sets value of inline LCA field."""
    self._select_user(value)

  def _fill_input_field(self, value):
    """Fills input field."""
    self._select_user(value)

  def _select_user(self, value):
    """Chooses user."""
    self._input.send_keys(value)
    ui_utils.select_user(self._root, value)


class MultiselectDropdown(object):
  """Class for multi select dropdown item."""

  def __init__(self, container):
    self._root = container.element(class_name="multiselect-dropdown")

  @property
  def is_expanded(self):
    """Returns whether dropdown is expanded."""
    return self._root.element(
        class_name="multiselect-dropdown__body-wrapper").exists

  def expand(self):
    """Expands dropdown if it is not expanded."""
    if not self.is_expanded:
      self._root.click()

  def collapse(self):
    """Collapses dropdown if it is expanded."""
    if self.is_expanded:
      self._root.click()

  def set_option_status(self, option, status=True, is_inline=False):
    """Selects or deselects option according to status value. Skip collapse
    action if parameter is_inline is set to True."""
    self.expand()
    self._root.element(text=option).checkbox().set(status)
    if not is_inline:
      self.collapse()

  def select_all(self):
    """Selects all options by selecting 'Select all' option."""
    self.set_option_status("Select All")

  @property
  def value(self):
    """Returns dropdown value."""
    return self._root.input().value


class CollapsiblePanel(object):
  """Base class for collapsible panels."""

  def __init__(self, root):
    self._root = root

  @property
  def is_expanded(self):
    """Returns whether section is expanded or not."""
    return "is-expanded" in self._root.div(class_name="body-inner").classes

  def expand(self):
    """Expand section if it is not expanded already.
    Returns: CollapsiblePanel instance."""
    if not self.is_expanded:
      self._root.span().click()
      self._root.wait_until(lambda x: self.is_expanded)
    return self


class StatusLabel(object):
  """Represents status label element."""

  def __init__(self, root, with_inline_edit=False):
    self._root = root
    self.text_content = root.text_content
    self._inline_edit = InlineEdit(self._root.parent(
        class_name="action-toolbar")) if with_inline_edit else None

  def click_edit(self):
    """Click on 'Edit' icon to edit element's value on new frontend."""
    if self._inline_edit:
      self._inline_edit.open()
