/*
    Copyright (C) 2020 Google Inc.
    Licensed under http://www.apache.org/licenses/LICENSE-2.0 <see LICENSE file>
*/

import Cacheable from '../cacheable';

export default Cacheable.extend({
  root_object: 'notification_config',
  root_collection: 'notification_configs',
  category: 'person',
  findAll: 'GET /api/notification_configs',
  findOne: 'GET /api/notification_configs/{id}',
  create: 'POST /api/notification_configs',
  update: 'PUT /api/notification_configs/{id}',
  destroy: 'DELETE /api/notification_configs/{id}',
  active: 'POST /api/set_active_notifications',
  find(type) {
    return this.findAll({
      person_id: GGRC.current_user.id,
      notif_type: type,
    })
      .then((configs) => {
        return configs.shift();
      });
  },
}, {});
