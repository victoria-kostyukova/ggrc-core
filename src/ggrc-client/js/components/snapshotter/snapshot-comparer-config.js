/*
 Copyright (C) 2019 Google Inc., authors, and contributors
 Licensed under http://www.apache.org/licenses/LICENSE-2.0 <see LICENSE file>
 */

import loLast from 'lodash/last';
import canMap from 'can-map';
import canComponent from 'can-component';
export default canComponent.extend({
  tag: 'snapshot-comparer-config',
  leakScope: true,
  viewModel: canMap.extend({
    define: {
      rightRevision: {
        get() {
          return loLast(this.attr('rightRevisions'));
        },
      },
    },
    instance: {},
    leftRevisionId: '',
    rightRevisions: [],
    modalTitle: 'Compare with the latest version',
    modalConfirm: 'Update',
    buttonView: `${GGRC.templates_path}/modals/prompt_buttons.stache`,
  }),
});
