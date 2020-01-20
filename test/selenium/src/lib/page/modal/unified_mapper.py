# Copyright (C) 2020 Google Inc.
# Licensed under http://www.apache.org/licenses/LICENSE-2.0 <see LICENSE file>
"""Modals for map objects."""
from lib import base, decorator
from lib.constants import element, locator, value_aliases as alias, objects
from lib.page.widget import object_modal
from lib.utils import selenium_utils


class BaseUnifiedMapperModal(object_modal.BaseObjectModal):
  """Represents unified mapper object modal."""

  def __init__(self, driver=None):
    super(BaseUnifiedMapperModal, self).__init__(driver)
    self._root = self._browser.element(css=locator.Common.MODAL_MAPPER)


class CommonUnifiedMapperModal(BaseUnifiedMapperModal):
  """Common unified mapper modal."""
  # pylint: disable=too-many-instance-attributes
  # pylint: disable=inconsistent-return-statements
  _locators = locator.ModalMapObjects
  _elements = element.UnifiedMapperModal

  def __init__(self, driver, obj_name):
    super(CommonUnifiedMapperModal, self).__init__(driver)
    # labels
    self.modal_elem = selenium_utils.get_when_visible(
        self._driver, self._locators.MODAL_CSS)
    self.filter_toggle = base.Toggle(
        self.modal_elem, self._locators.FILTER_TOGGLE_CSS)
    self.filter_toggle.is_activated = True
    self.title_modal = base.Label(self.modal_elem, self._locators.MODAL_TITLE)
    if obj_name != objects.ASSESSMENT_TEMPLATES:
      self.obj_type = base.Label(self.modal_elem, self._locators.OBJ_TYPE)
    # user input elements
    self.tree_view = base.UnifiedMapperTreeView(
        self._driver, obj_name=obj_name)
    self._add_attr_btn = None
    self.search_result_toggle = base.Toggle(
        self.modal_elem, self._locators.RESULT_TOGGLE_CSS)
    self.open_in_new_frontend_btn = self._browser.link(
        class_name=["btn", "btn-small", "btn-white"],
        text="Open in new frontend")
    self._create_and_map_obj_btn = self._browser.element(
        class_name="modal-header").button(text="Create and map new object")
    self._obj_type_select = self._browser.element(name="type-select")

  def get_available_to_map_obj_aliases(self):
    """Return texts of all objects available to map via UnifiedMapper."""
    # pylint: disable=invalid-name
    return [opt.get_attribute("label")
            for opt in self.obj_type_dropdown.find_options()]

  @decorator.lazy_property
  def obj_type_dropdown(self):
    return base.DropdownStatic(
        self.modal_elem, self._locators.OBJ_TYPE_DROPDOWN)

  def _select_dest_obj_type(self, obj_name, is_asmts_generation=False):
    """Open dropdown and select element according to destination object name.
    If is_asmts_generation then TextFilterDropdown, else DropdownStatic.
    """
    if obj_name:
      obj_type_dropdown = base.DropdownStatic(
          self.modal_elem, self._locators.OBJ_TYPE_DROPDOWN)
      obj_type_dropdown.select(obj_name)
      if is_asmts_generation:
        asmt_tmpl_dropdown = base.DropdownStatic(
            self.modal_elem, self._locators.OBJ_TYPE_DROPDOWN,)
        asmt_tmpl_dropdown.select_by_label(obj_name)

  def add_filter_attr(self, attr_name, value,
                      operator=None, compare_op=alias.EQUAL_OP):
    """Add filter attribute according to passed parameters. """
    if not self._add_attr_btn:
      self._add_attr_btn = selenium_utils.get_when_visible(
          self.modal_elem, self._locators.FILTER_ADD_ATTRIBUTE_BTN)
    self._add_attr_btn.click()
    last_filter_param = self._get_latest_filter_elements()
    last_filter_param['name'].select(attr_name)
    last_filter_param['value'].enter_text(value)
    last_filter_param["compare_op"].select(compare_op)
    if last_filter_param["operator"] and operator:
      last_filter_param["operator"].select(operator)

  def _get_latest_filter_elements(self):
    """Return elements of last filter parameter"""
    latest_filter_elem = self._driver.find_elements(
        *self._locators.FILTER_ROW_CSS)
    latest_filter = {
        "name": base.DropdownAutocomplete(
            latest_filter_elem[-1], self._locators.FILTER_ATTRIBUTE_NAME),
        "compare_op": base.DropdownStatic(
            latest_filter_elem[-1], self._locators.FILTER_ATTRIBUTE_COMPARE),
        "value": base.TextInputField(
            latest_filter_elem[-1], self._locators.FILTER_ATTRIBUTE_VALUE),
        "operator": None}
    if len(latest_filter_elem) > 1:
      latest_filter["operator"] = base.DropdownStatic(
          self.modal_elem, selenium_utils.get_when_all_visible(
              self.modal_elem, self._locators.FILTER_OPERATOR)[-1])
    return latest_filter

  def _select_search_dest_objs(self):
    """Click Search button to search objects according set filters."""
    base.Button(self.modal_elem, self._locators.BUTTON_SEARCH).click()
    selenium_utils.wait_for_js_to_load(self._driver)

  def _select_dest_objs_to_map(self, objs_titles):
    """Select checkboxes regarding to titles from list of checkboxes
    according to destinations objects titles.
    """
    dest_objs = base.ListCheckboxes(
        self.modal_elem.parent, self._locators.FOUND_OBJECTS_TITLES,
        self._locators.FOUND_OBJECTS_CHECKBOXES)
    dest_objs.select_by_titles(objs_titles)

  def get_mapping_statuses(self):
    """Get mapping status from checkboxes on Unified Mapper
       (selected and disabled or not).
    """
    dest_objs = base.ListCheckboxes(
        self.modal_elem.parent, self._locators.FOUND_OBJECTS_TITLES,
        self._locators.FOUND_OBJECTS_CHECKBOXES)
    return (
        dest_objs.get_mapping_statuses() if
        self.tree_view.tree_view_items() else [])

  def _confirm_map_selected(self):
    """Select Map Selected button to confirm map selected objects to
    source object.
    """
    base.Button(self.modal_elem, self._locators.BUTTON_MAP_SELECTED).click()
    selenium_utils.get_when_invisible(
        self.modal_elem, self._locators.BUTTON_MAP_SELECTED)

  def _confirm_items_added(self):
    """Wait until items shown on Tree View."""
    selenium_utils.get_when_invisible(
        self._driver, locator.TreeView.NO_RESULTS_MSG_CSS)

  def search_dest_objs(self, dest_objs_type, dest_objs_titles=None,
                       is_asmts_generation=False, return_tree_items=True):
    """Filter and search destination objects according to them type and titles.
    If is_asmts_generation then TextFilterDropdown is using.
    If moved_to_new_frontend then doesn't return tree items.
    """
    if not self.filter_toggle.is_activated:
      self.filter_toggle.toggle()
    self._select_dest_obj_type(obj_name=dest_objs_type,
                               is_asmts_generation=is_asmts_generation)
    # Add filter attr.
    if dest_objs_titles:
      for enum, title in enumerate(dest_objs_titles):
        if enum == 0:
          operator = None
        else:
          operator = alias.OR_OP
        self.add_filter_attr(self._elements.ATTRIBUTE_TITLE, title,
                             operator=operator)
    self._select_search_dest_objs()
    # Return items or check nothin is returned.
    if return_tree_items:
      return self.tree_view.get_list_members_as_list_scopes()
    else:
      found_mapper_results = self._browser.elements(
          css=locator.CommonModalUnifiedMapper.FOUND_MAPPER_RESULTS_CSS)
      assert not found_mapper_results.to_list, "Search shouldn't return items."

  def map_dest_objs(self, dest_objs_type, dest_objs_titles,
                    is_asmts_generation=False):
    """Filter, search destination objects according to them type and titles.
    Map found destination objects to source object.
    If is_asmts_generation then TextFilterDropdown is using.
    """
    selenium_utils.wait_for_js_to_load(self._driver)
    self.search_dest_objs(dest_objs_type, dest_objs_titles,
                          is_asmts_generation=is_asmts_generation)
    self._select_dest_objs_to_map(objs_titles=dest_objs_titles)
    self._confirm_map_selected()

  def click_create_and_map_obj(self):
    """Clicks `Create and map new object` link
    and returns new modal for object."""
    _selected_obj_type = next(
        x.label for x in self._obj_type_select.options() if x.selected)
    self._create_and_map_obj_btn.click()
    return object_modal.get_modal_obj(
        obj_type=objects.get_singular(_selected_obj_type))


