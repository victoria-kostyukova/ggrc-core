/*
    Copyright (C) 2020 Google Inc.
    Licensed under http://www.apache.org/licenses/LICENSE-2.0 <see LICENSE file>
*/

import Mixin from '../mixin';

export default class ProgramNotifications extends Mixin {
}

Object.assign(ProgramNotifications.prototype, {
  send_by_default: true,
  recipients: 'Program Managers,Program Editors,Program Readers,' +
    'Primary Contacts,Secondary Contacts',
});
