/*
 Copyright (C) 2020 Google Inc.
 Licensed under http://www.apache.org/licenses/LICENSE-2.0 <see LICENSE file>
 */

import canStache from 'can-stache';
import canDefineMap from 'can-define/map/map';
import canComponent from 'can-component';
import Comment from '../../models/service-models/comment';

const ViewModel = canDefineMap.extend({
  disabled: {
    get() {
      return this.isSaving || !this.value.length || this.isDisabled;
    },
  },
  value: {
    type: 'string',
    value: '',
    set(newValue) {
      return newValue || '';
    },
  },
  isDisabled: {
    value: false,
  },
  isSaving: {
    value: false,
  },
  createComment() {
    let comment;
    let description = this.value;

    if (this.disabled) {
      return;
    }

    comment = new Comment({
      description: description,
      modified_by: {type: 'Person', id: GGRC.current_user.id},
    });
    // Erase RichText Field after Comment Creation
    this.value = '';

    this.dispatch({
      type: 'commentCreated',
      comment: comment,
    });
  },
});

export default canComponent.extend({
  tag: 'comment-add-button',
  view: canStache(
    '<button type="button" class="btn btn-small btn-gray"' +
    ' on:el:click="createComment()">' +
    '<content/></button>'
  ),
  leakScope: true,
  ViewModel,
});
