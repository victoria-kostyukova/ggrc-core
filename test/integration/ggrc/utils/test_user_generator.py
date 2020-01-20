# Copyright (C) 2020 Google Inc.
# Licensed under http://www.apache.org/licenses/LICENSE-2.0 <see LICENSE file>

"""Tests for user generator"""

from collections import OrderedDict

import json
import ddt
import mock
from freezegun import freeze_time

from ggrc.converters import errors
from ggrc.integrations.client import PersonClient
from ggrc.models import all_models
from ggrc.models import Assessment
from ggrc.models import AssessmentTemplate
from ggrc.models import Audit
from ggrc.models import Person
from ggrc_basic_permissions.models import UserRole

from integration.ggrc.services import TestCase
from integration.ggrc.models import factories


@ddt.ddt
class TestUserGenerator(TestCase):
  """Test user generation."""

  def setUp(self):
    super(TestUserGenerator, self).setUp()
    self.clear_data()
    self.client.get("/login")

  def _post(self, data):
    return self.client.post(
        '/api/people',
        content_type='application/json',
        data=data,
        headers=[('X-Requested-By', 'Unit Tests')],
    )

  @staticmethod
  def _mock_post(*args, **kwargs):
    """Mock of IntegrationService _post"""
    # pylint: disable=unused-argument
    payload = kwargs["payload"]
    res = []
    for name in payload["usernames"]:
      res.append({'firstName': name,
                  'lastName': name,
                  'username': name})
    return {'persons': res}

  @mock.patch('ggrc.settings.INTEGRATION_SERVICE_URL', new='endpoint')
  @mock.patch('ggrc.settings.AUTHORIZED_DOMAIN', new='example.com')
  @freeze_time("2018-05-21 10:28:34")
  def test_users_generation(self):
    """Test user generation."""
    with mock.patch.multiple(PersonClient, _post=self._mock_post):
      data = json.dumps([
          {'person': {
              'name': 'Alan Turing',
              'email': 'aturing@example.com',
              'context': None,
              'external': True
          }},
          {'person': {
              'name': 'Alan Turing 2',
              'email': 'aturing2@example.com',
              'context': None,
              'external': True
          }},
          {'person': {
              'name': 'Alan Turing 3',
              'email': 'aturing_3@example.com',
              'context': None,
              'external': True
          }}
      ])
      response = self._post(data)
      self.assertStatus(response, 200)

      user = Person.query.filter_by(email='aturing@example.com').one()
      self.assertEqual(user.name, 'Alan Turing')

      roles = UserRole.query.filter_by(person_id=user.id)
      self.assertEqual(roles.count(), 1)
      self.assertEqual(response.json[0][1]['person']['id'], user.id)

    # checks person profile was created successfully
    self.assert_profiles_restrictions()
    emails = ['aturing@example.com', ]
    self.assert_person_profile_created(emails)
    self.assertEqual(all_models.Event.query.count(), 1)

  @mock.patch('ggrc.settings.INTEGRATION_SERVICE_URL', new='endpoint')
  @mock.patch('ggrc.settings.AUTHORIZED_DOMAIN', new='example.com')
  @freeze_time("2018-05-21 10:28:34")
  def test_user_generation(self):
    """Test user generation."""
    with mock.patch.multiple(
        PersonClient,
        _post=self._mock_post
    ):
      data = json.dumps([{'person': {
          'name': 'Alan Turing',
          'email': 'aturing@example.com',
          'context': None,
          'external': True
      }}])
      response = self._post(data)
      self.assertStatus(response, 200)

      user = Person.query.filter_by(email='aturing@example.com').one()
      self.assertEqual(user.name, 'Alan Turing')

      roles = UserRole.query.filter_by(person_id=user.id)
      self.assertEqual(roles.count(), 1)

    # checks person profile was created successfully
    emails = ['aturing@example.com', ]
    self.assert_person_profile_created(emails)
    self.assert_profiles_restrictions()

  @mock.patch('ggrc.settings.INTEGRATION_SERVICE_URL', new='endpoint')
  @mock.patch('ggrc.settings.AUTHORIZED_DOMAIN', new='example.com')
  @freeze_time("2018-05-21 10:26:34")
  def test_user_creation(self):
    """Test user creation."""
    with mock.patch.multiple(
        PersonClient,
        _post=self._mock_post
    ):
      data = json.dumps([{'person': {
          'name': 'Alan Turing',
          'email': 'aturing@example.com',
          'context': None
      }}])
      response = self._post(data)
      self.assertStatus(response, 200)

      user = Person.query.filter_by(email='aturing@example.com').one()
      self.assertEqual(user.name, 'Alan Turing')

      roles = UserRole.query.filter_by(person_id=user.id)
      self.assertEqual(roles.count(), 0)

    # checks person profile was created successfully
    emails = ['aturing@example.com', ]
    acp_person_ids = [user.id]
    self.assert_person_profile_created(emails)
    self.assert_profiles_restrictions()
    self.assert_acp_created(acp_person_ids)

  @mock.patch('ggrc.settings.INTEGRATION_SERVICE_URL', new='endpoint')
  @mock.patch('ggrc.settings.AUTHORIZED_DOMAIN', new='example.com')
  def test_wrong_user_creation(self):
    """Test wrong user creation."""
    with mock.patch.multiple(
        PersonClient,
        _post=mock.MagicMock(return_value={'persons': []})
    ):
      data = json.dumps([{'person': {
          'name': 'Alan Turing',
          'email': 'aturing@example.com',
          'context': None,
          'external': True
      }}])
      response = self._post(data)
      self.assertStatus(response, 400)

      user = Person.query.filter_by(email='aturing@example.com').first()
      self.assertIsNone(user)

    # checks person profile restrictions
    self.assert_profiles_restrictions()

  @mock.patch('ggrc.settings.INTEGRATION_SERVICE_URL', new='endpoint')
  @mock.patch('ggrc.settings.AUTHORIZED_DOMAIN', new='example.com')
  @freeze_time("2019-05-17 17:52:44")
  def test_creation_with_empty_name(self):
    """Test user creation with empty name."""
    with mock.patch.multiple(
        PersonClient,
        _post=self._mock_post
    ):
      data = json.dumps([{'person': {
          'name': '',
          'email': 'aturing@example.com',
          'context': None,
          'external': True
      }}])
      response = self._post(data)
      self.assertStatus(response, 200)

      user = Person.query.filter_by(email='aturing@example.com').first()
      self.assertEquals(user.name, 'aturing')

    # checks person profile restrictions
    self.assert_profiles_restrictions()

  @mock.patch('ggrc.settings.INTEGRATION_SERVICE_URL', new='endpoint')
  @mock.patch('ggrc.settings.AUTHORIZED_DOMAIN', new='example.com')
  @freeze_time("2018-05-20 10:22:22")
  def test_person_import_for_audit(self):
    """Test for mapped persons to an Audit"""
    with mock.patch.multiple(
        PersonClient,
        _post=self._mock_post
    ):
      program = factories.ProgramFactory()
      response = self.import_data(OrderedDict([
          ("object_type", "Audit"),
          ("Code*", ""),
          ("Program*", program.slug),
          ("Auditors", "cbabbage@example.com"),
          ("Title", "Title"),
          ("State", "Planned"),
          ("Audit Captains", "aturing@example.com")
      ]))
      self._check_csv_response(response, {})
      audit = Audit.query.filter(Audit.program_id == program.id).first()
      auditors = [person.email for person, acl in audit.access_control_list
                  if acl.ac_role.name == "Auditors"]
      captains = [person.email for person, acl in audit.access_control_list
                  if acl.ac_role.name == "Audit Captains"]
      self.assertItemsEqual(["cbabbage@example.com"], auditors)
      self.assertItemsEqual(["aturing@example.com"], captains)

      # checks person profile was created successfully
      emails = ["aturing@example.com", "cbabbage@example.com"]
      self.assert_person_profile_created(emails)
      self.assert_profiles_restrictions()

  @mock.patch('ggrc.settings.INTEGRATION_SERVICE_URL', new='endpoint')
  @mock.patch('ggrc.settings.AUTHORIZED_DOMAIN', new='example.com')
  @freeze_time("2018-05-20 10:22:22")
  def test_person_import_for_assessment(self):  # pylint: disable=invalid-name
    """Test for mapped persons to an Assessment"""
    with mock.patch.multiple(
        PersonClient,
        _post=self._mock_post
    ):
      audit = factories.AuditFactory()
      response = self.import_data(OrderedDict([
          ("object_type", "Assessment"),
          ("Code*", ""),
          ("Audit*", audit.slug),
          ("Creators*", "aturing@example.com"),
          ("Assignees*", "aturing@example.com"),
          ("Secondary Contacts", "cbabbage@example.com"),
          ("Title", "Title")
      ]))
      self._check_csv_response(response, {})
      assessment = Assessment.query.filter(
          Assessment.audit_id == audit.id).first()
      creators_acl = assessment.acr_name_acl_map["Creators"]
      creators = [
          acp.person.email
          for acp in creators_acl.access_control_people
      ]
      assignees_acl = assessment.acr_name_acl_map["Assignees"]
      assignees = [
          acp.person.email
          for acp in assignees_acl.access_control_people
      ]
      contacts_acl = assessment.acr_name_acl_map["Secondary Contacts"]
      secondary_contacts = [
          acp.person.email
          for acp in contacts_acl.access_control_people
      ]
      self.assertIn("aturing@example.com", creators)
      self.assertIn("aturing@example.com", assignees)
      self.assertEqual("cbabbage@example.com", secondary_contacts[0])

      # checks person profile was created successfully
      emails = ["aturing@example.com", "cbabbage@example.com"]
      self.assert_person_profile_created(emails)
      self.assert_profiles_restrictions()

  # pylint: disable=invalid-name
  @mock.patch('ggrc.settings.INTEGRATION_SERVICE_URL', new='endpoint')
  @mock.patch('ggrc.settings.AUTHORIZED_DOMAIN', new='example.com')
  @freeze_time("2018-05-20 08:22:22")
  def test_person_import_for_assessment_template(self):
    """Test for mapped persons for an assessment template"""
    with mock.patch.multiple(
        PersonClient,
        _post=self._mock_post
    ):
      audit = factories.AuditFactory()

      response = self.import_data(OrderedDict([
          ("object_type", "Assessment_Template"),
          ("Code*", ""),
          ("Audit*", audit.slug),
          ("Default Assignees", "aturing@example.com"),
          ("Default Verifiers", "aturing@example.com\ncbabbage@example.com"),
          ("Title", "Title"),
          ("Default Assessment Type", 'Control'),
      ]))
      self._check_csv_response(response, {})
      assessment_template = AssessmentTemplate.query.filter(
          AssessmentTemplate.audit_id == audit.id).first()

      self.assertEqual(len(assessment_template.default_people['verifiers']), 2)
      self.assertEqual(len(assessment_template.default_people['assignees']), 1)

    # checks person profile was created successfully
    emails = ["aturing@example.com", "cbabbage@example.com"]
    self.assert_person_profile_created(emails)
    self.assert_profiles_restrictions()

  @mock.patch('ggrc.settings.INTEGRATION_SERVICE_URL', new='endpoint')
  @mock.patch('ggrc.settings.AUTHORIZED_DOMAIN', new='example.com')
  @freeze_time("2018-05-30 12:58:22")
  def test_import_no_assignees(self):
    """Test for import assessment template without default assignees"""
    with mock.patch.multiple(
        PersonClient,
        _post=self._mock_post
    ):
      audit = factories.AuditFactory()

      response = self.import_data(OrderedDict([
          ("object_type", "Assessment_Template"),
          ("Code*", ""),
          ("Audit*", audit.slug),
          ("Default Verifiers", "aturing@example.com"),
          ("Title", "Title"),
          ("Default Assessment Type", 'Control'),
      ]))
      self._check_csv_response(
          response,
          {"Assessment Template": {
              "row_errors": {errors.MISSING_COLUMN.format(
                  line=3, column_names="Default Assignees", s="")}}})

    # checks person profile was created successfully
    emails = ["aturing@example.com", ]
    self.assert_person_profile_created(emails)
    self.assert_profiles_restrictions()

  @mock.patch('ggrc.settings.INTEGRATION_SERVICE_URL', new='endpoint')
  @mock.patch('ggrc.settings.AUTHORIZED_DOMAIN', new='example.com')
  @freeze_time("2018-05-30 12:56:17")
  @ddt.data(
      "",
      "--"
  )
  def test_empty_assignees_import(self, assignees):
    """Test for import assessment template with empty default assignees"""
    with mock.patch.multiple(
        PersonClient,
        _post=self._mock_post
    ):
      audit = factories.AuditFactory()

      response = self.import_data(OrderedDict([
          ("object_type", "Assessment_Template"),
          ("Code*", ""),
          ("Audit*", audit.slug),
          ("Default Assignees", assignees),
          ("Default Verifiers", "aturing@example.com"),
          ("Title", "Title"),
          ("Default Assessment Type", 'Control'),
      ]))
      self._check_csv_response(
          response,
          {"Assessment Template": {
              "row_errors": {errors.WRONG_REQUIRED_VALUE.format(
                  line=3, value=assignees, column_name="Default Assignees")}}})

    # checks person profile was created successfully
    emails = ["aturing@example.com", ]
    self.assert_person_profile_created(emails)
    self.assert_profiles_restrictions()

  @mock.patch('ggrc.settings.INTEGRATION_SERVICE_URL', new='endpoint')
  @mock.patch('ggrc.settings.AUTHORIZED_DOMAIN', new='example.com')
  @freeze_time("2018-05-21 01:11:11")
  def test_wrong_person_import(self):
    """Test for wrong person import"""
    with mock.patch.multiple(
        PersonClient,
        _post=mock.MagicMock(return_value={'persons': [{
            'firstName': "Alan",
            'lastName': 'Turing',
            'username': "aturing"}]})
    ):
      audit = factories.AuditFactory()
      response = self.import_data(OrderedDict([
          ("object_type", "Assessment_Template"),
          ("Code*", ""),
          ("Audit*", audit.slug),
          ("Default Assignees", "aturing@example.com"),
          ("Default Verifiers", "aturing@example.com\ncbabbage@example.com"),
          ("Title", "Title"),
          ("Default Assessment Type", 'Control'),
      ]))
      self._check_csv_response(
          response,
          {"Assessment Template": {
              "row_warnings": {errors.UNKNOWN_USER_WARNING.format(
                  line=3, email="cbabbage@example.com")}}})

    # checks person profile was created successfully
    emails = ["aturing@example.com", ]
    self.assert_person_profile_created(emails)
    self.assert_profiles_restrictions()

  @mock.patch('ggrc.settings.INTEGRATION_SERVICE_URL', new='endpoint')
  @mock.patch('ggrc.settings.AUTHORIZED_DOMAIN', new='example.com')
  @freeze_time("2018-05-30 02:22:11")
  def test_verifier_import(self):
    """Test for verifiers import"""
    with mock.patch.multiple(
        PersonClient,
        _post=mock.MagicMock(return_value={'persons': [{
            'firstName': 'Alan',
            'lastName': 'Turing',
            'username': 'aturing'}]})
    ):
      audit = factories.AuditFactory()
      response = self.import_data(OrderedDict([
          ('object_type', 'Assessment_Template'),
          ('Code*', ''),
          ('Audit*', audit.slug),
          ('Default Assignees', 'aturing@example.com'),
          ('Default Verifiers', 'aturing@example.com'),
          ('Title', 'Title'),
          ('Default Assessment Type', 'Control'),
      ]))
      assessment_template = AssessmentTemplate.query.filter(
          AssessmentTemplate.audit_id == audit.id).first()

      self._check_csv_response(response, {})
      self.assertEqual(
          len(assessment_template.default_people['assignees']), 1)
      self.assertEqual(
          len(assessment_template.default_people['verifiers']), 1)

    # checks person profile was created successfully
    emails = ["aturing@example.com", ]
    self.assert_person_profile_created(emails)
    self.assert_profiles_restrictions()

  @mock.patch('ggrc.settings.INTEGRATION_SERVICE_URL', new='endpoint')
  @mock.patch('ggrc.settings.AUTHORIZED_DOMAIN', new='example.com')
  @freeze_time("2018-05-30 02:22:11")
  @ddt.data(
      ('', 'aturing@example.com', {
          'Assessment Template': {
              'row_errors': {
                  errors.WRONG_REQUIRED_VALUE.format(
                      line=3, value='',
                      column_name='Default Assignees')
              }
          }
      }),
  )
  @ddt.unpack
  def test_invalid_verifier_import(self, assignee_email,
                                   verifier_email, expected_errors):
    """Test for invalid verifier import"""
    with mock.patch.multiple(
        PersonClient,
        _post=mock.MagicMock(return_value={'persons': [{
            'firstName': 'Alan',
            'lastName': 'Turing',
            'username': 'aturing'}]})
    ):
      audit = factories.AuditFactory()
      response = self.import_data(OrderedDict([
          ('object_type', 'Assessment_Template'),
          ('Code*', ''),
          ('Audit*', audit.slug),
          ('Default Assignees', assignee_email),
          ('Default Verifiers', verifier_email),
          ('Title', 'Title'),
          ('Default Assessment Type', 'Control'),
      ]))

      self._check_csv_response(response, expected_errors)

    # checks person profile was created successfully
    emails = ["aturing@example.com", ]
    self.assert_person_profile_created(emails)
    self.assert_profiles_restrictions()

  @mock.patch('ggrc.settings.INTEGRATION_SERVICE_URL', new='endpoint')
  @mock.patch('ggrc.settings.AUTHORIZED_DOMAIN', new='example.com')
  @freeze_time("2019-09-10 11:11:11")
  @ddt.data(
      ('aturing@example.com', '', {}),
      ('aturing@example.com', '--', {})
  )
  @ddt.unpack
  def test_empty_verifiers_import(self, assignee_email,
                                  verifier_email, expected_errors):
    """Test for empty verifiers import"""
    with mock.patch.multiple(
        PersonClient,
        _post=mock.MagicMock(return_value={'persons': [{
            'firstName': 'Alan',
            'lastName': 'Turing',
            'username': 'aturing'}]})
    ):
      audit = factories.AuditFactory()
      response = self.import_data(OrderedDict([
          ('object_type', 'Assessment_Template'),
          ('Code*', ''),
          ('Audit*', audit.slug),
          ('Default Assignees', assignee_email),
          ('Default Verifiers', verifier_email),
          ('Title', 'Title'),
          ('Default Assessment Type', 'Control'),
      ]))
      assessment_template = AssessmentTemplate.query.filter(
          AssessmentTemplate.audit_id == audit.id).first()

      self._check_csv_response(response, expected_errors)
      self.assertEqual(len(assessment_template.default_people['assignees']), 1)
      self.assertEqual(assessment_template.default_people['verifiers'], None)

    # checks person profile was created successfully
    emails = ["aturing@example.com", ]
    self.assert_person_profile_created(emails)
    self.assert_profiles_restrictions()

  @mock.patch('ggrc.settings.INTEGRATION_SERVICE_URL', new='endpoint')
  @mock.patch('ggrc.settings.AUTHORIZED_DOMAIN', new='example.com')
  @freeze_time("2018-05-30 02:22:11")
  @ddt.data(
      ('--', None),
      ('', "Admin"),
  )
  @ddt.unpack
  def test_import_template_update(self, verifier_update_email,
                                  default_verifiers):
    """Test for template update via import."""
    with mock.patch.multiple(
        PersonClient,
        _post=self._mock_post
    ):
      audit = factories.AuditFactory()
      assessment_template = factories.AssessmentTemplateFactory(audit=audit)
      response = self.import_data(OrderedDict([
          ('object_type', 'Assessment_Template'),
          ('Code*', assessment_template.slug),
          ('Audit*', audit.slug),
          ('Default Assignees', 'aturing2@example.com'),
          ('Default Verifiers', verifier_update_email),
          ('Title', 'Title'),
          ('Default Assessment Type', 'Control'),
      ]))
      updated_template = AssessmentTemplate.query.filter(
          AssessmentTemplate.slug == assessment_template.slug).first()
      self._check_csv_response(response, {})
      self.assertNotEqual(updated_template.default_people['assignees'],
                          assessment_template.default_people['assignees'])
      self.assertEqual(updated_template.default_people['verifiers'],
                       default_verifiers)

  @mock.patch('ggrc.settings.INTEGRATION_SERVICE_URL', new='endpoint')
  @mock.patch('ggrc.settings.AUTHORIZED_DOMAIN', new='example.com')
  @freeze_time("2018-04-30 02:22:11")
  def test_assignee_import(self):
    """Test for assignees import"""
    with mock.patch.multiple(
        PersonClient,
        _post=mock.MagicMock(return_value={'persons': [{
            'firstName': 'Alan',
            'lastName': 'Turing',
            'username': 'aturing'}]})
    ):
      audit = factories.AuditFactory()
      response = self.import_data(OrderedDict([
          ('object_type', 'Assessment_Template'),
          ('Code*', ''),
          ('Audit*', audit.slug),
          ('Default Assignees', 'aturing@example.com'),
          ('Title', 'Title'),
          ('Default Assessment Type', 'Control'),
      ]))
      assessment_template = AssessmentTemplate.query.filter(
          AssessmentTemplate.audit_id == audit.id).first()

      self._check_csv_response(response, {})
      self.assertEqual(len(assessment_template.default_people['assignees']), 1)

    # checks person profile was created successfully
    emails = ["aturing@example.com", ]
    self.assert_person_profile_created(emails)
    self.assert_profiles_restrictions()

  @mock.patch('ggrc.settings.INTEGRATION_SERVICE_URL', new='endpoint')
  @mock.patch('ggrc.utils.user_generator.search_user', return_value='user')
  def test_invalid_email_import(self, _):
    """Test import of invalid email."""
    wrong_email = "some_wrong_email"
    audit = factories.AuditFactory()

    response = self.import_data(OrderedDict([
        ("object_type", "Assessment"),
        ("Code*", ""),
        ("Audit*", audit.slug),
        ("Assignees*", wrong_email),
        ("Title", "Some title"),
    ]))
    expected_errors = {
        "Assessment": {
            "row_errors": {
                errors.VALIDATION_ERROR.format(
                    line=3,
                    column_name="Assignees",
                    message="Email address '{}' is invalid."
                            " Valid email must be provided".format(wrong_email)
                )
            },
            "row_warnings": {
                errors.UNKNOWN_USER_WARNING.format(
                    line=3, email=wrong_email
                ),
                errors.OWNER_MISSING.format(
                    line=3, column_name="Assignees"
                ),
            }
        }
    }
    self._check_csv_response(response, expected_errors)

    # checks person profile restrictions
    self.assert_profiles_restrictions()
