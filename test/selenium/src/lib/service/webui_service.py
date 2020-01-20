# Copyright (C) 2020 Google Inc.
# Licensed under http://www.apache.org/licenses/LICENSE-2.0 <see LICENSE file>
"""Services for create and manipulate objects via UI."""
import re

from dateutil import parser, tz

from lib import factory, url, base, cache, constants
from lib.constants import objects, messages, element, regex, locator
from lib.element import tab_containers
from lib.entities import entity
from lib.page import dashboard, widget_bar, export_page
from lib.page.modal import unified_mapper, request_review
from lib.page.widget import generic_widget, object_modal
from lib.utils import (
    selenium_utils, file_utils, test_utils, ui_utils, string_utils)


class BaseWebUiService(base.WithBrowser):
  """Base class for business layer's services objects."""
  # pylint: disable=too-many-instance-attributes
  # pylint: disable=too-many-public-methods
  # pylint: disable=unused-argument
  def __init__(self, obj_name, driver=None):
    super(BaseWebUiService, self).__init__()
    self.obj_name = obj_name
    self.obj_type = objects.get_singular(self.obj_name, title=True)
    self.snapshot_obj_type = None
    self.generic_widget_cls = factory.get_cls_widget(object_name=self.obj_name)
    self.info_widget_cls = factory.get_cls_widget(
        object_name=self.obj_name, is_info=True)
    self.entities_factory_cls = factory.get_cls_entity_factory(
        object_name=self.obj_name)
    self.url_mapped_objs = (
        "{src_obj_url}" +
        url.Utils.get_widget_name_of_mapped_objs(self.obj_name))
    self.url_obj_info_page = "{obj_url}" + url.Widget.INFO
    self._unified_mapper = None

  def _create_list_objs(self, entity_factory, list_scopes):
    """Create and return list of objects used entity factory and UI data
    (list of scopes UI text elements {"header": "item", ...} remapped to
    list of dicts {"attr": "value", ...}).
    Return list of created objects.
    """
    list_factory_objs = [
        entity_factory().obj_inst() for _ in xrange(len(list_scopes))]
    list_scopes_with_upper_keys = [
        string_utils.StringMethods.dict_keys_to_upper_case(scope)
        for scope in list_scopes]
    list_scopes_to_convert = string_utils.StringMethods.exchange_dicts_items(
        transform_dict=entity.Representation.remap_collection(),
        dicts=list_scopes_with_upper_keys, is_keys_not_values=True)
    # convert and represent values in scopes
    for scope in list_scopes_to_convert:
      # convert u'None', u'No person' to None type
      string_utils.StringMethods.update_dicts_values(
          scope, ["None", "No person"], None)
      for key, val in scope.iteritems():
        if val:
          if key in ["mandatory", "verified"]:
            # convert u'false', u'true' like to Boolean
            scope[key] = string_utils.StringMethods.get_bool_value_from_arg(
                val)
          if key in ["updated_at", "created_at"]:
            # UI like u'08/20/2017' to date=2017-08-20, timetz=00:00:00
            datetime_val = parser.parse(val)
            if str(datetime_val.time()) != "00:00:00":
              # UI like u'08/20/2017 07:30:45 AM +03:00' to date=2017-08-20,
              # timetz=04:30:45+00:00 if 'tzinfo', else:
              # CSV like u'08-20-2017 04:30:45' to date=2017-08-20,
              # timetz=04:30:45+00:00
              datetime_val = (
                  datetime_val.astimezone(tz=tz.tzutc()) if datetime_val.tzinfo
                  else datetime_val.replace(tzinfo=tz.tzutc()))
            scope[key] = datetime_val
          if (key == "comments" and isinstance(val, list) and
                  all(isinstance(comment, dict) for comment in val)):
            # extract datetime from u'(Creator) 08/20/2017 07:30:45 AM +03:00'
            scope[key] = [
                {k: (parser.parse(re.sub(regex.TEXT_W_PARENTHESES,
                                         string_utils.Symbols.BLANK, v)
                                  ).astimezone(tz=tz.tzutc())
                     if k == "created_at" else v)
                 for k, v in comment.iteritems()} for comment in val]
          # convert multiple values to list of strings and split if need it
          if (key in entity.Representation.people_attrs_names and
             not isinstance(val, list)):
            # split Tree View values if need 'Ex1, Ex2 F' to ['Ex1', 'Ex2 F']
            # Info Widget values will be represent by internal methods
            scope[key] = val.split(", ")
          # convert 'slug' from CSV for snapshoted objects u'*23eb72ac-4d9d'
          if (key == "slug" and
                  (self.obj_name in objects.ALL_SNAPSHOTABLE_OBJS) and
                  string_utils.Symbols.STAR in val):
            scope[key] = val.replace(string_utils.Symbols.STAR,
                                     string_utils.Symbols.BLANK)
    return [
        factory_obj.update_attrs(is_allow_none=True, **scope) for
        scope, factory_obj in zip(list_scopes_to_convert, list_factory_objs)]

  def submit_obj_modal(self, obj):
    """Submits object modal with `obj`."""
    object_modal.get_modal_obj(obj.type, self._driver).submit_obj(obj)

  def build_obj_from_page(self, root_elem=None):
    """Builds obj from opened page."""
    info_page = (
        self.info_widget_cls(self._driver, root_elem) if
        self.info_widget_cls.__name__ == objects.RISKS.title() else
        self.info_widget_cls(self._driver))
    scope = info_page.get_info_widget_obj_scope()
    return self._create_list_objs(
        entity_factory=self.entities_factory_cls, list_scopes=[scope])[0]

  def get_lhn_accordion(self, object_name):
    """Select relevant section in LHN and return relevant section accordion."""
    selenium_utils.open_url(url.Urls().dashboard)
    lhn_menu = dashboard.Header(self._driver).open_lhn_menu()
    # if object button not visible, open this section first
    if object_name in cache.LHN_SECTION_MEMBERS:
      method_name = factory.get_method_lhn_select(object_name)
      lhn_menu = getattr(lhn_menu, method_name)()
    return getattr(lhn_menu, constants.method.SELECT_PREFIX + object_name)()

  def create_obj_and_get_obj(self, obj):
    """Creates obj via LHN and returns a created obj."""
    self.get_lhn_accordion(objects.get_plural(obj.type)).create_new()
    self.submit_obj_modal(obj)
    return self.build_obj_from_page()

  def open_widget_of_mapped_objs(self, src_obj):
    """Navigates to generic widget URL of mapped objects according to URL of
    source object.
    Returns: generic widget class of mapped objects.
    """
    generic_widget_url = self.url_mapped_objs.format(src_obj_url=src_obj.url)
    # todo fix freezing when navigate through tabs by URLs and using driver.get
    selenium_utils.open_url(generic_widget_url, is_via_js=True)
    return self.generic_widget_cls(
        self._driver, self.obj_name, self.is_versions_widget) if hasattr(
        self, "is_versions_widget") else self.generic_widget_cls(
        self._driver, self.obj_name)

  def open_obj_dashboard_tab(self):
    """Navigates to dashboard tab URL of object according to object name.
    Returns: generic widget class object."""
    dashboard.Dashboard().open_objs_tab_via_url(self.obj_type)
    return self.generic_widget_cls(self._driver, self.obj_name)

  def open_info_page_of_obj(self, obj):
    """Navigates to info page URL of object according to URL of object.
    Returns: info widget class of object.
    """
    info_page_url = self.url_obj_info_page.format(
        obj_url=obj.url)
    selenium_utils.open_url(info_page_url)
    return self.info_widget_cls(self._driver)

  def open_info_panel_of_mapped_obj(self, src_obj, obj):
    """Navigates to info panel URL of object according to URL of source object
    and URL of mapped object.
    Returns: generic widget class of mapped objects.
    """
    return self.open_widget_of_mapped_objs(
        src_obj).tree_view.select_member_by_title(title=obj.title)

  def get_list_objs_from_tree_view(self, src_obj):
    """Get and return list of objects from Tree View."""
    self.set_list_objs_scopes_representation_on_tree_view(src_obj)
    list_objs_scopes = self.get_list_objs_scopes_from_tree_view(src_obj)
    for index in xrange(len(list_objs_scopes)):
      self.add_review_status_if_not_in_control_scope(list_objs_scopes[index])
    return self._create_list_objs(entity_factory=self.entities_factory_cls,
                                  list_scopes=list_objs_scopes)

  def get_list_objs_from_mapper(self, src_obj, dest_objs):
    """Get and return list of objects from Unified Mapper Tree View and
     list of MappingStatusAttrs - namedtuples for mapping representation."""
    self._set_list_objs_scopes_repr_on_mapper_tree_view(src_obj)
    list_objs_scopes, mapping_statuses = (
        self._search_objs_via_tree_view(src_obj, dest_objs))
    self.get_unified_mapper(src_obj).close()
    for index in xrange(len(list_objs_scopes)):
      self.add_review_status_if_not_in_control_scope(list_objs_scopes[index])
    return self._create_list_objs(
        entity_factory=self.entities_factory_cls,
        list_scopes=list_objs_scopes), mapping_statuses

  def add_review_status_if_not_in_control_scope(self, scope):
    """Add review status when getting control from panel or tree view."""
    # pylint: disable=invalid-name
    from lib.constants.element import ReviewStates
    if (
        self.obj_name == objects.CONTROLS and
        all(attr not in scope for attr in ["REVIEW_STATUS",
                                           "REVIEW_STATUS_DISPLAY_NAME"])
    ):
      scope["REVIEW_STATUS"] = ReviewStates.UNREVIEWED
      scope["REVIEW_STATUS_DISPLAY_NAME"] = ReviewStates.UNREVIEWED

  def get_obj_from_info_page(self, obj):
    """Gets and returns object from Info page."""
    self.open_info_page_of_obj(obj)
    return self.build_obj_from_page()

  def get_list_objs_from_info_panels(self, src_obj, objs):
    """Get and return object or list of objects from Info panels navigate by
    objects' titles ('objs' can be list of objects or one object).
    """
    def get_obj_from_info_panel(src_obj, obj):
      """Get obj from info panel."""
      scope = self.get_scope_from_info_panel(src_obj, obj)
      self.add_review_status_if_not_in_control_scope(scope)
      return self._create_list_objs(
          entity_factory=self.entities_factory_cls, list_scopes=[scope])[0]
    return ([get_obj_from_info_panel(src_obj, obj) for obj in objs] if
            isinstance(objs, list) else
            get_obj_from_info_panel(src_obj, objs))

  def _normalize_list_scopes_from_csv(self, list_obj_scopes):
    """Returns objects scopes list from CSV with properly formatted keys."""
    list_scopes = []
    for item in list_obj_scopes:
      list_scopes.append({objects.get_normal_form(k).replace("*", ""): v
                          for k, v in item.iteritems()})
    if self.obj_name == objects.CONTROLS:
      for scope in list_scopes:
        scope["REVIEW_STATUS_DISPLAY_NAME"] = scope["Review Status"]
    return list_scopes

  def get_list_objs_from_csv(self, path_to_exported_file):
    """Get and return list of objects from CSV file of exported objects in
    test's temporary directory 'path_to_export_dir'.
    """
    dict_list_objs_scopes = file_utils.get_list_objs_scopes_from_csv(
        path_to_csv=path_to_exported_file)
    dict_key = dict_list_objs_scopes.iterkeys().next()
    # 'Control' to 'controls', 'Control Snapshot' to 'controls'
    obj_name_from_dict = objects.get_plural(
        string_utils.StringMethods.get_first_word_from_str(dict_key))
    if self.obj_name == obj_name_from_dict:
      list_scopes = self._normalize_list_scopes_from_csv(
          dict_list_objs_scopes[dict_key])
      return self._create_list_objs(
          entity_factory=self.entities_factory_cls,
          list_scopes=list_scopes)
    else:
      raise ValueError(messages.ExceptionsMessages.err_csv_format.
                       format(dict_list_objs_scopes))

  def create_obj_via_tree_view(self, src_obj, obj):
    """Open generic widget of mapped objects, open creation modal from
    Tree View, fill data according to object attributes and create new object.
    """
    self.open_widget_of_mapped_objs(src_obj).tree_view.open_create()
    object_modal.get_modal_obj(obj.type, self._driver).submit_obj(obj)

  def get_unified_mapper(self, src_obj):
    """Open generic widget of mapped objects, open unified mapper modal from
    Tree View.
    Return MapObjectsModal"""
    if self._unified_mapper is None:
      self._unified_mapper = (self.open_widget_of_mapped_objs(src_obj)
                              .tree_view.open_map())
    return self._unified_mapper

  def map_objs_via_tree_view(self, src_obj, dest_objs):
    """Open generic widget of mapped objects, open unified mapper modal from
    Tree View, fill data according to destination objects, search by them
    titles and then map to source object.
    """
    dest_objs_titles = [dest_obj.title for dest_obj in dest_objs]
    dest_objs_widget = self.open_widget_of_mapped_objs(src_obj)
    (dest_objs_widget.tree_view.open_map().
     map_dest_objs(dest_objs_type=dest_objs[0].type.title(),
                   dest_objs_titles=dest_objs_titles))
    self._driver.refresh()

  def _search_objs_via_tree_view(self, src_obj, dest_objs):
    """Open generic widget of mapped objects, open unified mapper modal from
    Tree View, fill data according to destination objects and search them.
    Return list of scopes (dicts) from members (text scopes) which displayed on
    Tree View according to current set of visible fields
    And list of MappingStatusAttrs namedtuples for mapping representation.
    """
    dest_objs_titles = [dest_obj.title for dest_obj in dest_objs]
    mapper = self.get_unified_mapper(src_obj)
    return mapper.search_dest_objs(
        dest_objs_type=dest_objs[0].type.title(),
        dest_objs_titles=dest_objs_titles), mapper.get_mapping_statuses()

  def get_count_objs_from_tab(self, src_obj):
    """Open generic widget of mapped objects, get count of objects from Tab
    navigation bar and return got count.
    """
    objs_widget = self.open_widget_of_mapped_objs(src_obj)
    return objs_widget.member_count

  def set_list_objs_scopes_representation_on_tree_view(self, src_obj):
    """Open generic widget of mapped objects, set visible fields for objects
    scopes representation on Tree View.
    """
    # pylint: disable=invalid-name
    objs_widget = self.open_widget_of_mapped_objs(src_obj)
    (objs_widget.tree_view.open_set_visible_fields().
     select_and_set_visible_fields())

  def _set_list_objs_scopes_repr_on_mapper_tree_view(self, src_obj):
    """Open generic widget of mapped objects, set visible fields for objects
    scopes representation on Unified Mapper Tree View.
    """
    # pylint: disable=invalid-name
    mapper = self.get_unified_mapper(src_obj)
    mapper.tree_view.open_set_visible_fields().select_and_set_visible_fields()

  def get_list_objs_scopes_from_tree_view(self, src_obj):
    """Open generic widget of mapped objects and get list of objects scopes as
    dicts from header (keys) and items (values) that displayed on Tree View.
    """
    # pylint: disable=invalid-name
    objs_widget = self.open_widget_of_mapped_objs(src_obj)
    return objs_widget.tree_view.get_list_members_as_list_scopes()

  def exported_objs_via_tree_view(self, path_to_export_dir, widget):
    """Exports objects to test's temporary directory as CSV file.
    Returns: list of objects from CSV file in test's temporary directory
    'path_to_export_dir'."""
    widget.tree_view.open_3bbs().select_export()
    page = export_page.ExportPage(self._driver)
    page.open_export_page()
    return self.get_list_objs_from_csv(
        page.download_obj_to_csv(path_to_export_dir))

  def get_scope_from_info_page(self, obj):
    """Open Info page of obj and get object scope as dict with titles (keys)
    and entered_titles (values) that displayed on Info widget.
    """
    obj_info_page = self.open_info_page_of_obj(obj)
    return obj_info_page.get_info_widget_obj_scope()

  def get_scope_from_info_panel(self, src_obj, obj):
    """Open Info panel of obj navigate by object title, maximize it and get
    object scope as dict with titles (keys) and entered_titles (values) that
    displayed on Info panel.
    """
    obj_info_panel = self.open_info_panel_of_mapped_obj(src_obj, obj)
    return obj_info_panel.get_info_widget_obj_scope()

  def is_obj_editable_via_info_panel(self, src_obj, obj):
    """Open generic widget of mapped objects, select object from Tree View
    by title and check via Info panel that object is editable.
    """
    dropdown_on_info_panel = (
        self.open_info_panel_of_mapped_obj(src_obj, obj).three_bbs)
    return dropdown_on_info_panel.edit_option.exists

  def is_obj_unmappable_via_info_panel(self, src_obj, obj):
    """""Open generic widget of mapped objects, select object from Tree View
    by title open dropdown on Info Panel and check that object is unmappable.
    """
    # pylint: disable=invalid-name
    dropdown_on_info_panel = (
        self.open_info_panel_of_mapped_obj(src_obj, obj).three_bbs)
    return dropdown_on_info_panel.unmap_option.exists

  def is_obj_page_exist_via_info_panel(self, src_obj, obj):
    """Open generic widget of mapped objects, select object from Tree View
    by title and check via Info panel that object page is exist.
    """
    # pylint: disable=invalid-name
    return self.open_info_panel_of_mapped_obj(
        src_obj, obj).three_bbs.open_option.exists

  def filter_and_get_list_objs_from_tree_view(self, src_obj, filter_exp):
    """Filter by specified criteria and return list of objects from Tree
    View.
    """
    # pylint: disable=invalid-name
    objs_widget = self.open_widget_of_mapped_objs(src_obj)
    objs_widget.filter.perform_query(filter_exp)
    return self.get_list_objs_from_tree_view(src_obj)

  def is_obj_mappable_via_tree_view(self, src_obj, obj):
    """Open dropdown of Tree View Item by title on source object's widget,
    and check is object mappable."""
    return (self.open_widget_of_mapped_objs(src_obj).tree_view.
            open_tree_actions_dropdown_by_title(title=obj.title).
            is_item_exist(element.DropdownMenuItemTypes.MAP))

  def is_obj_editable_via_tree_view(self, obj):
    """Open dropdown of Tree View Item by title on dashboard tab of object,
    and check is object editable."""
    return (self.open_obj_dashboard_tab().tree_view.
            open_tree_actions_dropdown_by_title(title=obj.title).
            is_item_exist(element.DropdownMenuItemTypes.EDIT))

  def map_objs_via_tree_view_item(self, src_obj, dest_objs):
    """Open generic widget of mapped objects, open unified mapper modal from
    Tree View, fill data according to destination objects, search by them
    titles and then map to source object.
    """
    dest_objs_titles = [dest_obj.title for dest_obj in dest_objs]
    objs_widget = self.open_widget_of_mapped_objs(src_obj)
    objs_tree_view_items = (
        objs_widget.tree_view.get_list_members_as_list_scopes())
    for obj in objs_tree_view_items:
      dropdown = objs_widget.tree_view.open_tree_actions_dropdown_by_title(
          title=obj['TITLE'])
      dropdown.select_map().map_dest_objs(
          dest_objs_type=dest_objs[0].type.title(),
          dest_objs_titles=dest_objs_titles)

  def unmap_via_info_panel(self, src_obj, obj):
    """Open info panel of 'obj' from generic widget of 'src_obj'. Then unmap
    this by click on "Unmap" button.
    """
    dropdown_on_info_panel = (
        self.open_info_panel_of_mapped_obj(src_obj, obj).three_bbs)
    dropdown_on_info_panel.unmap_option.click()

  def get_objs_available_to_map_via_mapper(self, src_obj):
    """Open unified mapper of object from treeview and return list of strings
    from "object types" dropdown.
    """
    # pylint: disable=invalid-name
    objs_widget = self.open_widget_of_mapped_objs(src_obj)
    first_tree_view_item = (
        objs_widget.tree_view.get_list_members_as_list_scopes()[0])
    dropdown = objs_widget.tree_view.open_tree_actions_dropdown_by_title(
        title=first_tree_view_item[element.Common.TITLE.upper()])
    return sorted(dropdown.select_map().get_available_to_map_obj_aliases())

  def get_objs_available_to_map_via_add_widget(self, src_obj):
    """Open Info Widget of source object. Clock 'add widget' button. Return
    list of objects names from 'add widget' dropdown available to map with
    source object.
    """
    # pylint: disable=invalid-name
    self.open_info_page_of_obj(src_obj)
    return sorted(dashboard.Dashboard(
        self._driver).get_mappable_via_add_widgets_objs_aliases())

  def is_dashboard_tab_exist(self, obj):
    """Navigate to InfoPage of object and check is 'Dashboard' tab exist.
      - Return: bool.
    """
    self.open_info_page_of_obj(obj)
    return dashboard.Dashboard(self._driver).is_dashboard_tab_exist()

  def get_items_from_dashboard_widget(self, obj):
    """Navigate to InfoPage of object. Open 'Dashboard' tab and return
    all urls of dashboard items.
      - Return: list of str
    """
    self.open_info_page_of_obj(obj)
    dashboard_widget_elem = (
        dashboard.Dashboard(self._driver).select_dashboard_tab())
    return tab_containers.DashboardWidget(
        self._driver, dashboard_widget_elem).get_all_tab_names_and_urls()

  def get_dashboard_content(self, obj):
    """Navigate to InfoPage of object, open dashboard tab and return it's
    content."""
    self.open_info_page_of_obj(obj)
    dashboard_widget_elem = generic_widget.CADashboard(self._driver)
    dashboard_widget_elem.select_dashboard_tab()
    return dashboard_widget_elem.active_dashboard_tab_elem

  def get_obj_related_asmts_titles(self, obj):
    """Open obj Info Page. Click Assessments button to open
    Related Assessments modal. Return list of Related Assessments Titles.
    """
    obj_page = self.open_info_page_of_obj(obj)
    related_asmts_table = obj_page.show_related_assessments()
    return related_asmts_table.get_related_titles(asmt_type=obj.type)

  def fill_asmt_lcas(self, obj, custom_attributes):
    """Open obj Info Page. Fill local custom attributes."""
    obj_page = self.open_info_page_of_obj(obj)
    obj_page.fill_local_cas(custom_attributes)

  def fill_obj_gcas_in_popup(self, obj, custom_attributes):
    """Open obj Info Page. Fill global custom attributes using Edit popup."""
    obj_page = self.open_info_page_of_obj(obj)
    obj_page.fill_global_cas_in_popup(custom_attributes)

  def fill_obj_gcas_inline(self, obj, custom_attributes):
    """Open obj Info Page. Fill global custom attributes inline."""
    obj_page = self.open_info_page_of_obj(obj)
    obj_page.fill_global_cas_inline(custom_attributes)

  def has_gca_inline_edit(self, obj, ca_title):
    """Checks if edit_inline is open for selected gca."""
    return self.open_info_page_of_obj(obj).has_ca_inline_edit(ca_title)

  def edit_obj_via_edit_modal_from_info_page(self, obj):
    """Open generic widget of object, open edit modal from drop down menu.
    Modify current title and code and then apply changes by pressing
    'save and close' button.
    """
    # pylint: disable=invalid-name
    self.edit_obj(obj, title="[EDITED]" + obj.title)
    return self.info_widget_cls(self._driver)

  def edit_obj(self, obj, **changes):
    """Opens `obj` and makes `changes` using Edit modal."""
    obj_info_page = self.open_info_page_of_obj(obj)
    obj_info_page.three_bbs.select_edit()
    modal = object_modal.get_modal_obj(obj.type, self._driver)
    modal.fill_form(**changes)
    modal.save_and_close()

  def submit_for_review(self, obj, user_email, comment_msg):
    """Submit object for review scenario."""
    self.open_info_page_of_obj(obj).open_submit_for_review_popup()
    request_review.RequestReviewModal(self._driver).fill_and_submit(
        user_email, comment_msg)

  def approve_review(self, obj):
    """Approve review scenario."""
    self.open_info_page_of_obj(obj).click_approve_review()
    ui_utils.wait_for_alert("Review is complete.")

  def undo_review_approval(self, obj):
    """Undo obj review approval."""
    self.open_info_page_of_obj(obj).click_undo_button()

  def get_obj_review_txt(self, obj):
    """Return review message on info pane."""
    return self.open_info_page_of_obj(obj).get_object_review_txt()

  def open_tab_via_add_tab_btn(self, src_obj, tab_name):
    """Opens info page of src_obj, clicks Add tab button and chooses tab by
    it's name."""
    (self.open_info_page_of_obj(src_obj).click_add_tab_btn().
        click_item_by_text(text=tab_name))


