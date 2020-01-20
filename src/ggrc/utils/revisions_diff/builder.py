# Copyright (C) 2020 Google Inc.
# Licensed under http://www.apache.org/licenses/LICENSE-2.0 <see LICENSE file>

"""Builder the prepare diff in special format between current
instance state and proposed content."""

import collections
import json

from flask import g

from ggrc import utils
from ggrc.utils.revisions_diff import meta_info


def get_latest_revision_content(instance):
  """Returns latest revision for instance."""
  from ggrc.models import all_models
  if not hasattr(g, "latest_revision_content"):
    g.latest_revision_content = {}
  key = (instance.type, instance.id)
  content = g.latest_revision_content.get(key)
  if not content:
    last_rev = all_models.Revision.query.filter(
        all_models.Revision.resource_id == instance.id,
        all_models.Revision.resource_type == instance.type
    ).order_by(
        all_models.Revision.created_at.desc(),
        all_models.Revision.id.desc(),
    ).first()
    content = last_rev.content if last_rev is not None else None
    g.latest_revision_content[key] = content
  return content


def mark_for_latest_content(type_, id_):
  """Mark type to get lates contnent when it will be needed."""
  if not hasattr(g, "latest_revision_content_markers"):
    g.latest_revision_content_markers = collections.defaultdict(set)
  g.latest_revision_content_markers[type_].add(id_)


def rewarm_latest_content():
  """Rewarm cache for latest content for marked objects."""
  from ggrc.models import all_models
  if not hasattr(g, "latest_revision_content_markers"):
    return
  if not hasattr(g, "latest_revision_content"):
    g.latest_revision_content = {}
  cache = g.latest_revision_content_markers
  del g.latest_revision_content_markers
  if not cache:
    return
  query = all_models.Revision.query.filter(
      all_models.Revision.resource_type == cache.keys()[0],
      all_models.Revision.resource_id.in_(cache[cache.keys()[0]])
  )
  for type_, ids in cache.items()[1:]:
    query = query.union_all(
        all_models.Revision.query.filter(
            all_models.Revision.resource_type == type_,
            all_models.Revision.resource_id.in_(ids)
        ))
  query = query.order_by(
      all_models.Revision.resource_id,
      all_models.Revision.resource_type,
      all_models.Revision.created_at.desc(),
      all_models.Revision.id.desc(),
  )
  key = None
  for revision in query:
    if key == (revision.resource_type, revision.resource_id):
      continue
    key = (revision.resource_type, revision.resource_id)
    g.latest_revision_content[key] = revision.content


def get_person_email(person_id):
  """Returns person email for sent person id."""
  if not hasattr(g, "person_email_cache"):
    from ggrc.models import all_models
    query = all_models.Person.query.values(all_models.Person.id,
                                           all_models.Person.email)
    g.person_email_cache = dict(query)
  return g.person_email_cache[person_id]


def person_obj_by_id(person_id):
  """Generates person dict for sent person id."""
  return {"id": person_id, "email": get_person_email(person_id)}


def generate_person_list(person_ids):
  """Generates list of person dicts for sent person ids."""
  person_ids = sorted([int(p) for p in person_ids])
  return [person_obj_by_id(i) for i in person_ids]


def generate_acl_diff(acrs, proposed, revisioned):
  """Generates acl diff between peoposed and revised.

  Returns dict of dict.
     {
        ACR_ID: {
            u"added": [{
                "id": person_id,
                "email": person_email,
            },
            ...
            ],
            u"deleted": [{
                "id": person_id,
                "email": person_email,
            },
            ...
            ],
        },
        ...
     }
  """
  if not acrs or proposed is None:
    return {}
  proposed_acl = collections.defaultdict(set)
  revision_acl = collections.defaultdict(set)
  acl_ids = set()
  for acl in proposed:
    role_id = int(acl["ac_role_id"])
    proposed_acl[role_id].add(acl["person"]["id"])
    acl_ids.add(role_id)
  for acl in revisioned:
    role_id = int(acl["ac_role_id"])
    revision_acl[role_id].add(acl["person"]["id"])
    acl_ids.add(role_id)
  acl_dict = {}
  for role_id in acl_ids & {a.id for a in acrs}:
    deleted_person_ids = revision_acl[role_id] - proposed_acl[role_id]
    added_person_ids = proposed_acl[role_id] - revision_acl[role_id]
    if added_person_ids or deleted_person_ids:
      acl_dict[role_id] = {
          u"added": generate_person_list(added_person_ids),
          u"deleted": generate_person_list(deleted_person_ids),
      }
  return acl_dict


