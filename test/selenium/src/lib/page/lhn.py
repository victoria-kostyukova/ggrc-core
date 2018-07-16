# Copyright (C) 2018 Google Inc.
# Licensed under http://www.apache.org/licenses/LICENSE-2.0 <see LICENSE file>
"""Elements for LHN."""

from lib import base
from lib.constants import locator, element
from lib.element import lhn
from lib.page.modal import create_new_object


class _Programs(lhn.AccordionGroup):
  """Programs dropdown in LHN."""
  _locator_spinny = locator.LhnMenu.SPINNY_PROGRAMS
  _locator_button_create_new = locator.LhnMenu.BUTTON_CREATE_NEW_PROGRAMS
  _locator_accordion_members = locator.LhnMenu.ACCORDION_MEMBERS_PROGRAMS
  _create_new_modal_cls = create_new_object.ProgramsCreate


class _Workflows(lhn.AccordionGroup):
  """Workflows dropdown in LHN."""
  _locator_spinny = locator.LhnMenu.SPINNY_WORKFLOWS
  _locator_button_create_new = locator.LhnMenu.BUTTON_CREATE_NEW_WORKFLOWS

  def __init__(self, driver):
    super(_Workflows, self).__init__(driver)
    self.button_active = base.Button(
        self._driver, locator.LhnMenu.BUTTON_WORKFLOWS_ACTIVE)
    self.button_inactive = base.Button(
        self._driver, locator.LhnMenu.BUTTON_WORKFLOWS_INACTIVE)
    self.button_draft = base.Button(
        self._driver, locator.LhnMenu.BUTTON_WORKFLOWS_DRAFT)


class _Audits(lhn.AccordionGroup):
  """Audits dropdown in LHN."""
  _locator_spinny = locator.LhnMenu.SPINNY_AUDITS
  _locator_button_create_new = locator.LhnMenu.BUTTON_CREATE_NEW_AUDITS


class _Assessments(lhn.AccordionGroup):
  """Assessments dropdown in LHN."""
  _locator_spinny = locator.LhnMenu.SPINNY_ASSESSMENTS
  _locator_button_create_new = locator.LhnMenu.BUTTON_CREATE_NEW_ASSESSMENTS


class _Issues(lhn.AccordionGroup):
  """Issues dropdown in LHN."""
  _locator_spinny = locator.LhnMenu.SPINNY_ISSUES
  _locator_button_create_new = locator.LhnMenu.BUTTON_CREATE_NEW_ISSUES
  _locator_accordion_members = locator.LhnMenu.ACCORDION_MEMBERS_ISSUES
  _create_new_modal_cls = create_new_object.IssuesCreate


class _Directives(lhn.DropdownStatic):
  """Directives dropdown in LHN."""
  _locator_element = locator.LhnMenu.DIRECTIVES

  def __init__(self, driver):
    super(_Directives, self).__init__(driver)
    self.toggle_regulations = lhn.Toggle(
        self._driver, locator.LhnMenu.REGULATIONS,
        locator.LhnMenu.REGULATIONS_COUNT)
    self.toggle_policies = lhn.Toggle(
        self._driver, locator.LhnMenu.POLICIES,
        locator.LhnMenu.POLICIES_COUNT)
    self.toggle_standards = lhn.Toggle(
        self._driver, locator.LhnMenu.STANDARDS,
        locator.LhnMenu.STANDARDS_COUNT)
    self.toggle_contracts = lhn.Toggle(
        self._driver, locator.LhnMenu.CONTRACTS,
        locator.LhnMenu.CONTRACTS_COUNT)
    self.toggle_clauses = lhn.Toggle(
        self._driver, locator.LhnMenu.CLAUSES,
        locator.LhnMenu.CLAUSES_COUNT)
    self.toggle_requirements = lhn.Toggle(
        self._driver, locator.LhnMenu.REQUIREMENTS,
        locator.LhnMenu.REQUIREMENTS_COUNT)

  def select_regulations(self):
    """
    Return: _Regulations
    """
    self.toggle_regulations.toggle()
    return _Regulations(self._driver)

  def select_policies(self):
    """
    Return: _Policies
    """
    self.toggle_policies.toggle()
    return _Policies(self._driver)

  def select_standards(self):
    """
    Return: _Standards
    """
    self.toggle_standards.toggle()
    return _Standards(self._driver)

  def select_contracts(self):
    """
    Return: _Contracts
    """
    self.toggle_contracts.toggle()
    return _Contracts(self._driver)

  def select_clauses(self):
    """
    Return: _Clauses
    """
    self.toggle_clauses.toggle()
    return _Clauses(self._driver)

  def select_requirements(self):
    """
    Return: _Requirements
    """
    self.toggle_requirements.toggle()
    return _Requirements(self._driver)