class SnapshotsWebUiService(BaseWebUiService):
  """Class for snapshots business layer's services objects."""
  def __init__(self, obj_name, is_versions_widget, driver=None):
    super(SnapshotsWebUiService, self).__init__(obj_name, driver)
    self.is_versions_widget = is_versions_widget
    self.snapshot_obj_type = objects.get_singular(
        objects.SNAPSHOTS, title=True)
    if self.is_versions_widget:
      self.url_mapped_objs = (
          "{src_obj_url}" + url.Utils.get_widget_name_of_mapped_objs(
              self.obj_name, self.is_versions_widget))

  def update_obj_ver_via_info_panel(self, src_obj, obj):
    """Open generic widget of mapped objects, select snapshotable object from
    Tree View by title and update object to latest version via Info panel.
    """
    objs_widget = self.open_widget_of_mapped_objs(src_obj)
    obj_info_panel = (
        objs_widget.tree_view.select_member_by_title(title=obj.title).panel)
    obj_info_panel.get_latest_version()
    objs_widget.tree_view.wait_loading_after_actions()

  def is_obj_updateble_via_info_panel(self, src_obj, obj):
    """Open generic widget of mapped objects, select snapshotable object from
    Tree View by title and check via Info panel that object is updateble.
    """
    return self.open_info_panel_of_mapped_obj(
        src_obj, obj).panel.has_link_to_get_latest_version()