def get_validated_value(cad, value, object_id):
  """Get valid value that related to specified cad."""
  if isinstance(value, basestring):
    value = value.strip()
    return value, object_id
  if cad.attribute_type == cad.ValidTypes.CHECKBOX:
    value = int(value) if value is not None else None
  if value is not None:
    value = unicode(value)
  return value, object_id


def prepare_cavs_for_diff(cavs):
  """Build dict with cavs content suitable for comparizon"""
  cavs_dict = {}
  for cav in cavs:
    attribute_value = cav.get("attribute_value")
    attribute_object_id = (cav.get("attribute_object") or {}).get("id")
    cavs_dict[int(cav["custom_attribute_id"])] = (
        attribute_value,
        attribute_object_id
    )
  return cavs_dict


def generate_cav_diff(cads, proposed, revisioned):
  """Build diff for custom attributes."""
  if not cads:
    return {}
  if proposed is None:
    return {}
  diff = {}
  proposed_cavs = prepare_cavs_for_diff(proposed)
  revisioned_cavs = prepare_cavs_for_diff(revisioned)

  for cad in cads:
    if cad.id not in proposed_cavs:
      continue
    proposed_val = get_validated_value(cad, *proposed_cavs[cad.id])
    if cad.id not in revisioned_cavs:
      revisioned_value = (cad.default_value, None)
    else:
      revisioned_value = revisioned_cavs[cad.id]
    if proposed_val != revisioned_value:
      value, person_id = proposed_val
      if person_id and not person_id == "None":
        person = person_obj_by_id(int(person_id))
      else:
        person = None
      diff[cad.id] = {
          "attribute_value": value,
          "attribute_object": person,
      }
  return diff


def __mappting_key_function(object_dict):
  return object_dict["id"]


def generate_list_mappings(fields, diff_data, current_data):
  """Generates list mappings."""
  result = {}
  for field in fields:
    key = field.name
    if key not in diff_data:
      continue
    current = current_data.get(key) or []
    current_key_dict = {int(i["id"]): i for i in current}
    diff = diff_data.pop(key, None) or []
    diff_key_set = {int(i["id"]) for i in diff}
    current_diff_set = set(current_key_dict)
    deleted_ids = current_diff_set - diff_key_set
    added_ids = diff_key_set - current_diff_set
    if deleted_ids or added_ids:
      result[key] = {
          u"added": sorted(
              [i for i in diff if int(i["id"]) in added_ids],
              key=__mappting_key_function
          ),
          u"deleted": sorted(
              [i for i in current if int(i["id"]) in deleted_ids],
              key=__mappting_key_function
          ),
      }
  return result


def generate_single_mappings(fields, diff_data, current_data):
  """Generates single mappings."""
  result = {}
  for field in fields:
    key = field.name
    if key not in diff_data:
      continue
    current = current_data.get(key, None) or {"id": None, "type": None}
    diff = diff_data.pop(key, None) or {"id": None, "type": None}
    if current == diff:
      continue
    if diff["id"] is None:
      result[key] = None
    elif current["id"] is None or diff["id"] != current["id"]:
      result[key] = diff
  return result


def generate_fields(fields, proposed_content, current_data):
  """Returns the diff on fields for sent instance and proposaed data."""
  diff = {}
  for field in fields:
    field_name = field.name
    if field_name not in proposed_content:
      continue
    proposed_val = proposed_content[field_name]
    current_val = current_data.get(field_name)
    if proposed_val != current_val:
      if field_name == u'recipients' and not _recipients_changed(proposed_val,
                                                                 current_val):
        continue
      diff[field_name] = proposed_val
  return diff


def _recipients_changed(proposed_val, current_val):
  """Check if the recipients attribute has been semantically modified.

  The recipients attribute is a comma-separated string, and the exact order of
  the items in it does not matter, i.e. it is not considered a change.

  Args:
    proposed_val (str): recipients' proposed value
    current_val (str): recipients' current value

  Returns:
    True if there was a (semantic) change, False otherwise
  """
  if current_val is None:
    current_val = ""

  if proposed_val is None:
    proposed_val = ""

  return sorted(current_val.split(",")) != sorted(proposed_val.split(","))


def _construct_diff(meta, current_content, new_content):
  return {
      "fields": generate_fields(
          meta.fields,
          new_content,
          current_content,
      ),
      "access_control_list": generate_acl_diff(
          meta.acrs,
          new_content.get("access_control_list", []),
          current_content.get("access_control_list", []),
      ),
      "custom_attribute_values": generate_cav_diff(
          meta.cads,
          new_content.get("custom_attribute_values", []),
          current_content.get("custom_attribute_values", []),
      ),
      "mapping_fields": generate_single_mappings(
          meta.mapping_fields,
          new_content,
          current_content,
      ),
      "mapping_list_fields": generate_list_mappings(
          meta.mapping_list_fields,
          new_content,
          current_content,
      ),
  }


