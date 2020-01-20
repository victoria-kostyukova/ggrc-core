# Copyright (C) 2020 Google Inc.
# Licensed under http://www.apache.org/licenses/LICENSE-2.0 <see LICENSE file>

"""Integration test for AutoStatusChangeable mixin related evidence"""
import collections

import ddt

from ggrc import models
from integration.ggrc.access_control import acl_helper
from integration.ggrc.models import factories
from integration.ggrc.models.mixins import test_autostatuschangable as asc


@ddt.ddt
class TestEvidences(asc.TestMixinAutoStatusChangeableBase):
  """Test case for AutoStatusChangeable evidences handlers"""
  # pylint: disable=invalid-name

  @ddt.data(
      ('URL', models.Assessment.DONE_STATE,
       models.Assessment.PROGRESS_STATE),
      ('URL', models.Assessment.START_STATE,
       models.Assessment.PROGRESS_STATE),
      ('URL', models.Assessment.FINAL_STATE,
       models.Assessment.PROGRESS_STATE),
      ('FILE', models.Assessment.DONE_STATE,
       models.Assessment.PROGRESS_STATE),
      ('FILE', models.Assessment.START_STATE,
       models.Assessment.PROGRESS_STATE),
      ('FILE', models.Assessment.FINAL_STATE,
       models.Assessment.PROGRESS_STATE),
      ('FILE', models.Assessment.REWORK_NEEDED,
       models.Assessment.REWORK_NEEDED)
  )
  @ddt.unpack
  def test_evidence_added_status_check(self, kind,
                                       from_status, expected_status):
    """Move Assessment from '{1}' to '{2}' adding evidence of type {0}"""
    assessment = factories.AssessmentFactory(status=from_status)
    related_evidence = {
        'id': None,
        'type': 'Evidence',
        'kind': kind,
        'title': 'google.com',
        'link': 'google.com',
        'source_gdrive_id': 'some_id'
    }
    response = self.api.put(assessment, {
        'actions': {
            'add_related': [related_evidence]
        }
    })
    assessment = self.refresh_object(assessment)
    self.assert200(response, response.json)
    self.assertEqual(expected_status, assessment.status)

  @ddt.data(
      ('URL', models.Assessment.DONE_STATE,
       models.Assessment.PROGRESS_STATE),
      ('URL', models.Assessment.START_STATE,
       models.Assessment.PROGRESS_STATE),
      ('URL', models.Assessment.FINAL_STATE,
       models.Assessment.PROGRESS_STATE),
      ('FILE', models.Assessment.DONE_STATE,
       models.Assessment.PROGRESS_STATE),
      ('FILE', models.Assessment.START_STATE,
       models.Assessment.PROGRESS_STATE),
      ('FILE', models.Assessment.FINAL_STATE,
       models.Assessment.PROGRESS_STATE),
      ('FILE', models.Assessment.REWORK_NEEDED,
       models.Assessment.REWORK_NEEDED)
  )
  @ddt.unpack
  def test_evidence_remove_related(self, kind,
                                   from_status, expected_status):
    """Move Assessment from '{1}' to '{2}' remove evidence of type {0}"""
    with factories.single_commit():
      assessment = factories.AssessmentFactory(status=from_status)
      evidence = factories.EvidenceFactory(kind=kind,
                                           title='google.com',
                                           link='google.com',
                                           source_gdrive_id='some_id')
      factories.RelationshipFactory(destination=assessment, source=evidence)

    response = self.api.put(assessment, {
        'actions': {
            'remove_related': [{
                'id': evidence.id,
                'type': 'Evidence',
            }]
        }
    })
    assessment = self.refresh_object(assessment)
    self.assert200(response)
    self.assertEqual(expected_status, assessment.status)

  @ddt.data(
      ('URL', models.Assessment.DONE_STATE,
       models.Assessment.PROGRESS_STATE),
      ('URL', models.Assessment.START_STATE,
       models.Assessment.PROGRESS_STATE),
      ('URL', models.Assessment.FINAL_STATE,
       models.Assessment.PROGRESS_STATE),
      ('FILE', models.Assessment.DONE_STATE,
       models.Assessment.PROGRESS_STATE),
      ('FILE', models.Assessment.START_STATE,
       models.Assessment.PROGRESS_STATE),
      ('FILE', models.Assessment.FINAL_STATE,
       models.Assessment.PROGRESS_STATE),
      ('FILE', models.Assessment.REWORK_NEEDED,
       models.Assessment.REWORK_NEEDED)
  )
  @ddt.unpack
  def test_evidence_delete(self, kind, from_status,
                           expected_status):
    """Move Assessment from '{1}' to '{2}' delete evidence of type {0}"""
    with factories.single_commit():
      assessment = factories.AssessmentFactory(status=from_status)
      evidence = factories.EvidenceFactory(kind=kind,
                                           title='google.com',
                                           link='google.com',
                                           source_gdrive_id='some_id')
      factories.RelationshipFactory(destination=assessment, source=evidence)
    assessment_id = assessment.id
    response = self.api.delete(evidence)
    assessment = self.refresh_object(assessment, assessment_id)
    self.assert200(response)
    self.assertEqual(expected_status, assessment.status)

  @ddt.data(
      ('URL', models.Assessment.DONE_STATE,
       models.Assessment.PROGRESS_STATE),
      ('URL', models.Assessment.START_STATE,
       models.Assessment.PROGRESS_STATE),
      ('URL', models.Assessment.FINAL_STATE,
       models.Assessment.PROGRESS_STATE),
      ('FILE', models.Assessment.DONE_STATE,
       models.Assessment.PROGRESS_STATE),
      ('FILE', models.Assessment.START_STATE,
       models.Assessment.PROGRESS_STATE),
      ('FILE', models.Assessment.FINAL_STATE,
       models.Assessment.PROGRESS_STATE),
      ('FILE', models.Assessment.REWORK_NEEDED,
       models.Assessment.REWORK_NEEDED)
  )
  @ddt.unpack
  def test_evidence_update_status_check(self, kind, from_status,
                                        expected_status):
    """Move Assessment from '{1}' to '{2}' update evidence of type {0}"""
    with factories.single_commit():
      assessment = factories.AssessmentFactory(status=from_status)
      evidence = factories.EvidenceFactory(kind=kind,
                                           title='google.com',
                                           link='google.com',
                                           source_gdrive_id='some_id')
      factories.RelationshipFactory(destination=assessment, source=evidence)
    assessment_id = assessment.id
    response = self.api.modify_object(evidence, {
        'title': 'New evidence',
        'link': 'New evidence',
    })
    assessment = self.refresh_object(assessment, assessment_id)
    self.assert200(response)
    self.assertEqual(expected_status, assessment.status)

  @ddt.data(
      ('URL', models.Assessment.FINAL_STATE, models.Assessment.PROGRESS_STATE),
      ('FILE', models.Assessment.FINAL_STATE, models.Assessment.FINAL_STATE),
  )
  @ddt.unpack
  def test_evidence_import_unmap(self, kind, from_status, expected_status):
    """Move Assessment from '{1}' to '{2}' if evidence unmapped in import."""
    with factories.single_commit():
      assessment = factories.AssessmentFactory(status=from_status)
      evidence = factories.EvidenceFactory(
          kind=kind,
          title='google.com',
          link='google.com',
          source_gdrive_id='some_id'
      )
      factories.RelationshipFactory(destination=assessment, source=evidence)

    response = self.import_data(collections.OrderedDict([
        ("object_type", "Assessment"),
        ("Code*", assessment.slug),
        ("Evidence URL", ""),
        ("Evidence File", ""),
    ]))
    self._check_csv_response(response, {})
    assessment = self.refresh_object(assessment)
    self.assertEqual(expected_status, assessment.status)

  @ddt.data(
      ("URL", models.Assessment.DONE_STATE),
      ("URL", models.Assessment.FINAL_STATE),
      ("URL", models.Assessment.DEPRECATED),
      ("FILE", models.Assessment.DONE_STATE),
      ("FILE", models.Assessment.FINAL_STATE),
      ("FILE", models.Assessment.DEPRECATED)
  )
  @ddt.unpack
  def test_put_empty_evidence_data(self, kind, status):
    """Test put empty evidence data assessment status changed"""
    with factories.single_commit():
      assessment = factories.AssessmentFactory(status=status)
      assessment_id = assessment.id
      evidence = factories.EvidenceFactory(kind=kind)
      factories.RelationshipFactory(destination=assessment,
                                    source=evidence)
    self.api.put(evidence, {})
    assessment = self.refresh_object(assessment, assessment_id)
    self.assertEqual(assessment.status, status)

  @ddt.data(
      ("URL", "notes", models.Assessment.DONE_STATE),
      ("URL", "notes", models.Assessment.FINAL_STATE),
      ("URL", "notes", models.Assessment.DEPRECATED),
      ("URL", "description", models.Assessment.DONE_STATE),
      ("URL", "description", models.Assessment.FINAL_STATE),
      ("URL", "description", models.Assessment.DEPRECATED),
      ("FILE", "notes", models.Assessment.DONE_STATE),
      ("FILE", "notes", models.Assessment.FINAL_STATE),
      ("FILE", "notes", models.Assessment.DEPRECATED),
      ("FILE", "description", models.Assessment.DONE_STATE),
      ("FILE", "description", models.Assessment.FINAL_STATE),
      ("FILE", "description", models.Assessment.DEPRECATED)
  )
  @ddt.unpack
  def test_put_ignored_evidence_attrs(self, kind, attr_name, status):
    """Test assessment status not changed after evidence attr {2} changed."""
    with factories.single_commit():
      assessment = factories.AssessmentFactory(status=status)
      assessment_id = assessment.id
      evidence = factories.EvidenceFactory(kind=kind)
      evidence_id = evidence.id
      factories.RelationshipFactory(destination=assessment,
                                    source=evidence)
    self.api.put(evidence, {attr_name: "test text"})
    assessment = self.refresh_object(assessment, assessment_id)
    evidence = self.refresh_object(evidence, evidence_id)
    self.assertEqual(assessment.status, status)
    self.assertEqual(getattr(evidence, attr_name), "test text")

  @ddt.data(
      ("URL", models.Assessment.DONE_STATE),
      ("URL", models.Assessment.FINAL_STATE),
      ("FILE", models.Assessment.DONE_STATE),
      ("FILE", models.Assessment.FINAL_STATE),
  )
  @ddt.unpack
  def test_put_acl_evidence(self, kind, from_status):
    """Test put acl of evidence data asmt status changed {1} to In Progress"""
    expected_status = models.Assessment.PROGRESS_STATE
    with factories.single_commit():
      assessment = factories.AssessmentFactory(status=from_status)
      assessment_id = assessment.id
      evidence = factories.EvidenceFactory(kind=kind)
      factories.RelationshipFactory(destination=assessment,
                                    source=evidence)
      person_id = factories.PersonFactory().id
      role_id = models.AccessControlRole.query.filter(
          models.AccessControlRole.object_type == "Evidence",
          models.AccessControlRole.name == 'Admin',
      ).one().id
    self.api.put(
        evidence,
        {
            "access_control_list": [
                acl_helper.get_acl_json(role_id, person_id),
            ]
        }
    )
    assessment = self.refresh_object(assessment, assessment_id)
    self.assertEqual(assessment.status, expected_status)

  @ddt.data(
      ("URL", models.Assessment.DONE_STATE),
      ("URL", models.Assessment.FINAL_STATE),
      ("FILE", models.Assessment.DONE_STATE),
      ("FILE", models.Assessment.FINAL_STATE),
  )
  @ddt.unpack
  def test_put_acl_null_evidence(self, kind, status):
    """Test put acl null of evidence data assessment status changed"""
    expected_status = models.Assessment.PROGRESS_STATE
    with factories.single_commit():
      assessment = factories.AssessmentFactory(status=status)
      assessment_id = assessment.id
      evidence = factories.EvidenceFactory(kind=kind)
      factories.RelationshipFactory(destination=assessment,
                                    source=evidence)
      person = factories.PersonFactory()
      role = models.AccessControlRole.query.filter(
          models.AccessControlRole.object_type == "Evidence",
          models.AccessControlRole.name == 'Admin',
      ).one()
      evidence.add_person_with_role(person, role)
    self.api.put(evidence, {"access_control_list": []})
    assessment = self.refresh_object(assessment, assessment_id)
    self.assertEqual(assessment.status, expected_status)

  @ddt.data(
      ("URL", models.Assessment.DONE_STATE, models.Evidence.START_STATE,
       models.Evidence.DEPRECATED),
      ("URL", models.Assessment.DONE_STATE, models.Evidence.DEPRECATED,
       models.Evidence.START_STATE),
      ("URL", models.Assessment.FINAL_STATE, models.Evidence.START_STATE,
       models.Evidence.DEPRECATED),
      ("URL", models.Assessment.FINAL_STATE, models.Evidence.DEPRECATED,
       models.Evidence.START_STATE),
      ("FILE", models.Assessment.DONE_STATE, models.Evidence.START_STATE,
       models.Evidence.DEPRECATED),
      ("FILE", models.Assessment.DONE_STATE, models.Evidence.DEPRECATED,
       models.Evidence.START_STATE),
      ("FILE", models.Assessment.FINAL_STATE, models.Evidence.START_STATE,
       models.Evidence.DEPRECATED),
      ("FILE", models.Assessment.FINAL_STATE, models.Evidence.DEPRECATED,
       models.Evidence.START_STATE),
  )
  @ddt.unpack
  def test_put_status_evidence(self, kind, from_status,
                               evidence_from_status, evidence_to_status):
    """Test put evidence status and assessment status changed"""
    expected_status = models.Assessment.PROGRESS_STATE
    with factories.single_commit():
      assessment = factories.AssessmentFactory(status=from_status)
      assessment_id = assessment.id
      evidence = factories.EvidenceFactory(
          kind=kind, status=evidence_from_status
      )
      evidence_id = evidence.id
      factories.RelationshipFactory(destination=assessment,
                                    source=evidence)
    self.api.put(evidence, {'status': evidence_to_status})
    assessment = self.refresh_object(assessment, assessment_id)
    evidence = self.refresh_object(evidence, evidence_id)
    self.assertEqual(assessment.status, expected_status)
    self.assertEqual(evidence.status, evidence_to_status)

  @ddt.data(
      ("URL", models.Assessment.DONE_STATE, models.Evidence.START_STATE,
       models.Evidence.DEPRECATED),
      ("URL", models.Assessment.DONE_STATE, models.Evidence.DEPRECATED,
       models.Evidence.START_STATE),
      ("URL", models.Assessment.FINAL_STATE, models.Evidence.START_STATE,
       models.Evidence.DEPRECATED),
      ("URL", models.Assessment.FINAL_STATE, models.Evidence.DEPRECATED,
       models.Evidence.START_STATE),
      ("FILE", models.Assessment.DONE_STATE, models.Evidence.START_STATE,
       models.Evidence.DEPRECATED),
      ("FILE", models.Assessment.DONE_STATE, models.Evidence.DEPRECATED,
       models.Evidence.START_STATE),
      ("FILE", models.Assessment.FINAL_STATE, models.Evidence.START_STATE,
       models.Evidence.DEPRECATED),
      ("FILE", models.Assessment.FINAL_STATE, models.Evidence.DEPRECATED,
       models.Evidence.START_STATE),
  )
  @ddt.unpack
  def test_put_ignored_and_status_attr(
      self, kind, from_status, evidence_from_status, evidence_to_status
  ):
    """Test put ignored and status evidence data assessment status changed"""
    expected_status = models.Assessment.PROGRESS_STATE
    with factories.single_commit():
      assessment = factories.AssessmentFactory(status=from_status)
      assessment_id = assessment.id
      evidence = factories.EvidenceFactory(
          kind=kind, status=evidence_from_status
      )
      evidence_id = evidence.id
      factories.RelationshipFactory(destination=assessment,
                                    source=evidence)
    self.api.put(
        evidence,
        {
            'status': evidence_to_status,
            'notes': "test text",
        }
    )
    assessment = self.refresh_object(assessment, assessment_id)
    evidence = self.refresh_object(evidence, evidence_id)
    self.assertEqual(assessment.status, expected_status)
    self.assertEqual(evidence.status, evidence_to_status)

  @ddt.data(
      ("URL", "notes", models.Assessment.DONE_STATE),
      ("URL", "notes", models.Assessment.FINAL_STATE),
      ("URL", "description", models.Assessment.DONE_STATE),
      ("URL", "description", models.Assessment.FINAL_STATE),
      ("FILE", "notes", models.Assessment.DONE_STATE),
      ("FILE", "notes", models.Assessment.FINAL_STATE),
      ("FILE", "description", models.Assessment.DONE_STATE),
      ("FILE", "description", models.Assessment.FINAL_STATE),
  )
  @ddt.unpack
  def test_put_all_affected_evidence(self, kind, attr_name, status):
    """Test put all affected of evidence data assessment status changed"""
    expected_status = models.Assessment.PROGRESS_STATE
    with factories.single_commit():
      assessment = factories.AssessmentFactory(status=status)
      assessment_id = assessment.id
      evidence = factories.EvidenceFactory(kind=kind)
      evidence_id = evidence.id
      factories.RelationshipFactory(destination=assessment,
                                    source=evidence)
      person_id = factories.PersonFactory().id
      role_id = models.AccessControlRole.query.filter(
          models.AccessControlRole.object_type == "Evidence",
          models.AccessControlRole.name == 'Admin',
      ).one().id
    self.api.put(
        evidence,
        {
            attr_name: "test text",
            "access_control_list": [
                acl_helper.get_acl_json(role_id, person_id),
            ]
        }
    )
    assessment = self.refresh_object(assessment, assessment_id)
    evidence = self.refresh_object(evidence, evidence_id)
    self.assertEqual(assessment.status, expected_status)
    self.assertEqual(getattr(evidence, attr_name), "test text")