class AuditsService(BaseWebUiService):
  """Class for Audits business layer's services objects."""
  def __init__(self, driver=None):
    super(AuditsService, self).__init__(objects.AUDITS, driver)

  def clone_via_info_page_and_get_obj(self, audit_obj):
    """Open Info page of Audit object and clone it including Assessment
    Templates via Info widget. Redirect to cloned Audit, get and return Audit
    object from Info page.
    """
    audit_info_page = self.open_info_page_of_obj(audit_obj)
    (audit_info_page.
     three_bbs.select_clone().confirm_clone(is_full=True))
    cloned_audit_obj = self.entities_factory_cls().obj_inst().update_attrs(
        url=url.Utils.get_src_obj_url(self._driver.current_url))
    actual_cloned_audit_obj = self.get_obj_from_info_page(obj=cloned_audit_obj)
    self._driver.refresh()
    return actual_cloned_audit_obj.update_attrs(url=cloned_audit_obj.url)

  def bulk_update_via_info_page(self, audit_obj):
    """Open Info page of Audit object and bulk update objects to
    latest version.
    """
    audit_info_page = self.open_info_page_of_obj(audit_obj)
    audit_info_page.three_bbs.select_update_objs().confirm_update()


class AssessmentTemplatesService(BaseWebUiService):
  """Class for AssessmentTemplates business layer's services objects."""
  def __init__(self, driver=None):
    super(AssessmentTemplatesService, self).__init__(
        objects.ASSESSMENT_TEMPLATES, driver)


