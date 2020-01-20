# Copyright (C) 2020 Google Inc.
# Licensed under http://www.apache.org/licenses/LICENSE-2.0 <see LICENSE file>

"""Module provides constants for external app."""

from ggrc.models.all_models import get_external_models

GGRCQ_OBJ_TYPES_FOR_SYNC = {model.__name__ for model in get_external_models()}
