/*
 Copyright (C) 2020 Google Inc.
 Licensed under http://www.apache.org/licenses/LICENSE-2.0 <see LICENSE file>
 */

import canList from 'can-list';
import canDefineMap from 'can-define/map/map';
import canComponent from 'can-component';
import canStache from 'can-stache';
import {loadComments} from '../../../plugins/utils/comments-utils';
import template from './assessment-mapped-comments.stache';

const ViewModel = canDefineMap.extend({
  instance: {
    value: () => ({}),
  },
  mappedComments: {
    Type: canList,
    value: () => [],
  },
  showMore: {
    value: false,
  },
  isInitialized: {
    value: false,
  },
  isLoading: {
    value: false,
  },
  expanded: {
    value: false,
  },
  async initMappedComments() {
    try {
      this.isLoading = true;
      const response =
        await loadComments(this.instance, 'Comment', 0, 5);
      let {values: comments, total} = response.Comment;

      this.mappedComments = comments;
      this.showMore = total > comments.length;
      this.isInitialized = true;
    } finally {
      this.isLoading = false;
    }
  },
});

export default canComponent.extend({
  tag: 'assessment-mapped-comments',
  view: canStache(template),
  ViewModel,
  events: {
    '{viewModel} expanded'() {
      const needToMakeRequest = this.viewModel.expanded &&
        !this.viewModel.isInitialized;
      if (needToMakeRequest) {
        this.viewModel.initMappedComments();
      }
    },
  },
});
