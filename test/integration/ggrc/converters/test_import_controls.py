# Copyright (C) 2018 Google Inc.
# Licensed under http://www.apache.org/licenses/LICENSE-2.0 <see LICENSE file>

# pylint: disable=maybe-no-member, invalid-name

"""Test request import and updates."""

import collections
from ggrc import db
from ggrc.models import all_models
from ggrc.converters import errors

from integration.ggrc import TestCase
from integration.ggrc.models import factories


class TestControlsImport(TestCase):
  """Basic Assessment import tests with.

  This test suite should test new Assessment imports, exports, and updates.
  The main focus of these tests is checking error messages for invalid state
  transitions.
  """

  def setUp(self):
    """Set up for Assessment test cases."""
    super(TestControlsImport, self).setUp()
    self.client.get("/login")

  def test_import_controls_with_documents(self):
    """Controls can be imported with Documents."""
    self.import_file("controls_no_warnings.csv")

    document = all_models.Document.query.filter_by(
        link="https://img_123.jpg").all()
    self.assertEqual(len(document), 1)
    control = all_models.Control.query.filter_by(slug="control-3").first()
    self.assertEqual(control.documents_reference_url[0].link,
                     "https://img_123.jpg")

  def test_add_admin_to_document(self):
    """Test evidence should have current user as admin"""
    control = factories.ControlFactory()
    self.import_data(collections.OrderedDict([
        ("object_type", "Control"),
        ("code", control.slug),
        ("Reference Url", "supercool.com"),
    ]))
    documents = all_models.Document.query.filter(
        all_models.Document.kind == all_models.Document.REFERENCE_URL).all()
    self.assertEquals(len(documents), 1)
    admin_role = db.session.query(all_models.AccessControlRole).filter_by(
        name="Admin", object_type="Document").one()
    current_user = db.session.query(all_models.Person).filter_by(
        email="user@example.com").one()
    person, acr = documents[0].access_control_list[0]
    self.assertEquals(acr.ac_role_id, admin_role.id)
    self.assertEquals(person.id, current_user.id)

  def test_import_control_end_date(self):
    """End date on control should be non editable."""
    control = factories.ControlFactory()
    self.assertIsNone(control.end_date)
    resp = self.import_data(collections.OrderedDict([
        ("object_type", "Control"),
        ("code", control.slug),
        ("Last Deprecated Date", "06/06/2017"),
    ]))
    control = all_models.Control.query.get(control.id)
    self.assertEqual(1, len(resp))
    self.assertEqual(1, resp[0]["updated"])
    self.assertIsNone(control.end_date)

  def test_import_control_deprecated(self):
    """End date should be set up after import in deprecated state."""
    control = factories.ControlFactory()
    self.assertIsNone(control.end_date)
    resp = self.import_data(collections.OrderedDict([
        ("object_type", "Control"),
        ("code", control.slug),
        ("state", all_models.Control.DEPRECATED),
    ]))
    control = all_models.Control.query.get(control.id)
    self.assertEqual(1, len(resp))
    self.assertEqual(1, resp[0]["updated"])
    self.assertEqual(control.status, control.DEPRECATED)
    self.assertIsNotNone(control.end_date)

  def test_import_control_duplicate_slugs(self):
    """Test import does not fail when two objects with the same slug are
    imported."""
    with factories.single_commit():
      role_name = factories.AccessControlRoleFactory(
          object_type="Control").name
      emails = [factories.PersonFactory().email for _ in range(2)]

    control = factories.ControlFactory()
    self.import_data(collections.OrderedDict([
        ("object_type", "Control"),
        ("code", control.slug),
        ("title", "Title"),
        ("Admin", "user@example.com"),
        (role_name, "\n".join(emails)),
    ]))

    import_dicts = [
        collections.OrderedDict([
            ("object_type", "Control"),
            ("code", control.slug),
            ("title", "Title"),
            ("Admin", "user@example.com"),
            (role_name, "\n".join(emails)),
        ]),
        collections.OrderedDict([
            ("object_type", "Control"),
            ("code", control.slug),
            ("title", "Title"),
            ("Admin", "user@example.com"),
            (role_name, "\n".join(emails)),
        ]),
    ]
    response = self.import_data(*import_dicts)
    fail_response = {u'message': u'Import failed due to server error.',
                     u'code': 400}
    self.assertNotEqual(response, fail_response)

  def test_import_control_with_document_file(self):
    """Test import document file should add warning"""
    control = factories.ControlFactory()
    response = self.import_data(collections.OrderedDict([
        ("object_type", "Control"),
        ("code", control.slug),
        ("Document File", "supercool.com"),
    ]))
    docs = all_models.Document.query.filter(
        all_models.Document.kind == all_models.Document.FILE).all()
    self.assertEquals(len(docs), 0)
    expected_warning = (u"Line 3: 'Document File' can't be changed via import."
                        u" Please go on {} page and make changes"
                        u" manually. "
                        u"The column will be skipped".format(control.type))

    self.assertEquals([expected_warning], response[0]['row_warnings'])

  def test_import_control_with_doc_file_existing(self):
    """If file already mapped to control not show warning to user"""
    doc_url = "test_gdrive_url"

    with factories.single_commit():
      control = factories.ControlFactory()
      control_slug = control.slug
      doc = factories.DocumentFileFactory(link=doc_url)
      factories.RelationshipFactory(source=control,
                                    destination=doc)
    response = self.import_data(collections.OrderedDict([
        ("object_type", "Control"),
        ("Code*", control_slug),
        ("Document File", doc_url),
    ]))
    self.assertEquals([], response[0]['row_warnings'])

  def test_import_control_with_doc_url_existing(self):
    """If reference url already mapped to control ignore it"""
    doc_reference_url = "test_reference_url"

    with factories.single_commit():
      control = factories.ControlFactory()
      control_slug = control.slug
      doc = factories.DocumentReferenceUrlFactory(link=doc_reference_url)
      factories.RelationshipFactory(source=control,
                                    destination=doc)
    response = self.import_data(collections.OrderedDict([
        ("object_type", "Control"),
        ("Code*", control_slug),
        ("Reference Url", doc_reference_url),
    ]))

    documents = all_models.Document.query.filter_by(
        link=doc_reference_url
    ).all()
    self.assertEquals(1, len(documents))
    self.assertEquals([], response[0]['row_warnings'])

  def test_import_control_with_doc_file_multiple(self):
    """Show warning if at least one of Document Files not mapped"""
    doc_url = "test_gdrive_url"

    with factories.single_commit():
      control = factories.ControlFactory()
      control_slug = control.slug
      doc1 = factories.DocumentFileFactory(link=doc_url)
      factories.RelationshipFactory(source=control,
                                    destination=doc1)
      doc2 = factories.DocumentFileFactory(link="test_gdrive_url_2")
      factories.RelationshipFactory(source=control,
                                    destination=doc2)

    response = self.import_data(collections.OrderedDict([
        ("object_type", "Control"),
        ("Code*", control_slug),
        ("Document File", doc_url + "\n another_gdrive_url"),
    ]))
    expected_warning = (u"Line 3: 'Document File' can't be changed via import."
                        u" Please go on {} page and make changes"
                        u" manually. The column will be "
                        u"skipped".format(control.type))
    self.assertEquals([expected_warning], response[0]['row_warnings'])

  def test_import_assessment_with_doc_file_blank_multiple(self):
    """No warnings in Document Files mapping"""
    doc_file = "test_gdrive_url \n \n test_gdrive_url_2"

    with factories.single_commit():
      control = factories.ControlFactory()
      control_slug = control.slug
      doc1 = factories.DocumentFileFactory(link="test_gdrive_url")
      factories.RelationshipFactory(source=control,
                                    destination=doc1)
      doc2 = factories.DocumentFileFactory(link="test_gdrive_url_2")
      factories.RelationshipFactory(source=control,
                                    destination=doc2)

    response = self.import_data(collections.OrderedDict([
        ("object_type", "Control"),
        ("Code*", control_slug),
        ("Document File", doc_file),
    ]))

    self.assertEquals([], response[0]['row_warnings'])

  def test_update_reference_url(self):
    """Reference Url updated properly via import"""
    doc_url = "test_gdrive_url"
    with factories.single_commit():
      control1 = factories.ControlFactory()
      control1_slug = control1.slug
      control2 = factories.ControlFactory()

      doc = factories.DocumentReferenceUrlFactory(link=doc_url)
      factories.RelationshipFactory(source=control1, destination=doc)
      factories.RelationshipFactory(source=control2, destination=doc)

    self.import_data(collections.OrderedDict([
        ("object_type", "Control"),
        ("Code*", control1_slug),
        ("Reference Url", "new_gdrive_url"),
    ]))

    control1 = all_models.Control.query.filter_by(slug=control1_slug).one()
    self.assertEquals(1, len(control1.documents_reference_url))
    self.assertEquals("new_gdrive_url",
                      control1.documents_reference_url[0].link)

  def test_assertion_update(self):
    """Test valid import of category and assertion fields."""
    assertions = all_models.ControlAssertion.query.all()
    with factories.single_commit():
      control1 = factories.ControlFactory(
          assertions=assertions[:3],
      )
    slug = control1.slug
    new_assertion = assertions[4].name

    response = self.import_data(collections.OrderedDict([
        ("object_type", "Control"),
        ("Code*", slug),
        ("Title", "edited control 1"),
        ("Assertions", ""),
    ]))
    self._check_csv_response(response, {})

    control = all_models.Control.query.first()
    self.assertEqual(len(control.assertions), 3)

    response = self.import_data(collections.OrderedDict([
        ("object_type", "Control"),
        ("Code*", slug),
        ("Title", "edited control 2"),
        ("Assertions", new_assertion),
    ]))
    self._check_csv_response(response, {})

    control = all_models.Control.query.first()
    self.assertEqual(len(control.assertions), 1)
    self.assertEqual(control.assertions[0].name, new_assertion)

  def test_assertion_creation(self):
    """Test creating a control with proper assertion field."""
    assertion_name = all_models.ControlAssertion.query.first().name
    response = self.import_data(collections.OrderedDict([
        ("object_type", "Control"),
        ("Code*", ""),
        ("Title", "new control 1"),
        ("Admin", "user@example.com"),
        ("Assertions", assertion_name),
    ]))
    self._check_csv_response(response, {})
    control = all_models.Control.query.first()
    self.assertEqual(len(control.assertions), 1)
    self.assertEqual(control.assertions[0].name, assertion_name)

  def test_assertion_errors(self):
    """Test creating a control without an assertion field"""
    response = self.import_data(collections.OrderedDict([
        ("object_type", "Control"),
        ("Code*", ""),
        ("Title", "bad control"),
        ("Assertions", ""),
    ]))
    self._check_csv_response(response, {
        "Control":
        {
            "row_errors": {
                errors.MISSING_VALUE_ERROR.format(
                    line=3,
                    column_name="Assertions",
                )
            }
        }
    })
    self.assertEqual(all_models.Control.query.count(), 0)

  def test_invalid_assertions(self):
    """Test creating a control without an assertion field"""
    invalid_assertion = "invalid assertion content"
    response = self.import_data(collections.OrderedDict([
        ("object_type", "Control"),
        ("Code*", ""),
        ("Title", "bad control"),
        ("Assertions", invalid_assertion),
    ]))
    self._check_csv_response(response, {
        "Control":
        {
            "row_warnings": {
                errors.WRONG_MULTI_VALUE.format(
                    line=3,
                    column_name="Assertions",
                    value=invalid_assertion,
                ),
            },
            "row_errors": {
                errors.MISSING_VALUE_ERROR.format(
                    line=3,
                    column_name="Assertions",
                ),
            },
        }
    })
    self.assertEqual(all_models.Control.query.count(), 0)

  def test_assertion_removal(self):
    """Test creating a control without an assertion field"""

    assertions = all_models.ControlAssertion.query.all()
    assertion_name = assertions[4].name
    with factories.single_commit():
      control1 = factories.ControlFactory(
          assertions=[assertions[4]],
      )
    slug = control1.slug

    response = self.import_data(collections.OrderedDict([
        ("object_type", "Control"),
        ("Code*", slug),
        ("Title", "edited control 1"),
        ("Assertions", "--"),
    ]))
    self._check_csv_response(response, {
        "Control":
        {
            "row_warnings": {
                errors.WRONG_MULTI_VALUE.format(
                    line=3,
                    column_name="Assertions",
                    value="--",
                ),
            },
        }
    })
    control = all_models.Control.query.first()
    self.assertEqual(len(control.assertions), 1)
    self.assertEqual(control.assertions[0].name, assertion_name)