class AssessmentsService(BaseWebUiService):
  """Class for Assessments business layer's services objects."""
  def __init__(self, driver=None):
    super(AssessmentsService, self).__init__(
        objects.ASSESSMENTS, driver)

  def add_comments(self, src_obj, obj, comment_objs):
    """Open Info Panel of 'obj' navigate by object's title, maximize it and
    add comments according to 'comment_objs' descriptions, return
    'CommentsPanel' class after adding of comments.
    """
    comments_descriptions = tuple(
        comment_obj.description for comment_obj in comment_objs)
    obj_info_panel = self.open_info_panel_of_mapped_obj(src_obj, obj)
    return obj_info_panel.comments_panel.add_comments(comments_descriptions)

  def generate_objs_via_tree_view(self, src_obj, objs_under_asmt,
                                  asmt_tmpl_obj=None):
    """Open generic widget of mapped objects, open Generation modal from
    Tree View, fill data according to objects under Assessment
    and if 'asmt_tmpl_obj' then to Assessment Template title, generate
    new Assessment(s).
    """
    objs_under_asmt_titles = [obj_under.title for obj_under in objs_under_asmt]
    objs_widget = self.open_widget_of_mapped_objs(src_obj)
    asmt_tmpl_title = asmt_tmpl_obj.title if asmt_tmpl_obj else None
    (objs_widget.tree_view.open_3bbs().select_generate().
     generate_asmts(asmt_tmpl_title=asmt_tmpl_title,
                    objs_under_asmt_titles=objs_under_asmt_titles))
    objs_widget.show_generated_results()

  def get_asmt_related_asmts_titles(self, asmt):
    """Open assessment Info Page. Open Related Assessments Tab on Assessment
    Info Page. And return list of related Assessments Titles.
    """
    asmt_page = self.open_info_page_of_obj(obj=asmt)
    return asmt_page.related_assessments_table.get_related_titles(
        asmt_type=asmt.assessment_type)

  def get_related_issues_titles(self, obj):
    """Open assessment Info Page. Open Open Related Issues Tab on Assessment
    Info Page. And return list of related Issues Titles.
    """
    asmt_page = self.open_info_page_of_obj(obj=obj)
    return [issue[element.RelatedIssuesTab.TITLE.upper()]
            for issue in asmt_page.related_issues_table.get_items()]

  def raise_issue(self, src_obj, issue_obj):
    """Open assessment Info Page by 'src_obj'. Open Related Issues Tab on
    Assessment Info Page and raise Issue.
    """
    asmt_page = self.open_info_page_of_obj(obj=src_obj)
    asmt_page.related_issues_table.raise_issue(issue_entity=issue_obj)

  def complete_assessment(self, obj):
    """Navigate to info page of object according to URL of object then find and
    click 'Complete' button then return info page of object in new state"""
    info_widget = self.open_info_page_of_obj(obj)
    initial_state = info_widget.status()
    info_widget.click_complete()

    def wait_for_status_to_change():
      """Waits for status to become completed."""
      return self.info_widget_cls(self._driver).status() != initial_state
    test_utils.wait_for(wait_for_status_to_change)
    ui_utils.wait_for_spinner_to_disappear()

  def verify_assessment(self, obj):
    """Navigate to info page of object according to URL of object then find and
    click 'Verify' button then return info page of object in new state"""
    from lib.constants.locator import ObjectWidget
    self.open_info_page_of_obj(obj).click_verify()
    for elem in [ObjectWidget.HEADER_STATE_COMPLETED,
                 locator.WidgetInfoAssessment.ICON_VERIFIED]:
      selenium_utils.wait_until_element_visible(self._driver, elem)
    return self.info_widget_cls(self._driver)

  def reject_assessment(self, obj):
    """Navigate to info page of object according to URL of object then find and
    click 'Needs Rework' button then return info page of object in new state.
    """
    self.open_info_page_of_obj(obj).click_needs_rework()
    return self.info_widget_cls(self._driver)

  def deprecate_assessment(self, obj):
    """Deprecate an object"""
    page = self.open_info_page_of_obj(obj)
    page.three_bbs.select_deprecate()
    page.wait_save()

  def edit_assessment_answers(self, obj):
    """Edit answers of assessment"""
    page = self.open_info_page_of_obj(obj)
    page.edit_answers()

  def add_evidence_urls(self, obj, urls):
    """Add evidence urls for `obj` (audit or asmt)"""
    page = self.open_info_page_of_obj(obj)
    for evidence_url in urls:
      page.evidence_urls.add_url(evidence_url)
      page.wait_save()

  def add_primary_contact(self, obj, person):
    """Add a primary contact to `obj`"""
    page = self.open_info_page_of_obj(obj)
    page.primary_contacts.add_person(person)
    page.wait_save()

  def add_asignee(self, obj, person):
    """Add an assignee to 'obj'."""
    page = self.open_info_page_of_obj(obj)
    page.assignees.add_person(person)
    page.wait_save()

  def map_objs_in_edit_modal(self, obj, objs_to_map):
    """Open ModalEdit from InfoPage of object. Open 3BBS. Select 'Edit' button
    and map snapshots from mapped_objects attribute of passed object.
    """
    self.open_info_page_of_obj(obj).three_bbs.select_edit()
    modal = object_modal.AssessmentModal(self._driver)
    modal.map_objects(objs_to_map)
    modal.save_and_close()

  def choose_and_fill_dropdown_lca(self, asmt, dropdown, **kwargs):
    """Fill dropdown LCA for Assessment."""
    asmt_info = self.open_info_page_of_obj(asmt)
    asmt_info.choose_and_fill_dropdown_lca(dropdown, **kwargs)

  def get_snapshots_which_are_related_to_control_snapshot(self, asmt, control,
                                                          obj_type):
    """Returns list of specific type snapshots which are related to control
    snapshot."""
    # pylint: disable=invalid-name
    return (self.open_info_page_of_obj(asmt).open_mapped_control_snapshot_info(
        control).get_related_snapshots(obj_type))

  def open_my_assessments_page(self):
    """Opens 'My Assessments' page via URL and sets status filter to display
     Assessments in all states.
    Returns:
      MyAssessments page."""
    page = dashboard.MyAssessments()
    selenium_utils.open_url(page.my_assessments_url)
    selenium_utils.wait_for_js_to_load(self._driver)
    page.status_filter_dropdown.select_all()
    return page

  def get_objs_from_bulk_update_modal(self, modal_element,
                                      with_second_tier_info=False):
    """Returns assessments objects from bulk verify modal.
    Attrs 'comments', 'evidence_urls' and 'mapped_objects' are collected if
    with_second_tier_info is set to True."""
    scopes_list = modal_element.select_assessments_section.get_objs_scopes(
        with_second_tier_info)
    return self._create_list_objs(self.entities_factory_cls, scopes_list)


