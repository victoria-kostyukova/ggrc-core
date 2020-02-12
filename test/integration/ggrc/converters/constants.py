# Copyright (C) 2020 Google Inc.
# Licensed under http://www.apache.org/licenses/LICENSE-2.0 <see LICENSE file>

"""This module contains constants used for integration tests only."""


FLAG_VALIDATORS = (
    ('FALSE', False),
    ('False', False),
    ('false', False),
    ('  false  ', False),
    ('TRUE', True),
    ('True', True),
    ('true', True),
    ('tRUe', True),
    ('truE', True),
    ('   true   ', True),
    ('yes', True),
    ('YES', True),
    ('Yes', True),
    ('yEs', True),
    ('  Yes ', True),
    (' no ', False),
    ('No ', False),
    ('nO', False),
    ('NO', False),
)
