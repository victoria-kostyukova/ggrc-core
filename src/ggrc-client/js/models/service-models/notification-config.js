/*
    Copyright (C) 2018 Google Inc.
    Licensed under http://www.apache.org/licenses/LICENSE-2.0 <see LICENSE file>
*/

import Cacheable from '../cacheable';
import Context from '../service-models/context';

export default Cacheable('CMS.Models.NotificationConfig', {
  root_object: 'notification_config',
  root_collection: 'notification_configs',
  category: 'person',
  findAll: 'GET /api/notification_configs',
  findOne: 'GET /api/notification_configs/{id}',
  create: 'POST /api/notification_configs',
  update: 'PUT /api/notification_configs/{id}',
  destroy: 'DELETE /api/notification_configs/{id}',
  active: 'POST /api/set_active_notifications',

  findActive: function () {
    if (GGRC.current_user === null || GGRC.current_user === undefined) {
      return $.when([]);
    }
    return this.findAll({person_id: GGRC.current_user.id});
  },
  setActive: function (active) {
    let existingTypes;
    let allTypes;
    let validTypes;

    if (!GGRC.current_user) {
      console.warn('User object is not set.');
      return $.when();
    }

    validTypes = $.map($('input[name=notifications]'), function (input) {
      return input.value;
    });

    return this.findActive().then((configs) => {
      existingTypes = $.map(configs, function (config) {
        return config.notif_type;
      });
      allTypes = $.map(validTypes, (type) => {
        let index = existingTypes.indexOf(type);
        if (index === -1) {
          // Create a new notificationConfig if it doesn't exist yet
          return new this({
            person_id: GGRC.current_user.id,
            notif_type: type,
            enable_flag: null,
            context: new Context({id: null}),
          });
        }
        return configs[index];
      });
      return $.when(...$.map(allTypes, function (config) {
        let enabled = active.indexOf(config.notif_type) !== -1;
        if (config.attr('enable_flag') === enabled) {
          // There was no change to this config object
          return;
        }
        if (!config.id) {
          // This is a new object so no need for refresh()
          config.attr('enable_flag', enabled);
          return config.save();
        }
        return config.refresh().then(function (refreshedConfig) {
          refreshedConfig.attr('enable_flag', enabled);
          return refreshedConfig.save();
        });
      }));
    });
  },
}, {});