class MapObjectsModal(CommonUnifiedMapperModal):
  """Modal for map objects."""


class MapProgramsToProgramModal(MapObjectsModal):
  """Modal for map child or parent programs to program."""

  def _confirm_map_selected(self):
    """Selects Map Selected button.

    This method is overrided because method from base class does not work in
    situation when confirmation popup appears."""
    self._root.button(text='Map Selected').click()


class SearchObjectsModal(CommonUnifiedMapperModal):
  """Modal for search objects."""


class GenerateAssessmentsModal(CommonUnifiedMapperModal):
  """Modal for generate Assessments objects."""
  _locators = locator.ModalGenerateAssessments

  def generate_asmts(self, objs_under_asmt_titles, asmt_tmpl_title=None):
    """Filter, search objects under Assessment according to them titles:
    objects under assessments titles, if 'asmt_tmpl_title'
    then Assessment Template title.
    Generate Assessments based on found objects under Assessment.
    """
    # pylint: disable=invalid-name
    self.map_dest_objs(
        dest_objs_type=asmt_tmpl_title,
        dest_objs_titles=objs_under_asmt_titles, is_asmts_generation=True)


class CloneOrCreateAssessmentTemplatesModal(CommonUnifiedMapperModal):
  """Modal for Clone Assessments or open Create Assessment objects."""
  _locators = locator.ModalCloneOrCreateAssessmentTemplates

  def __init__(self, driver, obj_name):
    super(CloneOrCreateAssessmentTemplatesModal, self).__init__(
        driver, obj_name)
    self.create_asmt_tmpl_btn = base.Element(
        self.modal_elem, self._locators.CREATE_ASMT_TMPL_BTN_CSS)

  def clone_asmt_tmpls(self, *args, **kwargs):
    """Clone Assessments Templates based using Unify Mapper."""
    # todo: implement Assessments Templates cloning functionality
    raise NotImplementedError


class AssessmentCreationMapperModal(CommonUnifiedMapperModal):
  """Class for UnifiedMapper modal on Assessment Edit/Create Modal."""
  def __init__(self, driver, obj_name=objects.ASSESSMENTS):
    super(AssessmentCreationMapperModal, self).__init__(driver, obj_name)

  def _confirm_items_added(self):
    """Wait until items shown on Edit/Create Assessment Modal."""
    selenium_utils.get_when_invisible(
        self._driver, locator.TreeView.NO_RESULTS_MSG_CSS)
