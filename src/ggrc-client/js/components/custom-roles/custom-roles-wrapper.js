/*
 Copyright (C) 2020 Google Inc.
 Licensed under http://www.apache.org/licenses/LICENSE-2.0 <see LICENSE file>
 */

import canDefineMap from 'can-define/map/map';
import canComponent from 'can-component';
import {updatePersonWidget} from '../../plugins/utils/widgets-utils';

const ViewModel = canDefineMap.extend({
  instance: {
    value: null,
  },
});

export default canComponent.extend({
  tag: 'custom-roles-wrapper',
  ViewModel,
  events: {
    '{viewModel.instance} updated'() {
      updatePersonWidget();
    },
  },
});