class ControlsService(SnapshotsWebUiService):
  """Class for Controls business layer's services objects."""
  def __init__(self, driver=None, is_versions_widget=False):
    super(ControlsService, self).__init__(
        objects.CONTROLS, is_versions_widget, driver)


class ObjectivesService(SnapshotsWebUiService):
  """Class for Objectives business layer's services objects."""
  def __init__(self, driver=None, is_versions_widget=False):
    super(ObjectivesService, self).__init__(
        objects.OBJECTIVES, is_versions_widget, driver)


class RisksService(SnapshotsWebUiService):
  """Class for Risks business layer's services objects."""
  def __init__(self, driver=None, is_versions_widget=False):
    super(RisksService, self).__init__(
        objects.RISKS, is_versions_widget, driver)


class OrgGroupsService(SnapshotsWebUiService):
  """Class for Org Groups business layer's services objects."""
  def __init__(self, driver=None, is_versions_widget=False):
    super(OrgGroupsService, self).__init__(
        objects.ORG_GROUPS, is_versions_widget, driver)


class IssuesService(BaseWebUiService):
  """Class for Issues business layer's services objects."""
  def __init__(self, driver=None):
    super(IssuesService, self).__init__(objects.ISSUES, driver)


class TechnologyEnvironmentService(BaseWebUiService):
  """Class for Technology Environments business layer's services objects."""
  def __init__(self, driver=None):
    super(TechnologyEnvironmentService, self).__init__(
        objects.TECHNOLOGY_ENVIRONMENTS, driver)