class _Regulations(lhn.AccordionGroup):
  """Regulations dropdown in LHN."""
  _locator_spinny = locator.LhnMenu.SPINNY_REGULATIONS
  _locator_button_create_new = locator.LhnMenu.BUTTON_CREATE_NEW_REGULATIONS


class _Policies(lhn.AccordionGroup):
  """Policies dropdown in LHN."""
  _locator_button_create_new = locator.LhnMenu.BUTTON_CREATE_NEW_POLICIES
  _locator_spinny = locator.LhnMenu.SPINNY_POLICIES


class _Standards(lhn.AccordionGroup):
  """Standards dropdown in LHN."""
  _locator_button_create_new = locator.LhnMenu.BUTTON_CREATE_NEW_STANDARDS
  _locator_spinny = locator.LhnMenu.SPINNY_STANDARDS


class _Contracts(lhn.AccordionGroup):
  """Contracts dropdown in LHN."""
  _locator_button_create_new = locator.LhnMenu.BUTTON_CREATE_NEW_CONTRACTS
  _locator_spinny = locator.LhnMenu.SPINNY_REGULATIONS


class _Clauses(lhn.AccordionGroup):
  """Clauses dropdown in LHN."""
  _locator_button_create_new = locator.LhnMenu.BUTTON_CREATE_NEW_CLAUSES
  _locator_spinny = locator.LhnMenu.SPINNY_CLAUSES


class _Requirements(lhn.AccordionGroup):
  """Reguirements dropdown in LHN."""
  _locator_button_create_new = locator.LhnMenu.BUTTON_CREATE_NEW_REQUIREMENTS
  _locator_spinny = locator.LhnMenu.SPINNY_REQUIREMENTS


class _ControlsOrObjectives(lhn.DropdownStatic):
  """Controls or objects dropdown in LHN."""
  _locator_element = locator.LhnMenu.TOGGLE_CONTROLS_OR_OBJECTIVES

  def __init__(self, driver):
    super(_ControlsOrObjectives, self).__init__(driver)
    self.toggle_controls = lhn.Toggle(
        self._driver, locator.LhnMenu.TOGGLE_CONTROLS,
        locator.LhnMenu.COUNT_CONTROLS)
    self.toggle_objectives = lhn.Toggle(
        self._driver, locator.LhnMenu.TOGGLE_OBJECTIVES,
        locator.LhnMenu.COUNT_OBJECTIVES)

  def select_controls(self):
    """
    Return: Controls
    """
    self.toggle_controls.toggle()
    return Controls(self._driver)

  def select_objectives(self):
    """
    Return: _Objectives
    """
    self.toggle_objectives.toggle()
    return _Objectives(self._driver)


class Controls(lhn.AccordionGroup):
  """Controls dropdown in LHN."""
  _locator_button_create_new = locator.LhnMenu.BUTTON_CREATE_NEW_CONTROLS
  _locator_spinny = locator.LhnMenu.SPINNY_CONTROLS
  _locator_accordion_members = locator.LhnMenu.ACCORDION_MEMBERS_CONTROLS
  _create_new_modal_cls = create_new_object.ControlsCreate


