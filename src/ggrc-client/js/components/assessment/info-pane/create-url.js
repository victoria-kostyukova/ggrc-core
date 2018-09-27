/*
    Copyright (C) 2018 Google Inc.
    Licensed under http://www.apache.org/licenses/LICENSE-2.0 <see LICENSE file>
*/

import {notifier} from '../../../plugins/utils/notifiers-utils';
import Context from '../../../models/service-models/context';
import Evidence from '../../../models/business-models/evidence';
import {getUtcDate} from '../../../plugins/utils/date-util';

export default can.Component.extend({
  tag: 'create-url',
  viewModel: {
    value: null,
    context: null,
    create: function () {
      let value = this.attr('value');
      let self = this;
      let evidence;
      let attrs;

      if (!value || !value.length) {
        notifier('error', 'Please enter a URL.');
        return;
      }

      attrs = {
        link: value,
        title: value,
        context: this.attr('context') || new Context({id: null}),
        kind: 'URL',
        created_at: getUtcDate(),
        _stamp: Date.now(),
      };

      evidence = new Evidence(attrs);
      this.dispatch({type: 'beforeCreate', items: [evidence]});
      evidence.save()
        .fail(function () {
          notifier('error', 'Unable to create URL.');
        })
        .done(function (data) {
          self.dispatch({type: 'created', item: data});
          self.clear();
        });
    },
    clear: function () {
      this.attr('value', null);
    },
  },
});
