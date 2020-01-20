# Copyright (C) 2020 Google Inc.
# Licensed under http://www.apache.org/licenses/LICENSE-2.0 <see LICENSE file>
"""Api search test settings."""
import os

SQLALCHEMY_DATABASE_URI = 'mysql+mysqldb://root:root@{}/ggrcdevtest_apisearch'\
    .format(os.environ.get('GGRC_DATABASE_HOST', 'localhost'))
