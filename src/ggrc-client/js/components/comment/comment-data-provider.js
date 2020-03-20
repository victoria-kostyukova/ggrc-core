/*
 Copyright (C) 2020 Google Inc.
 Licensed under http://www.apache.org/licenses/LICENSE-2.0 <see LICENSE file>
 */

import canList from 'can-list';
import canDefineMap from 'can-define/map/map';
import canComponent from 'can-component';
import {loadComments} from '../../plugins/utils/comments-utils';
import {
  REFRESH_COMMENTS,
  REFRESH_MAPPED_COUNTER,
} from '../../events/event-types';
import Relationship from '../../models/service-models/relationship';
import Context from '../../models/service-models/context';

const ViewModel = canDefineMap.extend({
  commentObjectName: {
    get() {
      return this.instance.constructor.isChangeableExternally
        ? 'ExternalComment'
        : 'Comment';
    },
  },
  instance: {
    value: null,
  },
  comments: {
    Type: canList,
    value: () => [],
  },
  pageSize: {
    value: 10,
  },
  totalCount: {
    value: 0,
  },
  newCommentsCount: {
    value: 0,
  },
  isLoading: {
    value: false,
  },
  hideComments() {
    // remain only first comments
    this.comments.splice(this.pageSize);
  },
  async loadFirstComments(count) {
    let instance = this.instance;
    let modelName = this.commentObjectName;
    let newCommentsCount = this.newCommentsCount;

    // load more comments as they can be added by other users before or after current user's new comments
    let pageSize = (count || this.pageSize) + newCommentsCount;

    let response = await loadComments(instance, modelName, 0, pageSize);
    let {values: comments, total} = response[modelName];

    this.comments.splice(0, newCommentsCount);
    this.comments.unshift(...comments);

    this.totalCount = total;
    this.newCommentsCount = 0;
  },
  async loadMoreComments(startIndex) {
    this.isLoading = true;

    let instance = this.instance;
    let modelName = this.commentObjectName;
    let index = startIndex || this.comments.length;
    let pageSize = this.pageSize;

    try {
      let response = await loadComments(instance, modelName, index, pageSize);
      let {values: comments, total} = response[modelName];

      let totalCount = this.totalCount;
      if (totalCount !== total) {
        // new comments were added by other users
        let newCommentsCount = total - totalCount;
        await Promise.all([
          this.loadFirstComments(newCommentsCount),
          this.loadMoreComments(index + newCommentsCount)]);
      } else {
        this.comments.push(...comments);
      }
    } finally {
      this.isLoading = false;
    }
  },
  addComment(event) {
    let newComment = event.items[0];
    return this.comments.unshift(newComment);
  },
  removeComment(commentToRemove) {
    let comments = this.comments;
    comments.replace(comments.filter((comment) => {
      return comment !== commentToRemove;
    }));
  },
  processComment(event) {
    if (event.success) {
      this.totalCount = this.totalCount + 1;
      this.newCommentsCount = this.newCommentsCount + 1;

      this.mapToInstance(event.item).then(() => {
        const instance = this.instance;
        instance.dispatch({
          ...REFRESH_MAPPED_COUNTER,
          modelType: 'Comment',
        });
        instance.refresh();
      });
    } else {
      this.removeComment(event.item);
    }
  },
  mapToInstance(comment) {
    return (new Relationship({
      context: this.instance.context || new Context({id: null}),
      source: this.instance,
      destination: comment,
    }))
      .save()
      .fail(() => {
        this.removeComment(comment);
      });
  },
});

export default canComponent.extend({
  tag: 'comment-data-provider',
  leakScope: true,
  ViewModel,
  async init() {
    this.viewModel.isLoading = true;
    try {
      await this.viewModel.loadFirstComments();
    } finally {
      this.viewModel.isLoading = false;
    }
  },
  events: {
    [`{viewModel.instance} ${REFRESH_COMMENTS.type}`]() {
      this.viewModel.comments.replace([]);
      this.viewModel.loadFirstComments();
    },
  },
});
