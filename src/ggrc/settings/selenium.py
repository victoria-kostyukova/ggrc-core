# Copyright (C) 2020 Google Inc.
# Licensed under http://www.apache.org/licenses/LICENSE-2.0 <see LICENSE file>

SQLALCHEMY_DATABASE_URI = 'mysql+mysqldb://root:root@db/ggrcdevtest' \
                          '?charset=utf8'
LOGGING_LOGGERS = {
    "ggrc": "INFO",
    "sqlalchemy": "WARNING",
    # WARNING - logs warnings and errors only
    # INFO    - logs SQL-queries
    # DEBUG   - logs SQL-queries + result sets
    "werkzeug": "INFO",
    # WARNING - logs warnings and errors only
    # INFO    - logs HTTP-queries
    "ggrc.utils.benchmarks": "DEBUG"
}