class _Objectives(lhn.AccordionGroup):
  """Objectives dropdown in LHN."""
  _locator_button_create_new = locator.LhnMenu.BUTTON_CREATE_NEW_OBJECTIVES
  _locator_spinny = locator.LhnMenu.SPINNY_OBJECTIVES


class _PeopleOrGroups(lhn.DropdownStatic):
  """People or groups dropdown in LHN."""
  _locator_element = locator.LhnMenu.TOGGLE_PEOPLE_OR_GROUPS

  def __init__(self, driver):
    super(_PeopleOrGroups, self).__init__(driver)
    self.toggle_people = lhn.Toggle(
        self._driver, locator.LhnMenu.TOGGLE_PEOPLE,
        locator.LhnMenu.COUNT_PEOPLE)
    self.toggle_vendors = lhn.Toggle(
        self._driver, locator.LhnMenu.TOGGLE_VENDORS,
        locator.LhnMenu.COUNT_VENDORS)
    self.toggle_access_groups = lhn.Toggle(
        self._driver, locator.LhnMenu.TOGGLE_ACCESS_GROUPS,
        locator.LhnMenu.COUNT_ACCESS_GROUPS)

  def select_people(self):
    """
    Return: _People
    """
    self.toggle_people.toggle()
    return _People(self._driver)

  def select_vendors(self):
    """
    Return: _Vendors
    """
    self.toggle_vendors.toggle()
    return _Vendors(self._driver)

  def select_access_groups(self):
    """
    Return: _AccessGroups
    """
    self.toggle_access_groups.toggle()
    return _AccessGroups(self._driver)


class _People(lhn.AccordionGroup):
  """People dropdown in LHN."""
  _locator_button_create_new = locator.LhnMenu.BUTTON_CREATE_NEW_PEOPLE
  _locator_spinny = locator.LhnMenu.SPINNY_PEOPLE


class _OrgGroups(lhn.AccordionGroup):
  """Org groups dropdown in LHN."""
  _locator_button_create_new = locator.LhnMenu.BUTTON_CREATE_NEW_ORG_GROUPS
  _locator_spinny = locator.LhnMenu.SPINNY_ORG_GROUPS
  _locator_accordion_members = locator.LhnMenu.ACCORDION_MEMBERS_ORG_GROUPS
  _create_new_modal_cls = create_new_object.OrgGroupsCreate


class _Vendors(lhn.AccordionGroup):
  """Vendors dropdown in LHN."""
  _locator_button_create_new = locator.LhnMenu.BUTTON_CREATE_NEW_VENDORS
  _locator_spinny = locator.LhnMenu.SPINNY_VENDORS


class _AccessGroups(lhn.AccordionGroup):
  """Access groups dropdown in LHN."""
  _locator_button_create_new = locator.LhnMenu.BUTTON_CREATE_NEW_ACCESS_GROUPS
  _locator_spinny = locator.LhnMenu.SPINNY_ACCESS_GROUPS


