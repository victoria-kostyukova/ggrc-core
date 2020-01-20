/*
 Copyright (C) 2020 Google Inc.
 Licensed under http://www.apache.org/licenses/LICENSE-2.0 <see LICENSE file>
 */

import canMap from 'can-map';
import canComponent from 'can-component';
import {trigger} from 'can-event';

export default canComponent.extend({
  tag: 'map-button-using-assessment-type',
  leakScope: true,
  viewModel: canMap.extend({
    instance: {},
    openMapper() {
      let data = {
        join_object_type: this.attr('instance.type'),
        join_object_id: this.attr('instance.id'),
        type: this.attr('instance.assessment_type'),
      };

      import(/* webpackChunkName: "mapper" */ '../../controllers/mapper/mapper')
        .then((mapper) => {
          mapper.ObjectMapper.openMapper(data);
        });
    },
    onMapObjectsClick(el, ev) {
      const $el = $(el);
      $el.data('type', this.attr('instance.assessment_type'));
      import(/* webpackChunkName: "mapper" */ '../../controllers/mapper/mapper')
        .then(() => {
          trigger.call($el[0], 'openMapper', ev);
        });
    },
  }),
});
