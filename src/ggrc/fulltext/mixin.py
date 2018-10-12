# Copyright (C) 2018 Google Inc.
# Licensed under http://www.apache.org/licenses/LICENSE-2.0 <see LICENSE file>
"""Module contains Indexed mixin class"""
import itertools
from collections import namedtuple

from sqlalchemy import orm

from ggrc import db

from ggrc import fulltext
from ggrc import utils


class ReindexRule(namedtuple("ReindexRule", ["model", "rule", "fields"])):
  """Class for keeping reindex rules"""
  __slots__ = ()

  def __new__(cls, model, rule, fields=None):
    return super(ReindexRule, cls).__new__(cls, model, rule, fields)


# pylint: disable=too-few-public-methods
class Indexed(object):
  """Mixin for Index And auto reindex current model instance.

  It should be last mixin in the scope if mixin that generate indexed query.
  """

  AUTO_REINDEX_RULES = [
      # Usage: ReindexRule("ModelName", lambda x: x.value)
  ]
  REQUIRED_GLOBAL_REINDEX = True

  PROPERTY_TEMPLATE = u"{}"

  def get_reindex_pair(self):
    return (self.__class__.__name__, self.id)

  @classmethod
  def insert_records(cls, ids):
    """Calculate and insert records into fulltext_record_properties table."""
    instances = cls.indexed_query().filter(cls.id.in_(ids))
    indexer = fulltext.get_indexer()
    rows = itertools.chain(*[indexer.records_generator(i) for i in instances])
    for vals_chunk in utils.iter_chunks(rows, chunk_size=10000):
      query = """
          INSERT INTO fulltext_record_properties (
            `key`, type, tags, property, subproperty, content
          ) VALUES (:key, :type, :tags, :property, :subproperty, :content)
      """
      values = list(vals_chunk)
      if not values:
        return
      db.session.execute(query, values)

  @classmethod
  def get_delete_query_for(cls, ids):
    """Return delete class record query. If ids are empty, will return None."""
    if not ids:
      return None
    indexer = fulltext.get_indexer()
    return indexer.record_type.__table__.delete().where(
        indexer.record_type.type == cls.__name__
    ).where(
        indexer.record_type.key.in_(ids),
    )

  @classmethod
  def delete_records(cls, ids):
    """Delete records from fulltext_record_properties table."""
    query = """
        DELETE FROM fulltext_record_properties
        WHERE fulltext_record_properties.type = :obj_type AND
              fulltext_record_properties.key IN :obj_ids
    """
    db.session.execute(query, {"obj_type": cls.__name__, "obj_ids": ids})

  @classmethod
  def bulk_record_update_for(cls, ids):
    """Bulky update index records for current class"""
    if not ids:
      return

    cls.delete_records(ids)
    cls.insert_records(ids)

  @classmethod
  def indexed_query(cls):
    return cls.query.options(orm.Load(cls).load_only("id"),)
