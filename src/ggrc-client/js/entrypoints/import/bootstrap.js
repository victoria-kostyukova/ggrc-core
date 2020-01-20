/*
    Copyright (C) 2020 Google Inc.
    Licensed under http://www.apache.org/licenses/LICENSE-2.0 <see LICENSE file>
*/

import canStache from 'can-stache';
import {initWidgets} from '../../plugins/utils/widgets-utils';
import {gapiClient} from '../../plugins/ggrc-gapi-client';

gapiClient.loadGapiClient();

$('#csv_import').html(canStache('<csv-import/>'));
$('#page-header').html(canStache('<page-header/>'));
initWidgets();
