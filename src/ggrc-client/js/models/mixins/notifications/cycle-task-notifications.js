/*
    Copyright (C) 2020 Google Inc.
    Licensed under http://www.apache.org/licenses/LICENSE-2.0 <see LICENSE file>
*/

import Mixin from '../mixin';

export default class CycleTaskNotifications extends Mixin {
}

Object.assign(CycleTaskNotifications.prototype, {
  send_by_default: true,
  recipients: 'Task Assignees,Task Secondary Assignees',
});
