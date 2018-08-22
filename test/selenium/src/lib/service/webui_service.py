# Copyright (C) 2018 Google Inc.
# Licensed under http://www.apache.org/licenses/LICENSE-2.0 <see LICENSE file>
"""Services for create and manipulate objects via UI."""
import os
import re

from dateutil import parser, tz

from lib import factory, url
from lib.constants import objects, messages, element, regex
from lib.constants.locator import WidgetInfoAssessment
from lib.element.tab_containers import DashboardWidget
from lib.entities.entity import Representation
from lib.page import dashboard
from lib.page.widget.info_widget import SnapshotedInfoPanel
from lib.utils import selenium_utils, file_utils, conftest_utils
from lib.utils.string_utils import StringMethods, Symbols


class BaseWebUiService(object):
  """Base class for business layer's services objects."""
  # pylint: disable=too-many-instance-attributes
  # pylint: disable=too-many-public-methods
  def __init__(self, driver, obj_name):
    self.driver = driver
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
        StringMethods.dict_keys_to_upper_case(scope) for scope in list_scopes]
    list_scopes_to_convert = StringMethods.exchange_dicts_items(
        transform_dict=Representation.remap_collection(),
        dicts=list_scopes_with_upper_keys, is_keys_not_values=True)
    # convert and represent values in scopes
    for scope in list_scopes_to_convert:
      # convert u'None', u'No person' to None type
      StringMethods.update_dicts_values(scope, ["None", "No person"], None)
      for key, val in scope.iteritems():
        if val:
          if key in ["mandatory", "verified"]:
            # convert u'false', u'true' like to Boolean
            scope[key] = StringMethods.get_bool_value_from_arg(val)
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
                                         Symbols.BLANK, v)
                                  ).astimezone(tz=tz.tzutc())
                     if k == "created_at" else v)
                 for k, v in comment.iteritems()} for comment in val]
          # convert multiple values to list of strings and split if need it
          if (key in Representation.people_attrs_names and
             not isinstance(val, list)):
            # split Tree View values if need 'Ex1, Ex2 F' to ['Ex1', 'Ex2 F']
            # Info Widget values will be represent by internal methods
            scope[key] = val.split(", ")
          # convert 'slug' from CSV for snapshoted objects u'*23eb72ac-4d9d'
          if (key == "slug" and
                  (self.obj_name in objects.ALL_SNAPSHOTABLE_OBJS) and
                  Symbols.STAR in val):
            scope[key] = val.replace(Symbols.STAR, Symbols.BLANK)
    return [
        factory_obj.update_attrs(is_allow_none=True, **scope) for
        scope, factory_obj in zip(list_scopes_to_convert, list_factory_objs)]

  def create_obj(self):
    """Create object via LHN"""
    obj_info_page = conftest_utils.create_obj_via_lhn(
        self.driver, getattr(element.Lhn, self.obj_name.upper()))
    scope = obj_info_page.get_info_widget_obj_scope()
    obj = self._create_list_objs(
        entity_factory=self.entities_factory_cls, list_scopes=[scope])[0]
    obj.url = self.driver.current_url
    return obj

  def open_widget_of_mapped_objs(self, src_obj):
    """Navigate to generic widget URL of mapped objects according to URL of
    source object and return generic widget class of mapped objects.
    """
    generic_widget_url = self.url_mapped_objs.format(src_obj_url=src_obj.url)
    # todo fix freezing when navigate through tabs by URLs and using driver.get
    selenium_utils.open_url(self.driver, generic_widget_url, is_via_js=True)
    return self.generic_widget_cls(self.driver, self.obj_name)

  def open_info_page_of_obj(self, obj):
    """Navigate to info page URL of object according to URL of object and
    return info widget class of object.
    """
    info_page_url = self.url_obj_info_page.format(
        obj_url=obj.url)
    selenium_utils.open_url(self.driver, info_page_url)
    return self.info_widget_cls(self.driver)

  def open_info_panel_of_obj_by_title(self, src_obj, obj):
    """Navigate to info panel URL of object according to URL of source object
    and URL of mapped object return generic widget class of mapped objects.
    """
    objs_widget = self.open_widget_of_mapped_objs(src_obj)
    obj_info_panel = (objs_widget.tree_view.
                      select_member_by_title(title=obj.title))
    return obj_info_panel

  def get_list_objs_from_tree_view(self, src_obj):
    """Get and return list of objects from Tree View."""
    self.set_list_objs_scopes_representation_on_tree_view(src_obj)
    list_objs_scopes = self.get_list_objs_scopes_from_tree_view(src_obj)
    return self._create_list_objs(entity_factory=self.entities_factory_cls,
                                  list_scopes=list_objs_scopes)

  def get_list_objs_from_mapper(self, src_obj, dest_objs):
    """Get and return list of objects from Unified Mapper Tree View and
     list of MappingStatusAttrs - namedtuples for mapping representation."""
    self._set_list_objs_scopes_repr_on_mapper_tree_view(src_obj)
    list_objs_scopes, mapping_statuses = (
        self._search_objs_via_tree_view(src_obj, dest_objs))
    self._get_unified_mapper(src_obj).close_modal()
    return self._create_list_objs(
        entity_factory=self.entities_factory_cls,
        list_scopes=list_objs_scopes), mapping_statuses

  def get_obj_from_info_page(self, obj):
    """Get and return object from Info page."""
    scope = self.get_scope_from_info_page(obj)
    return self._create_list_objs(
        entity_factory=self.entities_factory_cls, list_scopes=[scope])[0]

  def get_list_objs_from_info_panels(self, src_obj, objs):
    """Get and return object or list of objects from Info panels navigate by
    objects' titles ('objs' can be list of objects or one object).
    """
    def get_obj_from_info_panel(src_obj, obj):
      scope = self.get_scope_from_info_panel(src_obj, obj)
      return self._create_list_objs(
          entity_factory=self.entities_factory_cls, list_scopes=[scope])[0]
    return ([get_obj_from_info_panel(src_obj, obj) for obj in objs] if
            isinstance(objs, list) else
            get_obj_from_info_panel(src_obj, objs))

  def get_list_objs_from_csv(self, path_to_exported_file):
    """Get and return list of objects from CSV file of exported objects in
    test's temporary directory 'path_to_export_dir'.
    """
    # pylint: disable=invalid-name
    dict_list_objs_scopes = file_utils.get_list_objs_scopes_from_csv(
        path_to_csv=path_to_exported_file)
    dict_key = dict_list_objs_scopes.iterkeys().next()
    # 'Control' to 'controls', 'Control Snapshot' to 'controls'
    obj_name_from_dict = objects.get_plural(
        StringMethods.get_first_word_from_str(dict_key))
    if self.obj_name == obj_name_from_dict:
      return self._create_list_objs(
          entity_factory=self.entities_factory_cls,
          list_scopes=dict_list_objs_scopes[dict_key])
    else:
      raise ValueError(messages.ExceptionsMessages.err_csv_format.
                       format(dict_list_objs_scopes))

  def create_obj_via_tree_view(self, src_obj, obj):
    """Open generic widget of mapped objects, open creation modal from
    Tree View, fill data according to object attributes and create new object.
    """
    self._open_create_modal_and_fill_data(src_obj, obj).save_and_close()

  def export_objs_via_tree_view(self, path_to_export_dir, src_obj):
    # pylint: disable=fixme
    """Open generic widget of mapped objects, open modal of export from
    Tree View, fill data according to 'src_objs' (filter by mapping to source
    objects), 'mapped_objs' (export objects' types, export objects' filter
    queries) and export objects to test's temporary directory as CSV file.
    Get and return path to the exported file.
    """
    objs_widget = self.open_widget_of_mapped_objs(src_obj)
    path_to_exported_file = objs_widget.tree_view.open_3bbs().select_export(
    ).export_objs_to_csv(path_to_export_dir)
    # FIXME: Filename was "{obj_type} {snapshot_obj_type}
    # before migration of export page on background job.
    # Current behavior may be a bug.
    if self.snapshot_obj_type:
      obj_part = self.snapshot_obj_type
    else:
      obj_part = self.obj_type
    obj_part = "{}_".format(obj_part)
    assert os.path.basename(path_to_exported_file).startswith(obj_part) is True
    return path_to_exported_file

  def _get_unified_mapper(self, src_obj):
    """Open generic widget of mapped objects, open unified mapper modal from
    Tree View.
    Return unified_mapper.MapObjectsModal"""
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
    self.driver.refresh()

  def _search_objs_via_tree_view(self, src_obj, dest_objs):
    """Open generic widget of mapped objects, open unified mapper modal from
    Tree View, fill data according to destination objects and search them.
    Return list of scopes (dicts) from members (text scopes) which displayed on
    Tree View according to current set of visible fields
    And list of MappingStatusAttrs namedtuples for mapping representation.
    """
    dest_objs_titles = [dest_obj.title for dest_obj in dest_objs]
    mapper = self._get_unified_mapper(src_obj)
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
    mapper = self._get_unified_mapper(src_obj)
    mapper.tree_view.open_set_visible_fields().select_and_set_visible_fields()

  def get_list_objs_scopes_from_tree_view(self, src_obj):
    """Open generic widget of mapped objects and get list of objects scopes as
    dicts from header (keys) and items (values) that displayed on Tree View.
    """
    # pylint: disable=invalid-name
    objs_widget = self.open_widget_of_mapped_objs(src_obj)
    return objs_widget.tree_view.get_list_members_as_list_scopes()

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
    obj_info_panel = self.open_info_panel_of_obj_by_title(src_obj, obj)
    return obj_info_panel.get_info_widget_obj_scope()

  def is_obj_editable_via_info_panel(self, src_obj, obj):
    """Open generic widget of mapped objects, select object from Tree View
    by title and check via Info panel that object is editable.
    """
    dropdown_on_info_panel = (
        self.open_info_panel_of_obj_by_title(src_obj, obj).open_info_3bbs())
    element_to_verify = element.DropdownMenuItemTypes.EDIT
    return dropdown_on_info_panel.is_item_exist(element_to_verify)

  def is_obj_unmappable_via_info_panel(self, src_obj, obj):
    """""Open generic widget of mapped objects, select object from Tree View
    by title open dropdown on Info Panel and check that object is unmappable.
    """
    # pylint: disable=invalid-name
    dropdown_on_info_panel = (
        self.open_info_panel_of_obj_by_title(src_obj, obj).open_info_3bbs())
    element_to_verify = element.DropdownMenuItemTypes.UNMAP
    return dropdown_on_info_panel.is_item_exist(element_to_verify)

  def is_obj_page_exist_via_info_panel(self, src_obj, obj):
    """Open generic widget of mapped objects, select object from Tree View
    by title and check via Info panel that object page is exist.
    """
    # pylint: disable=invalid-name
    dropdown_on_info_panel = (
        self.open_info_panel_of_obj_by_title(src_obj, obj).open_info_3bbs())
    element_to_verify = element.DropdownMenuItemTypes.OPEN
    return dropdown_on_info_panel.is_item_enabled(element_to_verify)

  def filter_and_get_list_objs_from_tree_view(self, src_obj, filter_exp):
    """Filter by specified criteria and return list of objects from Tree
    View.
    """
    # pylint: disable=invalid-name
    objs_widget = self.open_widget_of_mapped_objs(src_obj)
    objs_widget.filter.perform_query(filter_exp)
    return self.get_list_objs_from_tree_view(src_obj)

  def is_obj_mappable_via_tree_view(self, src_obj, obj):
    """Open dropdown of Tree View Item  by title, an check is object
    mappable.
    """
    objs_widget = self.open_widget_of_mapped_objs(src_obj)
    dropdown_on_tree_view_item = (objs_widget.tree_view.
                                  open_tree_actions_dropdown_by_title
                                  (title=obj.title))
    element_to_verify = element.DropdownMenuItemTypes.MAP
    return dropdown_on_tree_view_item.is_item_exist(element_to_verify)

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
        self.open_info_panel_of_obj_by_title(src_obj, obj).open_info_3bbs())
    dropdown_on_info_panel.select_unmap()

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
        self.driver).get_mappable_via_add_widgets_objs_aliases())

  def _open_create_modal_and_fill_data(self, src_obj, obj):
    """Open generic widget of mapped objects, open creation modal from
    Tree View, fill minimal data according to object attributes.
      - Return: "Create New Object", according to object type.
    """
    # pylint: disable=invalid-name
    modal_create = (self.open_widget_of_mapped_objs(src_obj).
                    tree_view.open_create())
    modal_create.fill_minimal_data(title=obj.title, code=obj.slug)
    return modal_create

  def is_dashboard_tab_exist(self, obj):
    """Navigate to InfoPage of object and check is 'Dashboard' tab exist.
      - Return: bool.
    """
    self.open_info_page_of_obj(obj)
    return dashboard.Dashboard(self.driver).is_dashboard_tab_exist()

  def get_items_from_dashboard_widget(self, obj):
    """Navigate to InfoPage of object. Open 'Dashboard' tab and return
    all urls of dashboard items.
      - Return: list of str
    """
    self.open_info_page_of_obj(obj)
    dashboard_widget_elem = (
        dashboard.Dashboard(self.driver).select_dashboard_tab())
    return DashboardWidget(
        self.driver, dashboard_widget_elem).get_all_tab_names_and_urls()

  def get_obj_related_asmts_titles(self, obj):
    """Open obj Info Page. Click Assessments button to open
    Related Assessments modal. Return list of Related Assessments Titles.
    """
    obj_page = self.open_info_page_of_obj(obj)
    related_asmts_table = obj_page.show_related_assessments()
    return related_asmts_table.get_related_titles(asmt_type=obj.type)

  def open_info_page_of_obj_fill_lca(self, obj):
    """Open obj Info Page. Populate local custom attributes with random values.
    Only Date population implemented.
    """
    ca_values = self.open_info_page_of_obj(obj).fill_lcas_attr_values()
    updated_attrs = self.set_custom_attr_values(obj, ca_values)
    obj.update_attrs(custom_attribute_values=updated_attrs)
    return obj

  @staticmethod
  def set_custom_attr_values(obj, cas):
    """Update custom attribute values in custom_attribute_definitions"""
    attrs = []
    for attr_name, attr_value in cas.iteritems():
      for attr in obj.custom_attribute_definitions:
        if attr['title'].upper() == attr_name.upper():
          attrs.append({'custom_attribute_id': attr['id'],
                        'attribute_value': attr_value})
    return attrs