class _Scope(lhn.DropdownStatic):
  """Scope dropdown in LHN."""
  # pylint: disable=too-many-instance-attributes
  _locator_element = locator.LhnMenu.TOGGLE_SCOPE

  def __init__(self, driver):
    super(_Scope, self).__init__(driver)
    self.toggle_org_groups = lhn.Toggle(
        self._driver, locator.LhnMenu.TOGGLE_ORG_GROUPS,
        locator.LhnMenu.COUNT_ORG_GROUPS)
    self.toggle_systems = lhn.Toggle(
        self._driver, locator.LhnMenu.TOGGLE_SYSTEMS,
        locator.LhnMenu.COUNT_SYSTEMS)
    self.toggle_processes = lhn.Toggle(
        self._driver, locator.LhnMenu.TOGGLE_PROCESSES,
        locator.LhnMenu.COUNT_PROCESSES)
    self.toggle_data_assets = lhn.Toggle(
        self._driver, locator.LhnMenu.TOGGLE_DATA_ASSETS,
        locator.LhnMenu.COUNT_DATA_ASSETS)
    self.toggle_products = lhn.Toggle(
        self._driver, locator.LhnMenu.TOGGLE_PRODUCTS,
        locator.LhnMenu.COUNT_PRODUCTS)
    self.toggle_projects = lhn.Toggle(
        self._driver, locator.LhnMenu.TOGGLE_PROJECTS,
        locator.LhnMenu.COUNT_PROJECTS)
    self.toggle_facilities = lhn.Toggle(
        self._driver, locator.LhnMenu.TOGGLE_FACILITIES,
        locator.LhnMenu.COUNT_FACILITIES)
    self.toggle_markets = lhn.Toggle(
        self._driver, locator.LhnMenu.TOGGLE_MARKETS,
        locator.LhnMenu.COUNT_MARKETS)

  def select_org_groups(self):
    """
    Return: _OrgGroups
    """
    self.toggle_org_groups.toggle()
    return _OrgGroups(self._driver)

  def select_systems(self):
    """
    Return: _Systems
    """
    self.toggle_systems.toggle()
    return _Systems(self._driver)

  def select_processes(self):
    """
    Return: _Processes
    """
    self.toggle_processes.toggle()
    return _Processes(self._driver)

  def select_data_assets(self):
    """
    Return: _DataAssets
    """
    self.toggle_data_assets.toggle()
    return _DataAssets(self._driver)

  def select_products(self):
    """
    Return: _Products
    """
    self.toggle_products.toggle()
    return _Products(self._driver)

  def select_projects(self):
    """
    Return: _Projects
    """
    self.toggle_projects.toggle()
    return _Projects(self._driver)

  def select_facilities(self):
    """
    Return: _Facilities
    """
    self.toggle_facilities.toggle()
    return _Facilities(self._driver)

  def select_markets(self):
    """
    Return: _Markets
    """
    self.toggle_markets.toggle()
    return _Markets(self._driver)


class _Systems(lhn.AccordionGroup):
  """Systems dropdown in LHN."""
  _locator_button_create_new = locator.LhnMenu.BUTTON_CREATE_NEW_SYSTEMS
  _locator_spinny = locator.LhnMenu.SPINNY_SYSTEMS
  _create_new_modal_cls = create_new_object.SystemsCreate
  _locator_accordion_members = locator.LhnMenu.ACCORDION_MEMBERS_SYSTEMS


class _Processes(lhn.AccordionGroup):
  """Processes dropdown in LHN."""
  _locator_button_create_new = locator.LhnMenu.BUTTON_CREATE_NEW_PROCESSES
  _locator_spinny = locator.LhnMenu.SPINNY_PROCESSES
  _create_new_modal_cls = create_new_object.ProcessesCreate
  _locator_accordion_members = locator.LhnMenu.ACCORDION_MEMBERS_PROCESSES


class _DataAssets(lhn.AccordionGroup):
  """Data assets dropdown in LHN."""
  _locator_button_create_new = locator.LhnMenu.BUTTON_CREATE_NEW_DATA_ASSETS
  _locator_spinny = locator.LhnMenu.SPINNY_DATA_ASSETS
  _create_new_modal_cls = create_new_object.DataAssetsCreate
  _locator_accordion_members = locator.LhnMenu.ACCORDION_MEMBERS_DATA_ASSETS


class _Products(lhn.AccordionGroup):
  """Products dropdown in LHN."""
  _locator_button_create_new = locator.LhnMenu.BUTTON_CREATE_NEW_PRODUCTS
  _locator_spinny = locator.LhnMenu.SPINNY_PRODUCTS
  _create_new_modal_cls = create_new_object.ProductsCreate
  _locator_accordion_members = locator.LhnMenu.ACCORDION_MEMBERS_PRODUCTS


class _Projects(lhn.AccordionGroup):
  """Projects dropdown in LHN."""
  _locator_button_create_new = locator.LhnMenu.BUTTON_CREATE_NEW_PROJECTS
  _locator_spinny = locator.LhnMenu.SPINNY_PROJECTS
  _create_new_modal_cls = create_new_object.ProcessesCreate
  _locator_accordion_members = locator.LhnMenu.ACCORDION_MEMBERS_PROJECTS