def prepare(instance, content):
  """Prepare content diff for instance and sent content."""
  instance_meta_info = meta_info.MetaInfo(instance)
  current_data = get_latest_revision_content(instance)
  return _construct_diff(
      meta=instance_meta_info,
      current_content=current_data,
      new_content=content,
  )


def is_identical_acr(instance, value_1, value_2):
  """Checks acls for identity"""
  meta = meta_info.MetaInfo(instance)
  result = generate_acl_diff(meta.acrs, value_1, value_2)
  return len(result) == 0


def is_identical_revision(instance, context_1, context_2):
  """Checks revisions contexts for identity."""
  attr_to_exclude = 'updated_at'
  attr_need_prepare = 'access_control_list'
  context_1, context_2 = (context_1, context_2) if \
      len(context_1.keys()) > len(context_2.keys()) else \
      (context_2, context_1)

  for key, value in context_1.items():
    if key == attr_to_exclude:
      continue

    if key not in context_2 and value:
      return False
    elif key == attr_need_prepare:
      is_identical = is_identical_acr(instance, value, context_2.get(key, []))
      if not is_identical:
        return False
    elif key in context_2 and context_2[key] != value:
      return False
  return True


def prepare_content_full_diff(instance_meta_info, l_content, r_content):
  """Prepare diff between two revisions contents of same instance.

  This functionality is needed for `not_empty_revisions` query API operator.
  The main difference between this function and `prepare` is that this one
  takes into account all revision's content fields and not just fields
  explicitly marked as updateable on instance model.

  Args:
      instance_meta_info (MetaInfo): object of particular instance.
      l_content (dict): content of first revision.
      r_content (dict): content of second revision.

  Returns:
      A dict representing the diff between two revision contents.
  """
  diff = _construct_diff(instance_meta_info, l_content, r_content)

  remaining_fields = set(r_content.keys())
  remaining_fields -= {f.name for f in instance_meta_info.fields}
  remaining_fields -= {f.name for f in instance_meta_info.mapping_fields}
  remaining_fields -= {f.name for f in instance_meta_info.mapping_list_fields}
  remaining_fields -= {
      # Diff for `access_control_list` and `custom_attribute_values` has
      # already been calculated in `_construct_diff` function call.
      "access_control_list",
      "custom_attribute_values",
      # `custom_attribute_definitions` is ignored since all possible obj
      # changes related with any change in CAD would be reflected in CAV.
      "custom_attribute_definitions",
      # The following fields are ignored cause they may differ but revisions
      # still may represent objects of same state.
      "created_at",
      "updated_at",
      "modified_by",
      "modified_by_id",
  }

  remaining_fields = {meta_info.Field(f, False) for f in remaining_fields}
  diff["other"] = generate_fields(
      fields=remaining_fields,
      proposed_content=r_content,
      current_data=l_content,
  )

  return diff


def _normalize_content(content):
  """Prepare content to changes_present.

  This functionality is needed to convert new revision data into data of the
  same type as another revision.

  Args:
      content: Content of new revision.

  Returns:
      Prepared content to changes_present.
  """
  new_content = json.loads(utils.as_json(content))
  return new_content


def changes_present(obj, new_rev_content, prev_rev_content=None,
                    obj_meta=None):
  """Check if `new_rev_content` contains obj changes.

  Checks whether `new_rev_content` contains changes in `obj` state or not. If
  `prev_rev_content` is not passed to this function, the latest revision of
  `obj` will be taken. Note that in this case revision whose content is passed
  as `new_rev_content` should not been saved in DB or no changes would be
  detected since two equal contents will be compared.

  Args:
      obj: db.Model instance which last revision would be compared with
        `new_revision` to detect presence of changes.
      new_rev_content: Content of newer revision to ckeck for changes.
      prev_rev_content: Content of older revision. Optional. If is not passed,
        latest `obj` revision will be taken.
      obj_meta: MetaInfo instance of `obj`. Optionla. If is not passed, will
        be constructed manually.

  Returns:
      Boolean flag indicating whether `new_rev_content` contains any changes
        in `obj` state comparing to `prev_rev_content`.
  """
  new_rev_content = _normalize_content(new_rev_content)
  if obj_meta is None:
    obj_meta = meta_info.MetaInfo(obj)
  if prev_rev_content is None:
    prev_rev_content = get_latest_revision_content(obj)
    if prev_rev_content is None:
      return True
  diff = prepare_content_full_diff(
      instance_meta_info=obj_meta,
      l_content=prev_rev_content,
      r_content=new_rev_content,
  )
  return any(diff.values())
