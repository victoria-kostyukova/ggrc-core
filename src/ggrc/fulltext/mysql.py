# Copyright (C) 2020 Google Inc.
# Licensed under http://www.apache.org/licenses/LICENSE-2.0 <see LICENSE file>
"""Full text index engine for Mysql DB backend"""

import logging

import sqlalchemy as sa
from sqlalchemy.ext.declarative import declared_attr
from sqlalchemy.orm import aliased
from sqlalchemy.sql.expression import select
from sqlalchemy import event

from ggrc import db
from ggrc.fulltext.sql import SqlIndexer
from ggrc.fulltext.mixin import Indexed
from ggrc.models import all_models, get_model
from ggrc.query import my_objects
from ggrc.rbac import permissions


logger = logging.getLogger(__name__)


ATTRIBUTE_ALIASES_TO_SEARCH_IN = (
    'title',
    'name',
    'email',
    'notes',
    'description',
    'slug'
)


# pylint: disable=too-few-public-methods
class MysqlRecordProperty(db.Model):
  """ Db model for collect fulltext index records"""
  __tablename__ = 'fulltext_record_properties'

  key = db.Column(db.Integer, primary_key=True)
  type = db.Column(db.String(64), primary_key=True)
  tags = db.Column(db.String)
  property = db.Column(db.String(250), primary_key=True)
  subproperty = db.Column(db.String(64), primary_key=True)
  content = db.Column(db.Text, nullable=False, default=u"")

  @declared_attr
  def __table_args__(cls):  # pylint: disable=no-self-argument
    return (
        db.Index('ix_{}_type_property'.format(cls.__tablename__),
                 'type', 'property'),
        db.Index('ix_{}_tags'.format(cls.__tablename__), 'tags'),
        db.Index('ix_{}_key'.format(cls.__tablename__), 'key'),
        db.Index('ix_{}_type'.format(cls.__tablename__), 'type'),
    )