class _Facilities(lhn.AccordionGroup):
  """Facilities dropdown in LHN."""
  _locator_button_create_new = locator.LhnMenu.BUTTON_CREATE_NEW_FACILITIES
  _locator_spinny = locator.LhnMenu.SPINNY_FACILITIES


class _Markets(lhn.AccordionGroup):
  """Markets dropdown in LHN."""
  _locator_button_create_new = locator.LhnMenu.BUTTON_CREATE_NEW_MARKETS
  _locator_spinny = locator.LhnMenu.SPINNY_MARKETS


class _RisksOrThreats(lhn.DropdownStatic):
  """Risks or threats dropdown in LHN."""
  _locator_element = locator.LhnMenu.TOGGLE_RISK_OR_THREATS

  def __init__(self, driver):
    super(_RisksOrThreats, self).__init__(driver)
    self.toggle_risks = lhn.Toggle(
        self._driver, locator.LhnMenu.TOGGLE_RISKS,
        locator.LhnMenu.COUNT_RISKS)
    self.toggle_threats = lhn.Toggle(
        self._driver, locator.LhnMenu.TOGGLE_THREATS,
        locator.LhnMenu.COUNT_THREATS)

  def select_risks(self):
    """
    Return: _Risks
    """
    self.toggle_risks.toggle()
    return _Risks(self._driver)

  def select_threats(self):
    """
    Return: _Threats
    """
    self.toggle_threats.toggle()
    return _Threats(self._driver)


class _Risks(lhn.AccordionGroup):
  """Risks dropdown in LHN."""
  _locator_button_create_new = locator.LhnMenu.BUTTON_CREATE_NEW_RISKS
  _locator_spinny = locator.LhnMenu.SPINNY_RISKS
  _locator_accordion_members = locator.LhnMenu.ACCORDION_MEMBERS_RISKS
  _create_new_modal_cls = create_new_object.RisksCreate


class _Threats(lhn.AccordionGroup):
  """Threats dropdown in LHN."""
  _locator_button_create_new = locator.LhnMenu.BUTTON_CREATE_NEW_THREATS
  _locator_spinny = locator.LhnMenu.SPINNY_THREATS