@ddt.ddt
class TestVerifiedCompleted(asc.TestMixinAutoStatusChangeableBase):
  """Test AutoStatusChangeable evidences Completed and Verified objects"""
  # pylint: disable=invalid-name

  def setUp(self):
    super(TestVerifiedCompleted, self).setUp()
    self.client.get("/login")
    with factories.single_commit():
      assessment = factories.AssessmentFactory(
          status=models.Assessment.FINAL_STATE
      )
      self.assessment_id = assessment.id
    self.api.put(assessment, {"status": "Completed", "verified": True})
    self.assessment = self.refresh_object(assessment, self.assessment_id)

  @ddt.data("URL", "FILE")
  def test_put_empty_evidence_data(self, kind):
    """Test put empty evidence data assessment status changed"""
    with factories.single_commit():
      evidence = factories.EvidenceFactory(kind=kind)
      factories.RelationshipFactory(destination=self.assessment,
                                    source=evidence)
    self.api.put(evidence, {})
    assessment = self.refresh_object(self.assessment, self.assessment_id)
    self.assertEqual(assessment.status, models.Assessment.FINAL_STATE)

  @ddt.data(
      ("URL", "notes"),
      ("URL", "description"),
      ("FILE", "notes"),
      ("FILE", "description"),
  )
  @ddt.unpack
  def test_put_ignored_evidence_attrs(self, kind, attr_name):
    """Test assessment status not changed after evidence attr {1} changed."""
    expected_status = models.Assessment.FINAL_STATE
    with factories.single_commit():
      evidence = factories.EvidenceFactory(kind=kind)
      factories.RelationshipFactory(destination=self.assessment,
                                    source=evidence)
    response = self.api.put(evidence, {attr_name: "test text"})
    self.assert200(response)
    assessment = self.refresh_object(self.assessment, self.assessment_id)
    self.assertEqual(assessment.status, expected_status)

  @ddt.data("URL", "FILE")
  def test_put_acl_evidence(self, kind):
    """Test put evidence acl asmt Verified status changed to In Progress"""
    expected_status = models.Assessment.PROGRESS_STATE
    with factories.single_commit():
      evidence = factories.EvidenceFactory(kind=kind)
      factories.RelationshipFactory(destination=self.assessment,
                                    source=evidence)
      person_id = factories.PersonFactory().id
      role_id = models.AccessControlRole.query.filter(
          models.AccessControlRole.object_type == "Evidence",
          models.AccessControlRole.name == 'Admin',
      ).one().id
    self.api.put(
        evidence,
        {
            "access_control_list": [
                acl_helper.get_acl_json(role_id, person_id),
            ]
        }
    )
    assessment = self.refresh_object(self.assessment, self.assessment_id)
    self.assertEqual(assessment.status, expected_status)

  @ddt.data("URL", "FILE")
  def test_put_acl_null_evidence(self, kind):
    """Test put acl null of evidence data assessment status changed"""
    expected_status = models.Assessment.PROGRESS_STATE
    with factories.single_commit():
      evidence = factories.EvidenceFactory(kind=kind)
      factories.RelationshipFactory(destination=self.assessment,
                                    source=evidence)
      person = factories.PersonFactory()
      role = models.AccessControlRole.query.filter(
          models.AccessControlRole.object_type == "Evidence",
          models.AccessControlRole.name == 'Admin',
      ).one()
      evidence.add_person_with_role(person, role)
    self.api.put(evidence, {"access_control_list": []})
    assessment = self.refresh_object(self.assessment, self.assessment_id)
    self.assertEqual(assessment.status, expected_status)

  @ddt.data(
      ("URL", models.Evidence.START_STATE, models.Evidence.DEPRECATED),
      ("URL", models.Evidence.DEPRECATED, models.Evidence.START_STATE),
      ("FILE", models.Evidence.START_STATE, models.Evidence.DEPRECATED),
      ("FILE", models.Evidence.DEPRECATED, models.Evidence.START_STATE),
  )
  @ddt.unpack
  def test_put_status_evidence(self, kind, evidence_from_status,
                               evidence_to_status):
    """Test put evidence status and assessment status changed"""
    expected_status = models.Assessment.PROGRESS_STATE
    with factories.single_commit():
      evidence = factories.EvidenceFactory(
          kind=kind,
          status=evidence_from_status
      )
      evidence_id = evidence.id
      factories.RelationshipFactory(destination=self.assessment,
                                    source=evidence)
    self.api.put(evidence, {'status': evidence_to_status})
    assessment = self.refresh_object(self.assessment, self.assessment_id)
    evidence = self.refresh_object(evidence, evidence_id)
    self.assertEqual(assessment.status, expected_status)
    self.assertEqual(evidence.status, evidence_to_status)

  @ddt.data(
      ("URL", models.Evidence.START_STATE, models.Evidence.DEPRECATED),
      ("URL", models.Evidence.DEPRECATED, models.Evidence.START_STATE),
      ("FILE", models.Evidence.START_STATE, models.Evidence.DEPRECATED),
      ("FILE", models.Evidence.DEPRECATED, models.Evidence.START_STATE),
  )
  @ddt.unpack
  def test_put_ignored_and_status_attr(self, kind, evidence_from_status,
                                       evidence_to_status):
    """Test put ignored and status evidence data assessment status changed"""
    expected_status = models.Assessment.PROGRESS_STATE
    with factories.single_commit():
      evidence = factories.EvidenceFactory(
          kind=kind,
          status=evidence_from_status
      )
      evidence_id = evidence.id
      factories.RelationshipFactory(destination=self.assessment,
                                    source=evidence)
    self.api.put(
        evidence,
        {
            'status': evidence_to_status,
            'notes': "test text",
        }
    )
    assessment = self.refresh_object(self.assessment, self.assessment_id)
    evidence = self.refresh_object(evidence, evidence_id)
    self.assertEqual(assessment.status, expected_status)
    self.assertEqual(evidence.status, evidence_to_status)

  @ddt.data(
      ("URL", "notes"),
      ("URL", "description"),
      ("FILE", "notes"),
      ("FILE", "description"),
  )
  @ddt.unpack
  def test_put_all_affected_evidence(self, kind, attr_name):
    """Test put all affected of evidence data assessment status changed"""
    expected_status = models.Assessment.PROGRESS_STATE
    with factories.single_commit():
      evidence = factories.EvidenceFactory(kind=kind)
      evidence_id = evidence.id
      factories.RelationshipFactory(destination=self.assessment,
                                    source=evidence)
      person_id = factories.PersonFactory().id
      role_id = models.AccessControlRole.query.filter(
          models.AccessControlRole.object_type == "Evidence",
          models.AccessControlRole.name == 'Admin',
      ).one().id
    self.api.put(
        evidence,
        {
            attr_name: "test text",
            "access_control_list": [
                acl_helper.get_acl_json(role_id, person_id),
            ]
        }
    )
    assessment = self.refresh_object(self.assessment, self.assessment_id)
    evidence = self.refresh_object(evidence, evidence_id)
    self.assertEqual(assessment.status, expected_status)
    self.assertEqual(getattr(evidence, attr_name), "test text")
