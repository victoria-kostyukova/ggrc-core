# Copyright (C) 2020 Google Inc.
# Licensed under http://www.apache.org/licenses/LICENSE-2.0 <see LICENSE file>

"""Contains a WithReadOnlyAccess mixin.

It allows to mark objects as read-only
"""

import logging

from ggrc.models import reflection
from ggrc.models.mixins.customattributable import CustomAttributable


logger = logging.getLogger(__name__)


class WithExtCustomAttrsSetter(CustomAttributable):
  """Mixin for models which support 'external_custom_attributes' setter"""
  # pylint: disable=too-few-public-methods

  _api_attrs = reflection.ApiAttributes(
      reflection.Attribute("external_custom_attributes", read=False),
  )

  def external_custom_attributes(self, src):
    # type: (List[Dict[str, str]]) -> None
    """Set CAV in format specific to sync service

    This method accesses only 'external_custom_attributes' key from 'src'

    Format example: [{'name': 'a', value: 'val-a'},
                     {'name': 'b', value: 'val-b'}]
    In this example, values 'val-a' and 'val-b' have to be set to
    custom attributes with names 'a' and 'b' correspondingly

    if `values` is empty, no attributes will be set

    If custom attribute with some name doesn't exist, corresponding item will
    be skipped

    This method calls original `custom_attribute_values` setter

    :param src: json dict from request
    """

    values = src.get('external_custom_attributes')

    if not values:
      return

    cad_ti_map = dict(
        (cad.title, cad.id)
        for cad in self.get_custom_attribute_definitions()
    )

    cavs = list()
    for item in values:
      if 'name' not in item or 'value' not in item:
        continue

      name = item['name']
      value = item['value']
      if name not in cad_ti_map:
        logger.warning("Skipping external custom attribute %r, because "
                       "definition with such name was not found", name)
        continue
      cavs.append({
          'custom_attribute_id': cad_ti_map[name],
          'attribute_value': value,
          'attribute_object': None,
      })

    # pylint: disable=attribute-defined-outside-init
    self.custom_attribute_values = cavs