class Menu(base.AnimatedComponent):
  """Model of LHN menu."""
  # pylint: disable=too-many-instance-attributes
  def __init__(self, driver):
    super(Menu, self).__init__(
        driver,
        [lhn.MyObjectsTab.locator_element, lhn.AllObjectsTab.locator_element],
        wait_until_visible=True)
    self.my_objects = lhn.MyObjectsTab(driver)
    self.all_objects = lhn.AllObjectsTab(driver)
    self.pin = None
    self.filter = None
    self.toggle_programs = None
    self.toggle_workflows = None
    self.toggle_audits = None
    self.toggle_assessments = None
    self.toggle_issues = None
    self.toggle_directives = None
    self.toggle_controls_or_objectives = None
    self.toggle_people_or_groups = None
    self.toggle_scope = None
    self.toggle_risks_or_threats = None
    self.reload_elements()

  def reload_elements(self):
    """Each dropdown in LHN has count of members in brackets which we
    update."""
    self.filter = base.FilterLHN(
        self._driver, locator.LhnMenu.FILTER_TEXT_BOX,
        locator.LhnMenu.FILTER_SUBMIT_BUTTON,
        locator.LhnMenu.FILTER_CLEAR_BUTTON)
    self.pin = base.Toggle(self._driver, locator.LhnMenu.PIN)
    self.toggle_programs = lhn.Toggle(
        self._driver, locator.LhnMenu.TOGGLE_PROGRAMS,
        locator.LhnMenu.COUNT_PROGRAMS)
    self.toggle_workflows = lhn.Toggle(
        self._driver, locator.LhnMenu.TOGGLE_WORKFLOWS,
        locator.LhnMenu.COUNT_WORKFLOWS)
    self.toggle_audits = lhn.Toggle(
        self._driver, locator.LhnMenu.TOGGLE_AUDITS,
        locator.LhnMenu.COUNT_AUDITS)
    self.toggle_assessments = lhn.Toggle(
        self._driver, locator.LhnMenu.TOGGLE_ASSESSMENTS,
        locator.LhnMenu.COUNT_ASSESSMENTS)
    self.toggle_issues = lhn.Toggle(
        self._driver, locator.LhnMenu.TOGGLE_ISSUES,
        locator.LhnMenu.COUNT_ISSUES)
    self.toggle_directives = base.Toggle(
        self._driver, locator.LhnMenu.DIRECTIVES)
    self.toggle_controls_or_objectives = base.Toggle(
        self._driver, locator.LhnMenu.TOGGLE_CONTROLS_OR_OBJECTIVES)
    self.toggle_people_or_groups = base.Toggle(
        self._driver, locator.LhnMenu.TOGGLE_PEOPLE_OR_GROUPS)
    self.toggle_scope = base.Toggle(
        self._driver, locator.LhnMenu.TOGGLE_SCOPE)
    self.toggle_risks_or_threats = base.Toggle(
        self._driver, locator.LhnMenu.TOGGLE_RISK_OR_THREATS)

  def filter_query(self, query):
    """Type query in LHN filter and submit."""
    self.filter.enter_query(query)
    self.submit_query()

  def submit_query(self):
    self.filter.submit_query()
    self.reload_elements()

  def select_programs(self):
    """
    Return: _Programs
    """
    self.toggle_programs.toggle()
    return _Programs(self._driver)

  def select_workflows(self):
    """
    Return: _Workflows
    """
    self.toggle_workflows.toggle()
    return _Workflows(self._driver)

  def select_audits(self):
    """
    Return: _Audits
    """
    self.toggle_audits.toggle()
    return _Audits(self._driver)

  def select_assessments(self):
    """
    Return: _Assessments
    """
    self.toggle_assessments.toggle()
    return _Assessments(self._driver)

  def select_issues(self):
    """
    Return: _Issues
    """
    self.toggle_issues.toggle()
    return _Issues(self._driver)

  def select_directives(self):
    """
    Return: _Directives
    """
    self.toggle_directives.toggle()
    return _Directives(self._driver)

  def select_controls_or_objectives(self):
    """
    Return: _ControlsOrObjectives
    """
    self.toggle_controls_or_objectives.toggle()
    return _ControlsOrObjectives(self._driver)

  def select_people_or_groups(self):
    """
    Return: _PeopleOrGroups
    """
    self.toggle_people_or_groups.toggle()
    return _PeopleOrGroups(self._driver)

  def select_scope(self):
    """
    Return: _Scope
    """
    self.toggle_scope.toggle()
    return _Scope(self._driver)

  def select_risks_or_threats(self):
    """
    Return: _RisksOrThreats
    """
    self.toggle_risks_or_threats.toggle()
    return _RisksOrThreats(self._driver)

  def select_my_objects(self):
    """In LHN selects tab "My Objects".
    Return: LHNContents
    """
    self.my_objects.click()
    self.all_objects.is_activated = False
    return self.__class__(self._driver)

  def select_all_objects(self):
    """In LHN selects tab "All Objects".
    Return: LHNContents
    """
    self.all_objects.click()
    self.my_objects.is_activated = False
    return self.__class__(self._driver)

  def select_tab(self, tab_name):
    """Select tab in LHN by given name."""
    if tab_name == element.Lhn.MY_OBJS:
      self.select_my_objects()
    elif tab_name == element.Lhn.ALL_OBJS:
      self.select_all_objects()
    else:
      raise ValueError(
          "Incorrect value: '{}' Possible values are: {}".format(
              tab_name, (element.Lhn.MY_OBJS, element.Lhn.ALL_OBJS)
          ))