class ProgramsService(BaseWebUiService):
  """Class for Programs business layer's services objects."""

  def __init__(self, driver=None, obj_name=objects.PROGRAMS):
    self._actual_obj_name = obj_name
    self.obj_name = objects.PROGRAMS
    super(ProgramsService, self).__init__(
        obj_name=self.obj_name, driver=driver)
    self.url_mapped_objs = (
        "{src_obj_url}" +
        url.Utils.get_widget_name_of_mapped_objs(self._actual_obj_name))

  def open_widget_of_mapped_objs(self, src_obj):
    """Navigates to URL of mapped Programs according to URL of
    source object.
    Returns: Programs widget class.
    """
    generic_widget_url = self.url_mapped_objs.format(src_obj_url=src_obj.url)
    # todo fix freezing when navigate through tabs by URLs and using driver.get
    selenium_utils.open_url(generic_widget_url, is_via_js=True)
    return generic_widget.Programs(self._driver, self._actual_obj_name)

  def add_and_map_obj_widget(self, obj):
    """Adds widget of selected type and
    click `Create and map new object` link and
    returns modal object for selected object type."""
    widget_bar.Programs().add_widget()
    dashboard.CreateObjectDropdown().click_item_by_text(
        text=objects.get_normal_form(obj))
    obj_modal = unified_mapper.CommonUnifiedMapperModal(
        self._driver, obj).click_create_and_map_obj()
    return obj_modal


class ProductsService(BaseWebUiService):
  """Class for Products business layer's services objects."""
  def __init__(self, driver=None):
    super(ProductsService, self).__init__(objects.PRODUCTS, driver)


class RegulationsService(BaseWebUiService):
  """Class for Regulations business layer's services objects."""
  def __init__(self, driver=None):
    super(RegulationsService, self).__init__(objects.REGULATIONS, driver)


class TechnologyEnvironmentsService(BaseWebUiService):
  """Class for Technology Environments business layer's services objects."""
  def __init__(self, driver=None):
    super(TechnologyEnvironmentsService, self).__init__(
        objects.TECHNOLOGY_ENVIRONMENTS, driver)
