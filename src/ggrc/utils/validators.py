# Copyright (C) 2018 Google Inc.
# Licensed under http://www.apache.org/licenses/LICENSE-2.0 <see LICENSE file>

"""Module with common validators for GGRC."""

from flask import request
from werkzeug import exceptions

from ggrc import settings
from ggrc.models import mixins


def validate_object_type_ggrcq(mapper, content, target):
  """Validate object_type actions for GGRCQ."""
  from ggrc.models import get_model

  del mapper, content  # Unused
  headers = request.headers
  model = get_model(target.object_type)
  is_ggrc_action = all([
      issubclass(model, mixins.ReadOnlyGGRC),
      headers.get("X-Requested-By") != settings.GGRC_Q_ACTION_HEADER
  ])

  if is_ggrc_action:
    raise exceptions.MethodNotAllowed()


def validate_definition_type_ggrcq(mapper, content, target):
  """Validate GGRCQ action for object with definition_type."""
  from ggrc.models import get_model

  del mapper, content  # Unused
  request_header = request.headers.get("X-Requested-By")
  model = get_model(target.definition_type)
  is_ggrc_action = all([
      issubclass(model, mixins.ReadOnlyGGRC),
      request_header != settings.GGRC_Q_ACTION_HEADER
  ])

  if is_ggrc_action:
    raise exceptions.MethodNotAllowed()