class SnapshotsWebUiService(BaseWebUiService):
  """Class for snapshots business layer's services objects."""
  def __init__(self, driver, obj_name, is_versions_widget):
    super(SnapshotsWebUiService, self).__init__(driver, obj_name)
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
    obj_info_panel.open_link_get_latest_ver().confirm_update()
    objs_widget.tree_view.wait_loading_after_actions()
    selenium_utils.get_when_invisible(
        self.driver, SnapshotedInfoPanel.locator_link_get_latest_ver)

  def is_obj_updateble_via_info_panel(self, src_obj, obj):
    """Open generic widget of mapped objects, select snapshotable object from
    Tree View by title and check via Info panel that object is updateble.
    """
    obj_info_panel = (self.open_info_panel_of_obj_by_title(src_obj, obj).panel)
    return obj_info_panel.is_link_get_latest_ver_exist()

  def submit_obj_for_review(self, obj, usr_email):
    """Submit control for review scenario."""
    widget = self.open_info_page_of_obj(obj)
    widget.open_submit_for_review_popup()
    widget.select_assignee_user(usr_email)
    widget.select_first_available_date()
    widget.click_submit()
    return self.info_widget_cls(self.driver)

  def decline_review(self, obj, comment_msg):
    """Decline review scenario."""
    widget = self.open_info_page_of_obj(obj)
    widget.click_decline_review()
    widget.leave_decline_comment(comment_msg)
    widget.click_save_and_close_on_decline()
    return self.info_widget_cls(self.driver)

  def approve_review(self, obj):
    """Approve review scenario."""
    widget = self.open_info_page_of_obj(obj)
    widget.click_approve_review()
    selenium_utils.wait_for_js_to_load(self.driver)
    return self.info_widget_cls(self.driver)


