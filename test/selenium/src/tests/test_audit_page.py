# Copyright (C) 2020 Google Inc.
# Licensed under http://www.apache.org/licenses/LICENSE-2.0 <see LICENSE file>
"""Audit smoke tests."""
# pylint: disable=no-self-use
# pylint: disable=invalid-name
# pylint: disable=unused-argument
# pylint: disable=too-many-arguments

import pytest

from lib import base, environment, users
from lib.constants import object_states
from lib.constants.element import objects
from lib.entities import entities_factory
from lib.entities.entity import Representation
from lib.factory import get_cls_rest_service
from lib.page import login_page
from lib.page.widget import object_modal
from lib.service import rest_facade, webui_service
from lib.utils import string_utils


class TestAuditPage(base.Test):
  """Tests for audit functionality."""

  @classmethod
  def check_ggrc_7048(cls, exp_audit, act_audit):
    """Check audit title."""
    title_regexp = r"^\d{4}:\sProgram.*Audit\s\d+$"
    cls.general_equal_assert(
        exp_audit, act_audit, "custom_attributes", "title")
    if (exp_audit.title != act_audit.title and
        string_utils.parse_str_by_reg_exp(
            act_audit.title, title_regexp, False) is not None):
      pytest.xfail(reason="\nGGRC-7048. Incorrect audit title.")

  @pytest.fixture(scope="function")
  def create_and_clone_audit_w_params_to_update(
      self, request, program, control_mapped_to_program,
      audit, assessment, assessment_template_rest, issue_mapped_to_audit,
      selenium
  ):
    """Create Audit with clonable and non clonable objects via REST API and
    clone it with them via UI.
    Preconditions:
    - Program, Control created via REST API.
    - Control mapped to Program via REST API.
    - Audit created under Program via REST API.
    - Assessment, Assessment Template, Issue created under Audit via REST API.
    - Issue mapped to Audit via REST API.
    """
    # pylint: disable=too-many-locals
    if hasattr(request, "param") and request.param:
      if isinstance(request.param, tuple):
        fixture, params_to_update = request.param
        # fixtures which are objects
        if fixture in request.fixturenames and (
            fixture == "audit" or "assessment_template"
        ):
          fixture = locals().get(fixture)
          (get_cls_rest_service(objects.get_plural(fixture.type))().
           update_obj(obj=fixture, **params_to_update))
    expected_audit = entities_factory.AuditsFactory.clone(
        audit=audit)[0]
    expected_asmt_tmpl = entities_factory.AssessmentTemplatesFactory.clone(
        asmt_tmpl=assessment_template_rest)[0]
    actual_audit = (webui_service.AuditsService(selenium).
                    clone_via_info_page_and_get_obj(audit_obj=audit))
    return {
        "audit": audit, "expected_audit": expected_audit,
        "actual_audit": actual_audit, "assessment": assessment,
        "issue": issue_mapped_to_audit,
        "assessment_template": assessment_template_rest,
        "expected_assessment_template": expected_asmt_tmpl,
        "control": control_mapped_to_program, "program": program
    }

  @pytest.mark.smoke_tests
  def test_create_audit(self, program, selenium):
    """Test creation of an audit via UI."""
    audit = entities_factory.AuditsFactory().create()
    audits_service = webui_service.AuditsService(selenium)
    audits_service.create_obj_via_tree_view(program, audit)
    tree_view_audit = audits_service.get_list_objs_from_tree_view(program)[0]
    actual_audit = audits_service.get_obj_from_info_page(tree_view_audit)
    rest_audit = rest_facade.get_obj(actual_audit)
    audit.update_attrs(
        created_at=rest_audit.created_at,
        updated_at=rest_audit.updated_at,
        modified_by=users.current_user(),
        slug=rest_audit.slug).repr_ui()
    self.check_ggrc_7048(audit, actual_audit)

  @pytest.mark.smoke_tests
  def test_asmt_tmpl_creation(self, program, audit, selenium):
    """Check if Assessment Template can be created from Audit page via
    Assessment Templates widget.
    Preconditions:
    - Audit created under Program via REST API.
    """
    expected_asmt_tmpl = (
        entities_factory.AssessmentTemplatesFactory().create())
    asmt_tmpls_ui_service = webui_service.AssessmentTemplatesService(selenium)
    asmt_tmpls_ui_service.create_obj_via_tree_view(
        src_obj=audit, obj=expected_asmt_tmpl)
    actual_asmt_tmpls_tab_count = (
        asmt_tmpls_ui_service.get_count_objs_from_tab(src_obj=audit))
    assert len([expected_asmt_tmpl]) == actual_asmt_tmpls_tab_count
    actual_asmt_tmpls = asmt_tmpls_ui_service.get_list_objs_from_tree_view(
        src_obj=audit)
    # 'expected_asmt_tmpls': modified_by, slug (None) *factory
    # 'actual_asmt_tmpls': assignees, verifiers, template_object_type (None)
    self.general_equal_assert(
        [expected_asmt_tmpl], actual_asmt_tmpls,
        "modified_by", "slug", "assignees", "verifiers",
        "template_object_type")

  @pytest.mark.smoke_tests
  def test_asmt_creation(self, program, audit, selenium):
    """Check if Assessment can be created from Audit page via
    Assessments widget.
    Preconditions:
    - Audit created under Program via REST API.
    """
    asmt = entities_factory.AssessmentsFactory().create()
    asmts_service = webui_service.AssessmentsService(selenium)
    asmts_service.create_obj_via_tree_view(src_obj=audit, obj=asmt)
    tree_view_asmt = asmts_service.get_list_objs_from_tree_view(audit)[0]
    actual_asmt = asmts_service.get_obj_from_info_page(tree_view_asmt)
    rest_asmt = rest_facade.get_obj(actual_asmt)
    asmt.update_attrs(
        created_at=rest_asmt.created_at,
        updated_at=rest_asmt.updated_at,
        modified_by=rest_asmt.modified_by,
        slug=rest_asmt.slug
    ).repr_ui()
    self.general_equal_assert(asmt, actual_asmt, "custom_attributes")

  @pytest.mark.smoke_tests
  def test_mapped_objs_titles_in_create_modal(
      self, program, control_mapped_to_program, audit, selenium
  ):
    """Test that mapped objects appear in modal after mapping."""
    webui_service.AssessmentsService(selenium).open_widget_of_mapped_objs(
        audit).tree_view.open_create()
    create_asmt_modal = object_modal.AssessmentModal(selenium)
    create_asmt_modal.map_objects([control_mapped_to_program])
    actual_titles = create_asmt_modal.get_mapped_snapshots_titles()
    assert actual_titles == [control_mapped_to_program.title]

  @pytest.mark.smoke_tests
  @pytest.mark.parametrize(
      "obj",
      ["control_mapped_to_program", "objective_mapped_to_program"],
      indirect=True)
  def test_asmt_creation_with_mapping(
      self, program, obj, audit, selenium
  ):
    """Check if Assessment can be created with mapped snapshot via
    Modal Create on Assessments TreeView.
    Objects structure:
    Program
    -> Obj (Control or Objective)
    -> Audit
    """
    expected_asmt = (
        entities_factory.AssessmentsFactory().create(mapped_objects=[obj]))
    asmts_service = webui_service.AssessmentsService(selenium)
    asmts_service.create_obj_via_tree_view(src_obj=audit, obj=expected_asmt)
    tree_view_asmt = asmts_service.get_list_objs_from_tree_view(audit)[0]
    actual_asmt = asmts_service.get_obj_from_info_page(tree_view_asmt)
    rest_asmt = rest_facade.get_obj(actual_asmt)
    expected_asmt.update_attrs(
        created_at=rest_asmt.created_at,
        updated_at=rest_asmt.updated_at,
        modified_by=users.current_user(),
        slug=rest_asmt.slug).repr_ui()
    self.general_equal_assert(expected_asmt, actual_asmt, "custom_attributes")

  @pytest.mark.smoke_tests
  @pytest.mark.parametrize(
      "obj",
      [None, "assessment_template_rest",
       "assessment_template_with_all_cas_rest"],
      ids=["Assessments generation without Assessment Template",
           "Assessments generation based on Assessment Template without LCAs",
           "Assessments generation based on Assessment Template with LCAs"],
      indirect=True)
  def test_asmts_generation(
      self, program, controls_mapped_to_program, audit, obj, selenium
  ):
    """Check if Assessments can be generated from Audit page via Assessments
    widget using Assessment template and Controls.
    Preconditions:
    - Program, Controls created via REST API.
    - Controls mapped to Program via REST API.
    - Audit created under Program via REST API.
    Test parameters:
    - 'dynamic_objects'.
    """
    expected_asmts = (entities_factory.AssessmentsFactory().generate(
        mapped_objects=controls_mapped_to_program, audit=audit,
        asmt_tmpl=obj))
    expected_asmts = [
        expected_asmt.repr_ui() for expected_asmt in expected_asmts]
    asmts_ui_service = webui_service.AssessmentsService(selenium)
    asmts_ui_service.generate_objs_via_tree_view(
        src_obj=audit, objs_under_asmt=controls_mapped_to_program,
        asmt_tmpl_obj=obj)
    actual_asmts_tab_count = asmts_ui_service.get_count_objs_from_tab(
        src_obj=audit)
    assert len(expected_asmts) == actual_asmts_tab_count
    actual_asmts = asmts_ui_service.get_list_objs_from_info_panels(
        src_obj=audit, objs=expected_asmts)
    # 'expected_asmt': slug, custom_attributes (None) *factory
    # 'actual_asmt': audit (None)
    self.general_equal_assert(
        expected_asmts, actual_asmts, "slug", "custom_attributes", "audit")

  @pytest.mark.smoke_tests
  @pytest.mark.cloning
  @pytest.mark.parametrize(
      "create_and_clone_audit_w_params_to_update",
      [("audit", {"status": object_states.PLANNED}),
       ("audit", {"status": object_states.IN_PROGRESS}),
       ("audit", {"status": object_states.MANAGER_REVIEW}),
       ("audit", {"status": object_states.READY_FOR_EXT_REVIEW}),
       ("audit", {"status": object_states.COMPLETED})],
      ids=["Audit statuses: 'Planned' - 'Planned'",
           "Audit statuses: 'In Progress' - 'Planned'",
           "Audit statuses: 'Manager Review' - 'Planned'",
           "Audit statuses: 'Ready for External Review' - 'Planned'",
           "Audit statuses: 'Completed' - 'Planned'"],
      indirect=True)
  def test_cloned_audit_contains_new_attrs(
      self, create_and_clone_audit_w_params_to_update
  ):
    """Check via UI that cloned Audit contains new predicted attributes using
    all initial Audit's states.
    Preconditions:
    - Execution and return of fixture
    'create_and_clone_audit_w_params_to_update'.
    """
    expected_audit = (
        create_and_clone_audit_w_params_to_update["expected_audit"].
        update_attrs(status=object_states.PLANNED).repr_ui())
    actual_audit = create_and_clone_audit_w_params_to_update["actual_audit"]
    # 'expected_audit': created_at, updated_at, slug (None) *factory
    # 'actual_audit': program (None)
    self.general_equal_assert(
        expected_audit, actual_audit,
        "created_at", "updated_at", "slug", "program", "custom_attributes")

  @pytest.mark.smoke_tests
  @pytest.mark.cloning
  def test_non_clonable_objs_donot_move_to_cloned_audit(
      self, create_and_clone_audit_w_params_to_update, selenium
  ):
    """Check via UI that non clonable objects
    Assessment, Issue do not move to cloned Audit.
    Preconditions:
    - Execution and return of fixture
    'create_and_clone_audit_w_params_to_update'.
    """
    actual_audit = create_and_clone_audit_w_params_to_update["actual_audit"]
    asmts_ui_service = webui_service.AssessmentsService(selenium)
    actual_asmts_tab_count = asmts_ui_service.get_count_objs_from_tab(
        src_obj=actual_audit)
    actual_asmts = asmts_ui_service.get_list_objs_from_tree_view(
        src_obj=actual_audit)
    issues_ui_service = webui_service.IssuesService(selenium)
    actual_issues_tab_count = issues_ui_service.get_count_objs_from_tab(
        src_obj=actual_audit)
    actual_issues = issues_ui_service.get_list_objs_from_tree_view(
        src_obj=actual_audit)
    assert actual_asmts_tab_count == actual_issues_tab_count == 0
    assert bool(actual_asmts) == bool(actual_issues) == 0

  @pytest.mark.smoke_tests
  @pytest.mark.cloning
  @pytest.mark.parametrize(
      "create_and_clone_audit_w_params_to_update",
      [("assessment_template", {"status": object_states.DRAFT}),
       ("assessment_template", {"status": object_states.DEPRECATED}),
       ("assessment_template", {"status": object_states.ACTIVE})],
      ids=["Assessment Template's statuses: 'Draft' - 'Draft'",
           "Assessment Template's' statuses: 'Deprecated' - 'Deprecated'",
           "Assessment Template's statuses: 'Active' - 'Active'"],
      indirect=True)
  def test_clonable_audit_related_objs_move_to_cloned_audit(
      self, create_and_clone_audit_w_params_to_update, selenium
  ):
    """Check via UI that clonable audit related object Assessment Template
    move to cloned Audit using all initial Assessment Templates's states.
    Preconditions:
    -Execution and return of fixture
    'create_and_clone_audit_w_params_to_update'.
    Test parameters:
    - 'create_and_clone_audit_w_params_to_update' which contains params to
    update asmt tmpl status via REST API.
    """
    # todo: add getting objects from Assessment Template's Info Widget
    actual_audit = create_and_clone_audit_w_params_to_update["actual_audit"]
    expected_asmt_tmpl = (
        create_and_clone_audit_w_params_to_update[
            "expected_assessment_template"].repr_ui())
    actual_asmt_tmpls = (webui_service.AssessmentTemplatesService(selenium).
                         get_list_objs_from_tree_view(src_obj=actual_audit))
    # 'expected_asmt_tmpl': slug, updated_at (None) *factory
    # 'actual_asmt_tmpls': created_at, updated_at, custom_attributes,
    #                      modified_by, audit, assignees, verifiers,
    #                      template_object_type (None)
    exclude_attrs = (
        Representation.tree_view_attrs_to_exclude +
        ("slug", "modified_by", "audit", "assignees", "verifiers",
         "template_object_type", "custom_attributes"))
    self.general_equal_assert(
        expected_asmt_tmpl, actual_asmt_tmpls, *exclude_attrs)

  @pytest.mark.smoke_tests
  @pytest.mark.cloning
  def test_clonable_not_audit_related_objs_move_to_cloned_audit(
      self, create_and_clone_audit_w_params_to_update, selenium
  ):
    """Check via UI that clonable not audit related objects
    Control, Program move to cloned Audit.
    Preconditions:
    -Execution and return of fixture
    'create_and_clone_audit_w_params_to_update'.
    """
    actual_audit = create_and_clone_audit_w_params_to_update["actual_audit"]
    expected_control = (
        create_and_clone_audit_w_params_to_update["control"].repr_ui())
    expected_program = (
        create_and_clone_audit_w_params_to_update["program"].repr_ui())
    actual_controls = (webui_service.ControlsService(selenium).
                       get_list_objs_from_tree_view(src_obj=actual_audit))
    actual_programs = (webui_service.ProgramsService(selenium).
                       get_list_objs_from_tree_view(src_obj=actual_audit))
    # 'actual_controls, actual_programs': created_at, updated_at,
    #                                     custom_attributes (None)
    self.general_equal_assert(
        [expected_control], actual_controls,
        *Representation.tree_view_attrs_to_exclude)
    self.general_equal_assert(
        [expected_program], actual_programs,
        *Representation.tree_view_attrs_to_exclude)

  @pytest.mark.smoke_tests
  def test_dashboard_gca(self, audit, soft_assert, selenium):
    # pylint: disable=anomalous-backslash-in-string
    """Check Dashboard Tab is exist if 'Dashboard' GCA filled
    with right value. Possible values match to regexp r"^https?://[^\s]+$".
    Steps:
      - Create 'Dashboard' gcas for object.
      - Fill with values
      - Check if 'Dashboard' tab exist.
      - Navigate to 'Dashboard' tab.
      - Check only GCAs filled with right values displayed on the tab.
    """
    expected_tabs = rest_facade.cas_dashboards(
        audit, "https://gmail.by/", "https://www.google.com/",
        environment.app_url, string_utils.StringMethods.random_string(),
        "ftp://something.com/")
    audit_ui_service = webui_service.AuditsService(selenium)
    soft_assert.expect(audit_ui_service.is_dashboard_tab_exist(audit),
                       "Dashboard tab should be displayed.")
    soft_assert.expect(
        expected_tabs == audit_ui_service.get_items_from_dashboard_widget(
            audit), "Dashboard tab items are not displayed correctly.")
    soft_assert.assert_expectations()

  @pytest.mark.smoke_tests
  def test_page_on_dashboard_gca(self, audit, soft_assert, selenium):
    """Check that Dashboard Tab displays login page if 'Dashboard' GCA filled
    with appropriate url."""
    rest_facade.cas_dashboards(audit, environment.app_url)
    dashboard_content = login_page.LoginPage(
        webui_service.AuditsService(selenium).get_dashboard_content(audit))
    for element in dashboard_content.get_visible_elements():
      soft_assert.expect(element.exists, "{} is not found".format(element))
    soft_assert.assert_expectations()
