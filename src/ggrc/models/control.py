# Copyright (C) 2019 Google Inc.
# Licensed under http://www.apache.org/licenses/LICENSE-2.0 <see LICENSE file>

"""Module for Control model."""

from sqlalchemy import orm

from ggrc import db
from ggrc.models.comment import Commentable
from ggrc.models.mixins.with_similarity_score import WithSimilarityScore
from ggrc.models.object_document import PublicDocumentable
from ggrc.models.mixins import base, categorizable
from ggrc.models.mixins import synchronizable
from ggrc.models import mixins, review
from ggrc.models.mixins.with_last_assessment_date import WithLastAssessmentDate
from ggrc.models.deferred import deferred
from ggrc.models.object_person import Personable
from ggrc.models.relationship import Relatable
from ggrc.fulltext.mixin import Indexed
from ggrc.fulltext import attributes
from ggrc.models import reflection
from ggrc.models import proposal


class Control(synchronizable.Synchronizable,
              categorizable.Categorizable,
              WithLastAssessmentDate,
              review.Reviewable,
              synchronizable.RoleableSynchronizable,
              Relatable,
              mixins.CustomAttributable,
              Personable,
              PublicDocumentable,
              mixins.LastDeprecatedTimeboxed,
              mixins.TestPlanned,
              Commentable,
              WithSimilarityScore,
              base.ContextRBAC,
              mixins.BusinessObject,
              Indexed,
              mixins.Folderable,
              proposal.Proposalable,
              db.Model):
  """Control model definition."""
  __tablename__ = 'controls'

  company_control = deferred(db.Column(db.Boolean), 'Control')
  directive_id = deferred(
      db.Column(db.Integer, db.ForeignKey('directives.id')), 'Control')
  version = deferred(db.Column(db.String), 'Control')
  fraud_related = deferred(db.Column(db.Boolean), 'Control')
  key_control = deferred(db.Column(db.Boolean), 'Control')
  active = deferred(db.Column(db.Boolean), 'Control')
  kind = deferred(db.Column(db.String), "Control")
  means = deferred(db.Column(db.String), "Control")
  verify_frequency = deferred(db.Column(db.String), "Control")

  # REST properties
  _api_attrs = reflection.ApiAttributes(
      'active',
      'company_control',
      'directive',
      'fraud_related',
      'key_control',
      'kind',
      'means',
      'verify_frequency',
      'version',
  )

  _fulltext_attrs = [
      'active',
      'company_control',
      'directive',
      attributes.BooleanFullTextAttr(
          'fraud_related',
          'fraud_related',
          true_value="yes", false_value="no"),
      attributes.BooleanFullTextAttr(
          'key_control',
          'key_control',
          true_value="key", false_value="non-key"),
      'kind',
      'means',
      'verify_frequency',
      'version',
  ]

  _sanitize_html = [
      'version',
  ]

  VALID_RECIPIENTS = frozenset([
      "Assignees",
      "Creators",
      "Verifiers",
      "Admin",
      "Control Operators",
      "Control Owners",
      "Other Contacts",
  ])

  @classmethod
  def indexed_query(cls):
    return super(Control, cls).indexed_query().options(
        orm.Load(cls).undefer_group(
            "Control_complete"
        ),
        orm.Load(cls).joinedload(
            "directive"
        ).undefer_group(
            "Directive_complete"
        ),
    )

  _include_links = []

  _aliases = {
      "kind": "Kind/Nature",
      "means": "Type/Means",
      "verify_frequency": "Frequency",
      "fraud_related": "Fraud Related",
      "key_control": {
          "display_name": "Significance",
          "description": "Allowed values are:\nkey\nnon-key\n---",
      },
      "test_plan": "Assessment Procedure",
  }

  @classmethod
  def eager_query(cls):
    query = super(Control, cls).eager_query()
    return cls.eager_inclusions(query, Control._include_links).options(
        orm.joinedload('directive'),
    )

  def log_json(self):
    out_json = super(Control, self).log_json()
    # so that event log can refer to deleted directive
    if self.directive:
      out_json["mapped_directive"] = self.directive.display_name
    return out_json