class AuditsService(BaseWebUiService):
  """Class for Audits business layer's services objects."""
  def __init__(self, driver):
    super(AuditsService, self).__init__(driver, objects.AUDITS)

  def clone_via_info_page_and_get_obj(self, audit_obj):
    """Open Info page of Audit object and clone it including Assessment
    Templates via Info widget. Redirect to cloned Audit, get and return Audit
    object from Info page.
    """
    audit_info_page = self.open_info_page_of_obj(audit_obj)
    (audit_info_page.
     open_info_3bbs().select_clone().confirm_clone(is_full=True))
    cloned_audit_obj = self.entities_factory_cls().obj_inst().update_attrs(
        url=url.Utils.get_src_obj_url(self.driver.current_url))
    actual_cloned_audit_obj = self.get_obj_from_info_page(obj=cloned_audit_obj)
    self.driver.refresh()
    return actual_cloned_audit_obj.update_attrs(url=cloned_audit_obj.url)

  def bulk_update_via_info_page(self, audit_obj):
    """Open Info page of Audit object and bulk update objects to
    latest version.
    """
    audit_info_page = self.open_info_page_of_obj(audit_obj)
    audit_info_page.open_info_3bbs().select_update_objs().confirm_update()


class AssessmentTemplatesService(BaseWebUiService):
  """Class for AssessmentTemplates business layer's services objects."""
  def __init__(self, driver):
    super(AssessmentTemplatesService, self).__init__(
        driver, objects.ASSESSMENT_TEMPLATES)

  def create_obj_via_tree_view(self, src_obj, obj):
    """Open generic widget of mapped objects, open creation modal from
    Tree View, fill data according to object attributes and create new object.
    """
    (self._open_create_modal_and_fill_data(src_obj, obj).
     select_assignee(obj.assignees).save_and_close())


