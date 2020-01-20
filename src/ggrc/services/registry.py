# Copyright (C) 2020 Google Inc.
# Licensed under http://www.apache.org/licenses/LICENSE-2.0 <see LICENSE file>

from collections import namedtuple
from ggrc.services.common import Resource

ServiceEntry = namedtuple('ServiceEntry', 'name model_class service_class')


def service(name, model_class, service_class=Resource):
  return ServiceEntry(name, model_class, service_class)
