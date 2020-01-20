# Copyright (C) 2020 Google Inc.
# Licensed under http://www.apache.org/licenses/LICENSE-2.0 <see LICENSE file>

"""Fulltext event listeners"""

from collections import Iterable, defaultdict
import threading

import sqlalchemy as sa
from sqlalchemy import event

from ggrc import db
from ggrc import fulltext
from ggrc import utils
from ggrc.models import all_models, get_model
from ggrc.fulltext import mixin
from ggrc.models.background_task import reindex_on_commit
from ggrc.utils import benchmark, helpers

ACTIONS = ['after_insert', 'after_delete', 'after_update']


class ReindexSet(threading.local):
  """Special thread safety object.

   That will collect pool of objects that required to be reindexed."""

  CHUNK_SIZE = 50

  def __init__(self, *args, **kwargs):
    super(ReindexSet, self).__init__(*args, **kwargs)
    self._pool = set()
    self.model_ids_to_reindex = defaultdict(set)

  def add(self, item):
    self._pool.add(item)

  @helpers.without_sqlalchemy_cache
  def warmup(self):
    """Function on pre-commit that collects objects keychain."""
    while self._pool:
      for_index = self._pool.pop()
      if for_index not in db.session:
        continue
      type_name, id_value = for_index.get_reindex_pair()
      if not type_name:
        continue
      if id_value is None:
        db.session.flush()
        type_name, id_value = for_index.get_reindex_pair()
      self.model_ids_to_reindex[type_name].add(id_value)

  @helpers.without_sqlalchemy_cache
  def indexing_hook(self):
    """Function that collect changed models for after request hook
    or push new full text records in DB in case of background request."""
    with benchmark("pre commit indexing hook"):
      self.warmup()
      if self.model_ids_to_reindex:
        if reindex_on_commit():
          update_ft_records(self.model_ids_to_reindex, self.CHUNK_SIZE)
      # else: Indexing task will be created in after_request hook


@helpers.without_sqlalchemy_cache
def update_ft_records(model_ids_to_reindex, chunk_size):
  """Update fulltext records in DB"""
  with benchmark("indexing. expire objects in session"):
    for obj in db.session:
      if (isinstance(obj, mixin.Indexed) and
              ('id' not in obj.__dict__ or  # check if the object is expired
               obj.id in model_ids_to_reindex.get(obj.type, set()))):
        db.session.expire(obj)
  with benchmark("indexing. update ft records in db"):
    for model_name in model_ids_to_reindex.keys():
      ids = model_ids_to_reindex.pop(model_name)
      chunk_list = utils.list_chunks(list(ids), chunk_size=chunk_size)
      for ids_chunk in chunk_list:
        get_model(model_name).bulk_record_update_for(ids_chunk)


def _runner(mapper, content, target):  # pylint:disable=unused-argument
  """Collect all reindex models in session"""
  # with benchmark("collect reindex models in session"):
  ggrc_indexer = fulltext.get_indexer()
  db.session.reindex_set = getattr(db.session, "reindex_set", ReindexSet())
  getters = ggrc_indexer.indexer_rules.get(target.__class__.__name__) or []
  fields = ggrc_indexer.indexer_fields.get(target.__class__.__name__)
  for getter in getters:
    if fields and not fields_changed(target, fields):
      continue
    to_index_list = getter(target)
    if not isinstance(to_index_list, Iterable):
      to_index_list = [to_index_list]
    for to_index in to_index_list:
      db.session.reindex_set.add(to_index)
  if isinstance(target, mixin.Indexed):
    db.session.reindex_set.add(target)


def register_fulltext_listeners():
  """Indexing initialization procedure"""
  ggrc_indexer = fulltext.get_indexer()

  for model in all_models.all_models:
    if not issubclass(model, mixin.Indexed):
      continue
    for sub_model in model.mro():
      for rule in getattr(sub_model, "AUTO_REINDEX_RULES", []):
        ggrc_indexer.indexer_rules[rule.model].append(rule.rule)
        if rule.fields:
          ggrc_indexer.indexer_fields[rule.model].update(rule.fields)

  for model in all_models.all_models:
    if issubclass(model, mixin.Indexed) or \
            model.__name__ in ggrc_indexer.indexer_rules:
      for action in ACTIONS:
        event.listen(model, action, _runner)


def fields_changed(obj, fields):
  """Check if any of object fields were changed"""
  for field in fields:
    if getattr(sa.inspect(obj).attrs, field).history.has_changes():
      return True
  return False