class AssessmentsService(BaseWebUiService):
  """Class for Assessments business layer's services objects."""
  def __init__(self, driver):
    super(AssessmentsService, self).__init__(
        driver, objects.ASSESSMENTS)

  def add_comments(self, src_obj, obj, comment_objs):
    """Open Info Panel of 'obj' navigate by object's title, maximize it and
    add comments according to 'comment_objs' descriptions, return
    'CommentsPanel' class after adding of comments.
    """
    comments_descriptions = tuple(
        comment_obj.description for comment_obj in comment_objs)
    obj_info_panel = self.open_info_panel_of_obj_by_title(src_obj, obj)
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

  def edit_obj_via_edit_modal_from_info_page(self, src_obj):
    """Open generic widget of object, open edit modal from drop down menu.
    Modify current title and code and then apply changes by pressing
    'save and close' button
    """
    # pylint: disable=invalid-name
    src_obj_info_page = self.open_info_page_of_obj(src_obj)
    (src_obj_info_page.open_info_3bbs().select_edit().edit_minimal_data(
        title=element.AssessmentInfoWidget.TITLE_EDITED_PART + src_obj.title).
        save_and_close())
    return self.info_widget_cls(self.driver)

  def get_log_pane_validation_result(self, obj):
    """Open assessment Info Page. Open Log Pane on Assessment Info Page.
    And return result of validation of all items.
    """
    asmt_page = self.open_info_page_of_obj(obj)
    return asmt_page.tab_container.get_tab_object(
        element.AssessmentTabContainer.CHANGE_LOG_TAB)

  def get_asmt_related_asmts_titles(self, asmt):
    """Open assessment Info Page. Open Related Assessments Tab on Assessment
    Info Page. And return list of related Assessments Titles.
    """
    asmt_page = self.open_info_page_of_obj(obj=asmt)
    related_asmts_tab = asmt_page.tab_container.get_tab_object(
        element.AssessmentTabContainer.RELATED_ASMTS_TAB)
    return related_asmts_tab.get_related_titles(
        asmt_type=asmt.assessment_type)

  def get_related_issues_titles(self, obj):
    """Open assessment Info Page. Open Open Related Issues Tab on Assessment
    Info Page. And return list of related Issues Titles.
    """
    asmt_page = self.open_info_page_of_obj(obj=obj)
    related_issues_tab = asmt_page.tab_container.get_tab_object(
        element.AssessmentTabContainer.RELATED_ISSUES_TAB)
    return [issue[element.RelatedIssuesTab.TITLE.upper()]
            for issue in related_issues_tab.get_items()]

  def raise_issue(self, src_obj, issue_obj):
    """Open assessment Info Page by 'src_obj'. Open Related Issues Tab on
    Assessment Info Page and raise Issue.
    """
    asmt_page = self.open_info_page_of_obj(obj=src_obj)
    related_issues_tab = asmt_page.tab_container.get_tab_object(
        element.AssessmentTabContainer.RELATED_ISSUES_TAB)
    related_issues_tab.raise_issue(issue_entity=issue_obj)

  def complete_assessment(self, obj):
    """Navigate to info page of object according to URL of object then find and
    click 'Complete' button then return info page of object in new state"""
    self.open_info_page_of_obj(obj).click_complete()
    return self.info_widget_cls(self.driver)

  def verify_assessment(self, obj):
    """Navigate to info page of object according to URL of object then find and
    click 'Verify' button then return info page of object in new state"""
    from lib.constants.locator import ObjectWidget
    self.open_info_page_of_obj(obj).click_verify()
    for locator in [ObjectWidget.HEADER_STATE_COMPLETED,
                    WidgetInfoAssessment.ICON_VERIFIED]:
      selenium_utils.wait_until_element_visible(self.driver, locator)
    return self.info_widget_cls(self.driver)

  def reject_assessment(self, obj):
    """Navigate to info page of object according to URL of object then find and
    click 'Needs Rework' button then return info page of object in new state.
    """
    self.open_info_page_of_obj(obj).click_needs_rework()
    return self.info_widget_cls(self.driver)

  def deprecate_assessment(self, obj):
    """Deprecate an object"""
    page = self.open_info_page_of_obj(obj)
    page.open_info_3bbs().select_deprecate()
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

  def create_obj_and_get_mapped_titles_from_modal(self, src_obj, obj):
    """Open generic widget of mapped objects, open creation modal from
    Tree View, fill data according to object attributes and create new object.
      - Return: [mapped_titles on create_modal]
    """
    # pylint: disable=invalid-name
    modal_create = self._open_create_modal_and_fill_data(src_obj, obj)
    mapped_titles = modal_create.get_mapped_snapshots_titles()
    modal_create.save_and_close()
    return mapped_titles

  def _open_create_modal_and_fill_data(self, src_obj, obj):
    """Open generic widget of mapped objects, open creation modal from
    Tree View, fill minimal data according to object attributes,
    map objs_under_assessment if exists.
      - Return: lib.page.modal.create_new_object.AssessmentsCreate
    """
    modal_create = (self.open_widget_of_mapped_objs(src_obj).
                    tree_view.open_create())
    modal_create.fill_minimal_data(title=obj.title, code=obj.slug)
    if obj.mapped_objects:
      modal_create.map_controls(obj.mapped_objects)
    return modal_create

  def map_objs_and_get_mapped_titles_from_edit_modal(self, src_obj,
                                                     objs_to_map):
    """Open ModalEdit from InfoPage of object. Open 3BBS. Select 'Edit' button
    and map snapshots from mapped_objects attribute of passed object.
      - Return: list of str. Titles of mapped Snapshots from Modal Edit.
    """
    # pylint: disable=invalid-name
    modal_edit = (self.open_info_page_of_obj(src_obj).open_info_3bbs().
                  select_edit())
    modal_edit.map_controls(objs_to_map)
    mapped_titles = modal_edit.get_mapped_snapshots_titles()
    modal_edit.save_and_close()
    return mapped_titles

  def choose_and_fill_dropdown_lca(self, asmt, dropdown, **kwargs):
    """Fill dropdown LCA for Assessment."""
    asmt_info = self.open_info_page_of_obj(asmt)
    asmt_info.choose_and_fill_dropdown_lca(
        dropdown.id, dropdown.multi_choice_options, **kwargs)

    updated_attrs = self.set_custom_attr_values(
        asmt, {dropdown.title: dropdown.multi_choice_options})
    asmt.update_attrs(custom_attribute_values=updated_attrs)
    return asmt


class ControlsService(SnapshotsWebUiService):
  """Class for Controls business layer's services objects."""
  def __init__(self, driver, is_versions_widget=False):
    super(ControlsService, self).__init__(
        driver, objects.CONTROLS, is_versions_widget)


class ObjectivesService(SnapshotsWebUiService):
  """Class for Objectives business layer's services objects."""
  def __init__(self, driver, is_versions_widget=False):
    super(ObjectivesService, self).__init__(
        driver, objects.OBJECTIVES, is_versions_widget)


class IssuesService(BaseWebUiService):
  """Class for Issues business layer's services objects."""
  def __init__(self, driver):
    super(IssuesService, self).__init__(driver, objects.ISSUES)


class ProgramsService(BaseWebUiService):
  """Class for Programs business layer's services objects."""
  def __init__(self, driver):
    super(ProgramsService, self).__init__(driver, objects.PROGRAMS)