class MysqlIndexer(SqlIndexer):
  """MysqlIndexer class"""
  record_type = MysqlRecordProperty

  @staticmethod
  def _get_attr_names_to_search_in(model):
    """Get list of indexed attribute names"""

    attrs = model.get_fulltext_attrs()

    aliases = dict((attr.alias, attr) for attr in attrs)

    ret = []
    # Get list of attribute names by alias name
    for name in ATTRIBUTE_ALIASES_TO_SEARCH_IN:
      if name in aliases:
        ret.append(model.get_fulltext_attr_name(aliases[name]))

    return ret

  @classmethod
  def get_filter_query(cls, terms, model=None):
    """Get the whitelist of fields to filter in full text table."""

    if not model or not issubclass(model, Indexed):
      # Only indexed models are supported
      return sa.false()

    attr_names = cls._get_attr_names_to_search_in(model)
    whitelist = MysqlRecordProperty.property.in_(attr_names)

    if not terms:
      return whitelist
    return sa.and_(whitelist, MysqlRecordProperty.content.contains(terms))

  @staticmethod
  def get_permissions_query(model_names, permission_type='read'):
    """Prepare the query based on the allowed resources

    This filters for each of the required models based on permissions on every
    object type.
    """
    if not model_names:
      # If there are no model names set, the result of the permissions query
      # will always be false, so we can just return false instead of having an
      # empty in statement combined with an empty list joined by or statement.
      return sa.false()

    type_queries = []
    for model_name in model_names:
      contexts, resources = permissions.get_context_resource(
          model_name=model_name,
          permission_type=permission_type,
      )

      if contexts is None:
        # None context means user has full access of permission_type for the
        # given model
        type_queries.append(MysqlRecordProperty.type == model_name)
      elif resources:
        type_queries.append(sa.and_(
            MysqlRecordProperty.type == model_name,
            MysqlRecordProperty.key.in_(resources),
        ))

    if not type_queries:
      return sa.false()

    return sa.or_(*type_queries)

  @staticmethod
  def search_get_owner_query(query, types=None, contact_id=None):
    """Prepare the search query based on the contact_id to return my
    objects. This method is used only for dashboard and returns objects
    the user is the owner.
    """
    if not contact_id:
      return query

    union_query = my_objects.get_myobjects_query(
        types=types,
        contact_id=contact_id)

    return query.join(
        union_query,
        sa.and_(
            union_query.c.id == MysqlRecordProperty.key,
            union_query.c.type == MysqlRecordProperty.type),
    )

  def _add_extra_params_query(self, query, type_name, extra_param):
    """Prepare the query for handling extra params."""
    if not extra_param:
      return query

    model = get_model(type_name)

    if model is None:
      return query

    return query.filter(self.record_type.key.in_(
        db.session.query(
            model.id.label('id')
        ).filter_by(**extra_param)
    ))

  def _get_search_query(self, model, permission_type, owner_id,
                        terms, extra_filter):
    """Get SELECT for a single model based on filter parameters"""
    model_name = model.__name__

    columns = (
        self.record_type.key.label('key'),
        self.record_type.type.label('type'),
        self.record_type.content.label('content'),
        sa.case(
            [(self.record_type.property == 'title', sa.literal(0))],
            else_=sa.literal(1)).label('sort_key')
    )

    query = db.session.query(*columns)
    query = query.filter(self.get_filter_query(terms, model))
    query = self.search_get_owner_query(query, [model_name], owner_id)
    query = query.filter(self.get_permissions_query(
        [model_name], permission_type))

    if extra_filter:
      query = self._add_extra_params_query(query, model_name, extra_filter)

    return query

  def _get_count_query(self, model, owner_id,
                       terms, column_name, extra_filter=None):
    """Get SELECT for a single model based on filter parameters"""
    model_name = model.__name__

    columns = (
        self.record_type.type.label("type"),
        sa.func.count(sa.distinct(self.record_type.key)).label("count"),
        sa.literal(column_name)
    )

    query = db.session.query(*columns)
    query = query.filter(self.get_filter_query(terms, model))
    query = self.search_get_owner_query(query, [model_name], owner_id)
    query = query.filter(self.get_permissions_query([model_name]))

    if extra_filter is not None:
      query = self._add_extra_params_query(query, model_name, extra_filter)

    query = query.group_by(self.record_type.type)

    return query

  @staticmethod
  def _merge_extra_params(types,  # type: List[str]
                          extra_params,  # type: Dict[str, Dict[str, str]]
                          extra_columns  # type: Dict[str, str]
                          ):
    # type: (...) -> Dict[str, Dict[str, Dict[str, str]]]
    """Merge models without extra filter and models with extra filter

    Convert model names into model classes (if exist).
    Then, make dict (model -> dict(column_name -> extra_filter_or_empty_dict)

    Example of args/result:
    >>> _merge_extra_params(\
            types =  ["Standard", "Requirement", "contract", "notype1"],\
            extra_params = {\
                "A1": {"title": "abc"},\
                "A2": {"field": "value"},\
                "CONTRACT": {"somefield": "somevalue"},\
                "notype2": {"field1": "field2"}\
            },\
            extra_columns = {\
                "A1": "Standard",\
                "A2": "Requirement"\
            }\
        )
      {
          Standard: {
              "A1": {"title": "abc"},
              "A2": {"field": "value"}
          },
          Requirement: {
              "Requirement": {}
          },
          Contract: {
              "Contract": {"somefield": "somevalue"}
          }
      }


    Args:
      types: list of model names to be searched in
      extra_params: dict(model_name -> extra_filter)
      extra_columns: dict(column_name -> model_name)

    Return:
      dict (model -> dict(column_name -> extra_filter_or_none))
    """

    # convert type names and column names into model classes (if model exist)

    for column_name, type_ in extra_columns.iteritems():
      # column name can be specified without extra filter in extra_params
      if column_name not in extra_params:
        extra_params[column_name] = dict()

    extra_params_with_models = dict()  # dict(model -> dict(column) -> filter)
    for type_, extra_filter in extra_params.iteritems():
      column_name = None
      if type_ in extra_columns:
        column_name = type_
        # convert column name into type name
        type_ = extra_columns[type_]

      model = get_model(type_)

      if model is not None:
        if column_name is None:
          # set column name to model name if type name was
          # specified in extra_params
          column_name = model.__name__

        extra_params_with_models.setdefault(
            model, dict())[column_name] = extra_filter

    models_in_types = set(get_model(i) for i in types)
    models_in_types.discard(None)
    models_in_extra_params = set(extra_params_with_models.keys())

    # get models which are in types but not in extra_params
    models_no_extra = models_in_types - models_in_extra_params
    # get models which are in types and extra_params
    models_only_extra = models_in_types & models_in_extra_params

    # now get final dict:
    # models in models_no_extra do not have extra filter
    ret = dict((model, {model.__name__: dict()})
               for model in models_no_extra)
    # models in models_only_extra has extra filter
    # this expression also removes models which are in
    # extra_params/extra_columns but not in types
    ret.update((model, extra_filter)
               for model, extra_filter in extra_params_with_models.iteritems()
               if model in models_only_extra)

    return ret

  def search(self,
             terms,  # type: str
             types=None,  # type: List[str]
             permission_type='read',  # type: str
             contact_id=None,  # type: int
             extra_params=None  # Dict[str, Dict[str, str]]
             ):
    # type: (...) -> List[Tuple[int, str]]
    """Prepare the search query and return the results set based on the
    full text table.

    Example of request/response:

      Request:
        type = ["Requirement", "Standard"]
        terms = "qq"
        permission_type = "read"
        contact_id = 10
        extra_params = {"Standard": {"title": "aa"}}
      Expected response:
        1) requirements which are readable by current user and
           are owned by user with id=10 and
           contain "qq" in indexed fields
        2) standards which are readable by current user and
           contain "qq" in indexed fields and
           are owned by user with id=10 and
           where title="aa"

    Args:
      terms: string to search in fulltext attributes
      types: optional list of model names to search in
      permission_type: permission type
      contact_id: id of objects owner or None to omit this filter
      extra_params: dict(model_name -> dict(field_of_model -> value_to_filter))
    Return:
      iterable object of search results ResultProxy or empty list
    """

    types = types or list()
    extra_params = extra_params or dict()

    queries = []

    models_and_extra_filters = self._merge_extra_params(
        types, extra_params, dict())
    for model, columns_and_filters in models_and_extra_filters.iteritems():
      for _, extra_filter in columns_and_filters.iteritems():
        # Get SELECT query for single model with optional extra filter
        query = self._get_search_query(model=model,
                                       permission_type=permission_type,
                                       owner_id=contact_id,
                                       terms=terms,
                                       extra_filter=extra_filter)
        queries.append(query)

    if not queries:
      return list()

    query = sa.union(*queries)
    query = aliased(query.order_by(query.c.sort_key, query.c.content))

    final_query = select([query.c.key, query.c.type]).distinct()

    return db.session.execute(final_query)

  # pylint: disable=too-many-arguments
  def counts(self,
             terms,  # type: str
             types=None,  # type: List[str]
             contact_id=None,  # type: int
             extra_params=None,  # Dict[str, Dict[str, str]]
             extra_columns=None):
    # type: (...) -> List[Tuple[str, int, str]]
    """Prepare the search query and return the results set based on the
    full text table

    Example of request/response:

      Request:
        type = ["Requirement", "Standard"]
        terms = "qq"
        contact_id = 10
        extra_params = {"AA": {"title": "aa"}}
        extra_columns = {"AA": "Standard"}
      Expected response:
        ["Requirement": <count>, "Requirement",
         "Standard", <count>, "AA"
        ]

        Filter for "Requirement":
          requirements which are readable by current user and
          are owned by user with id=10 and
          contain "qq" in indexed fields
        Filter for "AA":
          standards which are readable by current user and
          contain "qq" in indexed fields and
          are owned by user with id=10 and
          where title="aa"

    Args:
      terms: string to search in fulltext attributes
      types: optional list of model names to search in
      contact_id: id of objects owner or None to omit this filter
      extra_params: dict(model_or_column_name -> dict(field_of_model ->
                                                      value_to_filter))
      extra_columns: dict(column_name -> model_name)

    Return:
      iterable object of search results ResultProxy or empty list
      Each items is Tuple[model_name, count, column_name]
    """

    types = types or list()
    extra_params = extra_params or dict()
    extra_columns = extra_columns or dict()

    # "types" can contain column name instead of type name.
    # Convert it to type name
    types = list(extra_columns.get(t, t) for t in types)

    queries = []

    models_and_extra_filters = self._merge_extra_params(
        types, extra_params, extra_columns)
    for model, columns_and_filters in models_and_extra_filters.iteritems():
      for column_name, extra_filter in columns_and_filters.iteritems():
        query = self._get_count_query(model, contact_id, terms, column_name,
                                      extra_filter)
        queries.append(query)

    if not queries:
      return list()

    query = sa.union(*queries)

    return db.session.execute(query)


Indexer = MysqlIndexer


# pylint:disable=unused-argument
@event.listens_for(all_models.Relationship, "after_insert")
@event.listens_for(all_models.Relationship, "after_delete")
def refresh_documents(mapper, connection, target):
  """Refreshes related Documents"""
  if target.source_type == 'Document':
    for_refresh = target.destination
  elif target.destination_type == 'Document':
    for_refresh = target.source
  else:
    return
  if hasattr(for_refresh, 'documents'):
    db.session.expire(for_refresh, ['documents'])


# pylint:disable=unused-argument
@event.listens_for(all_models.Relationship, "after_insert")
@event.listens_for(all_models.Relationship, "after_delete")
def refresh_evidences(mapper, connection, target):
  """Refreshes related Evidences"""
  if target.source_type == 'Evidence':
    for_refresh = target.destination
  elif target.destination_type == 'Evidence':
    for_refresh = target.source
  else:
    return
  if hasattr(for_refresh, 'evidences'):
    db.session.expire(for_refresh, ['evidences'])
