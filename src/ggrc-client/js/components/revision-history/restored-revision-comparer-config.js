/*
 Copyright (C) 2020 Google Inc., authors, and contributors
 Licensed under http://www.apache.org/licenses/LICENSE-2.0 <see LICENSE file>
 */

import canMap from 'can-map';
import canComponent from 'can-component';
export default canComponent.extend({
  tag: 'restored-revision-comparer-config',
  leakScope: true,
  viewModel: canMap.extend({
    instance: {},
    rightRevision: {},
    leftRevisionId: '',
    modalTitle: 'Restore Version: Compare to Current',
    buttonView: '/modals/restore-revision.stache',
    leftRevisionDescription: 'Current version:',
    rightRevisionDescription: 'Revision:',
  }),
});
