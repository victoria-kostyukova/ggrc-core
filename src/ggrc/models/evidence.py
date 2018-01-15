# Copyright (C) 2017 Google Inc.
# Licensed under http://www.apache.org/licenses/LICENSE-2.0 <see LICENSE file>

"""Module containing Evidence model."""

from sqlalchemy import orm
from sqlalchemy import func, case
from sqlalchemy.ext.hybrid import hybrid_property

from ggrc import db
from ggrc.access_control.roleable import Roleable
from ggrc.fulltext.mixin import Indexed
from ggrc.models.deferred import deferred
from ggrc.models.mixins import Base
from ggrc.models.relationship import Relatable
from ggrc.models import exceptions
from ggrc.models import reflection
from ggrc.models import mixins


class Evidence(Roleable, Relatable, mixins.Titled, Base, Indexed, db.Model):
  """Evidence (Audit-scope URLs and Attachments) model."""
  __tablename__ = "evidences"

  _title_uniqueness = False

  link = deferred(db.Column(db.String, nullable=False), "Evidence")
  gdrive_file_id = deferred(db.Column(db.String), "Evidence")
  description = deferred(db.Column(db.Text, nullable=False, default=u""),
                         "Evidence")

  GDRIVE_FILE_URL_TEMPLATE = ("https://drive.google.com/"
                              "a/google.com/file/d/{}/view?usp=drivesdk")

  URL = "URL"
  ATTACHMENT = "EVIDENCE"
  REFERENCE_URL = "REFERENCE_URL"
  VALID_DOCUMENT_TYPES = [URL, ATTACHMENT, REFERENCE_URL]
  document_type = deferred(db.Column(db.Enum(*VALID_DOCUMENT_TYPES),
                                     default=URL,
                                     nullable=False),
                           "Evidence")

  _fulltext_attrs = [
      "title",
      "link",
      "description",
      "document_type",
  ]

  _api_attrs = reflection.ApiAttributes(
      "title",
      reflection.Attribute("link", update=False),
      reflection.Attribute("gdrive_file_id", update=False),
      "description",
      reflection.Attribute("document_type", update=False),
  )

  _sanitize_html = [
      "title",
      "description",
  ]

  _aliases = {
      "title": "Title",
      "link": "Link",
      "description": "description",
  }

  @orm.validates('document_type')
  def validate_document_type(self, key, document_type):
    """Returns correct option, otherwise rises an error"""
    if document_type is None:
      document_type = self.URL
    if document_type not in self.VALID_DOCUMENT_TYPES:
      raise exceptions.ValidationError(
          "Invalid value for attribute {attr}. "
          "Expected options are `{url}`, `{attachment}`, `{reference_url}`".
          format(
              attr=key,
              url=self.URL,
              attachment=self.ATTACHMENT,
              reference_url=self.REFERENCE_URL
          )
      )
    return document_type

  @orm.validates("gdrive_file_id")
  def set_link_by_gdrive_file_id(self, _, value):
    """Set self.link by filling file id into an URL template."""
    # TODO: self.link = gdrive_file.alternate_link (should be fetched
    # through REST instead of hardcoding a format here, and not in a
    # validator)
    self.link = self.GDRIVE_FILE_URL_TEMPLATE.format(value)
    return value

  @classmethod
  def indexed_query(cls):
    return super(Evidence, cls).indexed_query().options(
        orm.Load(cls).undefer_group(
            "Evidence_complete",
        ),
    )

  @hybrid_property
  def slug(self):
    """Emulate slug to use it in import/export."""
    if self.document_type in (self.URL, self.REFERENCE_URL):
      return self.link
    return u"{} {}".format(self.link, self.title)

  # pylint: disable=no-self-argument
  @slug.expression
  def slug(cls):
    return case([(cls.document_type == cls.ATTACHMENT,
                 func.concat(cls.link, ' ', cls.title))],
                else_=cls.link)

  def log_json(self):
    tmp = super(Evidence, self).log_json()
    tmp['type'] = "Evidence"
    return tmp
