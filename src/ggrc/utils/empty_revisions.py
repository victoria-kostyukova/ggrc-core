# Copyright (C) 2020 Google Inc.
# Licensed under http://www.apache.org/licenses/LICENSE-2.0 <see LICENSE file>

"""Utility for processing revisions and finding empty."""

import logging
import operator as op

import sqlalchemy as sa

from ggrc import db
from ggrc import models
from ggrc.models import all_models
from ggrc.utils.revisions_diff import builder as revisions_diff
from ggrc.utils.revisions_diff import meta_info


logger = logging.getLogger(__name__)


CHUNK_SIZE = 200


def _query_new_res(res_type, res_id):
  """Return instance of specified type and id."""
  return models.get_model(res_type).query.get(res_id)


def _query_first_rev_content(res_type, res_id):
  """Return first revision's content for instance of specified type and id."""
  first_rev = all_models.Revision.query.filter(
      all_models.Revision.resource_type == res_type,
      all_models.Revision.resource_id == res_id,
      all_models.Revision.action == u"created",
  ).first()

  content = None
  if first_rev is not None:
    content = first_rev.content

  return content


def _resource_differ(resource, revision):
  """Check if resource differ from resource revision is created for."""
  return (resource is None or
          revision.resource_type != resource.__class__.__name__ or
          revision.resource_id != resource.id)


def _process_chunk(chunk, curr_res=None, curr_res_meta=None,
                   prev_rev_content=None):
  """Process chunk of revisions and find empty."""
  result = []
  for rev in chunk:
    if _resource_differ(curr_res, rev):
      curr_res = _query_new_res(rev.resource_type, rev.resource_id)
      if curr_res is None:
        continue
      prev_rev_content = _query_first_rev_content(
          rev.resource_type, rev.resource_id)
      if prev_rev_content is None:
        continue
      curr_res_meta = meta_info.MetaInfo(curr_res)

    curr_rev_content = rev.content
    changes_present = revisions_diff.changes_present(
        obj=curr_res,
        new_rev_content=curr_rev_content,
        prev_rev_content=prev_rev_content,
    )
    if not changes_present:
      result.append(rev)
    else:
      prev_rev_content = curr_rev_content

  state = dict(curr_res=curr_res, curr_res_meta=curr_res_meta,
               prev_rev_content=prev_rev_content)
  return result, state


def _process_chunks(chunks):
  """Process chunks of revisions and yield empty revisions ids."""
  state = dict(curr_res=None, curr_res_meta=None, prev_rev_content=None)
  for chunk in chunks:
    empty_revs, state = _process_chunk(chunk, **state)
    yield empty_revs


def _query_chunks(query, model, orderings, chunk_size):
  """Paginate query by chunks of specific size.

  The main difference here from util functions generating chunkyfied query
  provided in utils module is that here no offset is used. Chunks are queried
  here using filters which is faster comparing to offsets in case of large
  number of records in query.

  Args:
      query: Query to be paginated.
      model: Model used in `query`.
      orderings: Orderings used in `query`.
      chunk_size: Size of chunks.

  Yields:
      Objects in chunks from query query.
  """
  filters = [sa.true() for _ in orderings]
  count = query.count()
  for _ in range(0, count, chunk_size):
    # Pagination is performed by filtering here insted of using offset since
    # using offset with large values is much slower than plain filtering.
    paginated_q = query.from_self().filter(*filters).limit(chunk_size)
    chunk = paginated_q.all()
    yield chunk
    if chunk:
      # Filters should be recalculated here to return new chunk on next iter.
      # New filters should be in form "ordering field >= last in chunk" except
      # for the last field in orderings - this one should be > last in chunk.
      ge_filter_fields, gt_filter_field = orderings[:-1], orderings[-1]
      last_in_chunk = chunk[-1]

      filters = [
          op.ge(getattr(model, field), getattr(last_in_chunk, field))
          for field in ge_filter_fields
      ]
      filters.append(
          op.gt(
              getattr(model, gt_filter_field),
              getattr(last_in_chunk, gt_filter_field),
          )
      )


def find_empty_revisions():
  """Find empty revisions and insert them into empty_revisions tbl."""
  rev_q = all_models.Revision.query.filter(
      all_models.Revision.action == u"modified",
  ).order_by(
      # Such ordering is applied here to group revisions by objects and sort
      # them in creation order.
      all_models.Revision.resource_type,
      all_models.Revision.resource_id,
      all_models.Revision.id,
  )
  rev_count = rev_q.count()
  chunked_q = _query_chunks(
      query=rev_q,
      model=all_models.Revision,
      orderings=["resource_type", "resource_id", "id"],
      chunk_size=CHUNK_SIZE,
  )

  logger.info("Searching for empty revisions...")
  for i, revisions in enumerate(_process_chunks(chunked_q)):
    for revision in revisions:
      revision.is_empty = True
    logger.info("%s of %s revisions are processed",
                (i + 1) * CHUNK_SIZE, rev_count)
    db.session.flush()
  db.session.commit()
