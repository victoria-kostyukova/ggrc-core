# Copyright (C) 2019 Google Inc.
# Licensed under http://www.apache.org/licenses/LICENSE-2.0 <see LICENSE file>

"""Settings for testing."""

import os

DEBUG = True
TESTING = True
LOGIN_DISABLED = False
PRODUCTION = False
HOST = '0.0.0.0'
SQLALCHEMY_DATABASE_URI = 'mysql+mysqldb://root:root@{}/{}'.format(
    os.environ.get('GGRC_DATABASE_HOST', 'localhost'),
    os.environ.get('GGRC_TEST_DB', 'ggrcdevtest'),
)
FULLTEXT_INDEXER = 'ggrc.fulltext.mysql.MysqlIndexer'
LOGIN_MANAGER = 'ggrc.login.noop'
# SQLALCHEMY_ECHO = True
MEMCACHE_MECHANISM = False
EXTERNAL_APP_USER = 'External App <external_app@example.com>'
ALLOWED_QUERYAPI_APP_IDS = "ggrc-id"
ENABLE_RELEASE_NOTES = False
