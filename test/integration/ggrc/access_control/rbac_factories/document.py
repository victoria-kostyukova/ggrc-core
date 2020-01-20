# Copyright (C) 2020 Google Inc.
# Licensed under http://www.apache.org/licenses/LICENSE-2.0 <see LICENSE file>

"""Document RBAC Factory."""

from ggrc.models import all_models
from integration.ggrc import Api, generator
from integration.ggrc.access_control.rbac_factories import base
from integration.ggrc.models import factories

FACTORIES_MAPPING = {
    "Control": factories.ControlFactory,
    "Standard": factories.StandardFactory,
    "Program": factories.ProgramFactory,
    "KeyReport": factories.KeyReportFactory,
    "AccountBalance": factories.AccountBalanceFactory,
}


class DocumentReferenceUrlRBACFactory(base.BaseRBACFactory):
  """Document Reference Url RBAC factory class."""
  # pylint: disable=too-many-instance-attributes

  def __init__(self, user_id, acr, parent=None):
    """Set up objects for Document permission tests.

    Args:
        user_id: Id of user under which all operations will be run.
        acr: Instance of ACR that should be assigned for tested user.
        parent: Model name in scope of which objects should be set up.
    """
    self.api = Api()
    self.objgen = generator.ObjectGenerator()
    self.objgen.api = self.api

    self.acr = acr
    self.user_id = user_id
    self.parent_name = parent
    self.document_id = None
    self.parent = None
    self.parent_id = None
    self.admin_acr_id = all_models.AccessControlRole.query.filter_by(
        name="Admin",
        object_type="Document",
    ).one().id

    self.setup_models(self.parent_name)
    self.set_user(user_id)

  def set_user(self, user_id):
    """Set user to send requests"""
    if self.user_id:
      user = all_models.Person.query.get(user_id)
      self.api.set_user(user)

  def setup_models(self, parent_name):
    """Setup document, parent, relationship"""
    with factories.single_commit():
      document = factories.DocumentReferenceUrlFactory()
      self.document_id = document.id
      self.parent = self.build_parent(parent_name)
      self.parent_id = self.parent.id
      factories.RelationshipFactory(source=self.parent, destination=document)
      self.assign_person(self.parent, self.acr, self.user_id)

  @staticmethod
  def build_parent(parent_name):
    """Create parent based on Name"""
    try:
      parent = FACTORIES_MAPPING[parent_name]()
    except KeyError():
      raise ValueError("Unknown parent {}".format(parent_name))
    return parent

  def create(self):
    """Create new Document object."""
    result = self.api.post(all_models.Document, {
        "document": {
            "access_control_list": [{
                "ac_role_id": self.admin_acr_id,
                "person": {
                    "id": self.user_id,
                    "type": "Person",
                }
            }],
            "link": factories.random_str(),
            "title": factories.random_str(),
            "context": None,
        }
    })
    return result

  def read(self):
    """Read existing Document object."""
    res = self.api.get(all_models.Document, self.document_id)
    return res

  def update(self):
    """Update title of existing Document object."""
    document = all_models.Document.query.get(self.document_id)
    return self.api.put(document, {"title": factories.random_str()})

  def delete(self):
    """Delete Document object."""
    document = all_models.Document.query.get(self.document_id)
    return self.api.delete(document)

  def map(self, document=None):
    """Map Document to parent object."""
    parent = self.parent.__class__.query.get(self.parent_id)
    map_document = document if document \
        else factories.DocumentReferenceUrlFactory()

    return self.objgen.generate_relationship(
        source=parent,
        destination=map_document
    )[0]

  def create_and_map(self):
    """Create new Document and map it to parent."""
    response = self.create()
    document_id = None
    if response.json and response.json.get("document"):
      document_id = response.json.get("document", {}).get("id")
    if not document_id:
      return response

    document = all_models.Document.query.get(document_id)
    return self.map(document)

  def add_comment(self):
    """Map new comment to document."""
    document = all_models.Document.query.get(self.document_id)
    _, comment = self.objgen.generate_object(all_models.Comment, {
        "description": factories.random_str(),
        "context": None,
    })
    return self.objgen.generate_relationship(source=document,
                                             destination=comment)[0]

  def read_comments(self):
    """Read comments mapped to document"""
    document = all_models.Document.query.get(self.document_id)
    with factories.single_commit():
      comment = factories.CommentFactory(description=factories.random_str())
      factories.RelationshipFactory(source=document, destination=comment)

    query_request_data = [{
        "fields": [],
        "filters": {
            "expression": {
                "object_name": "Document",
                "op": {
                    "name": "relevant"
                },
                "ids": [document.id]
            }
        },
        "object_name": "Comment",
    }]

    response = self.api.send_request(
        self.api.client.post,
        data=query_request_data,
        api_link="/query"
    )
    return response
