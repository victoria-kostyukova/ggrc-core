/*
 Copyright (C) 2020 Google Inc.
 Licensed under http://www.apache.org/licenses/LICENSE-2.0 <see LICENSE file>
 */

import Component from '../comment-data-provider';
import {
  getComponentVM,
  makeFakeInstance,
} from '../../../../js_specs/spec-helpers';
import * as CommentsUtils from '../../../plugins/utils/comments-utils';
import Cacheable from '../../../models/cacheable';

describe('comment-data-provider component', () => {
  let viewModel;

  beforeEach(() => {
    viewModel = getComponentVM(Component);
    viewModel.attr('instance', makeFakeInstance({model: Cacheable})());
  });

  describe('init() method', () => {
    let method;
    beforeEach(() => {
      method = Component.prototype.init.bind({viewModel});
      spyOn(CommentsUtils, 'loadComments');
    });

    it('loads comments', () => {
      spyOn(viewModel, 'loadFirstComments');

      method();

      expect(viewModel.loadFirstComments).toHaveBeenCalled();
    });

    it('turns on/off isLoading flag if loaded successfully', (done) => {
      viewModel.attr('isLoading', false);

      CommentsUtils.loadComments
        .and.returnValue(Promise.resolve({Comment: {values: []}}));

      method()
        .finally(() => {
          expect(viewModel.attr('isLoading')).toBe(false);
          done();
        });

      expect(viewModel.attr('isLoading')).toBe(true);
    });

    it('turns on/off isLoading flag if loading fails', (done) => {
      viewModel.attr('isLoading', false);

      CommentsUtils.loadComments
        .and.returnValue(Promise.reject());

      method()
        .catch(() => {
          expect(viewModel.attr('isLoading')).toBe(false);
          done();
        });

      expect(viewModel.attr('isLoading')).toBe(true);
    });
  });

  describe('loadFirstComments() method', () => {
    beforeEach(() => {
      spyOn(CommentsUtils, 'loadComments');
    });

    it('loads default comments count if not defined', () => {
      CommentsUtils.loadComments
        .and.returnValue(Promise.resolve({Comment: {values: []}}));
      viewModel.attr('pageSize', 20);

      let instance = viewModel.attr('instance');

      viewModel.loadFirstComments();

      expect(CommentsUtils.loadComments)
        .toHaveBeenCalledWith(instance, 'Comment', 0, 20);
    });

    it('loads needed comments count', () => {
      CommentsUtils.loadComments
        .and.returnValue(Promise.resolve({Comment: {values: []}}));
      let instance = viewModel.attr('instance');

      viewModel.loadFirstComments(15);

      expect(CommentsUtils.loadComments)
        .toHaveBeenCalledWith(instance, 'Comment', 0, 15);
    });

    it('loads more comments if they are added by current user', () => {
      CommentsUtils.loadComments
        .and.returnValue(Promise.resolve({Comment: {values: []}}));
      viewModel.attr('newCommentsCount', 20);

      let instance = viewModel.attr('instance');

      viewModel.loadFirstComments(5);

      expect(CommentsUtils.loadComments)
        .toHaveBeenCalledWith(instance, 'Comment', 0, 25);
    });

    it('sets comments if loaded', async () => {
      viewModel.attr('comments', []);
      CommentsUtils.loadComments.and.returnValue(Promise.resolve({
        Comment: {
          total: 3,
          values: [{}, {}, {}],
        },
      }));

      await viewModel.loadFirstComments();

      expect(viewModel.attr('comments').length).toBe(3);
    });

    it('replaces new comments with loaded', async () => {
      viewModel.attr('comments', [{id: 3}, {id: 1}]);
      viewModel.attr('newCommentsCount', 1);

      let instance = viewModel.attr('instance');

      CommentsUtils.loadComments.and.returnValue(Promise.resolve({
        Comment: {
          total: 3,
          values: [{id: 4}, {id: 3}, {id: 2}],
        },
      }));

      await viewModel.loadFirstComments(2);

      expect(CommentsUtils.loadComments)
        .toHaveBeenCalledWith(instance, 'Comment', 0, 3);

      expect(viewModel.attr('comments').length).toBe(4);

      viewModel.attr('comments').forEach((comment, index) => {
        expect(comment.id).toBe(4 - index);
      });
    });

    it('sets totalCount if comments are loaded', async () => {
      viewModel.attr('totalCount', 0);
      CommentsUtils.loadComments.and.returnValue(Promise.resolve({
        Comment: {
          total: 3,
          values: [{}, {}, {}],
        },
      }));

      await viewModel.loadFirstComments();

      expect(viewModel.attr('totalCount')).toBe(3);
    });

    it('resets newCommentsCount', async () => {
      CommentsUtils.loadComments.and.returnValue(Promise.resolve({
        Comment: {
          total: 3,
          values: [{}, {}, {}],
        },
      }));

      viewModel.attr('newCommentsCount', 20);

      await viewModel.loadFirstComments(5);

      expect(viewModel.attr('newCommentsCount')).toBe(0);
    });
  });

  describe('loadMoreComments() method', () => {
    beforeEach(() => {
      spyOn(CommentsUtils, 'loadComments');
    });

    it('loads next comments', () => {
      viewModel.attr('comments', [{}, {}]);
      viewModel.attr('pageSize', 20);

      CommentsUtils.loadComments.and.returnValue(Promise.resolve({
        Comment: {
          total: 0,
          values: [],
        },
      }));

      let instance = viewModel.attr('instance');

      viewModel.loadMoreComments();

      expect(CommentsUtils.loadComments)
        .toHaveBeenCalledWith(instance, 'Comment', 2, 20);
    });

    it('loads comments from defined index', () => {
      viewModel.attr('comments', [{}, {}]);
      viewModel.attr('pageSize', 20);

      CommentsUtils.loadComments.and.returnValue(Promise.resolve({
        Comment: {
          total: 0,
          values: [],
        },
      }));

      let instance = viewModel.attr('instance');

      viewModel.loadMoreComments(5);

      expect(CommentsUtils.loadComments)
        .toHaveBeenCalledWith(instance, 'Comment', 5, 20);
    });

    it('adds loaded comments to collection if there are no new comments',
      async () => {
        viewModel.attr('totalCount', 2);
        viewModel.attr('comments', []);

        CommentsUtils.loadComments.and.returnValue(Promise.resolve({
          Comment: {
            total: 2,
            values: [{}, {}],
          },
        }));

        await viewModel.loadMoreComments();

        expect(viewModel.attr('comments').length).toBe(2);
      });

    it('loads new and next comments if new comments are added by another users',
      async () => {
        viewModel.attr('totalCount', 20);
        viewModel.attr('comments', [{}, {}]);

        spyOn(viewModel, 'loadFirstComments');
        spyOn(viewModel, 'loadMoreComments');
        viewModel.loadMoreComments.withArgs().and.callThrough();
        viewModel.loadMoreComments.withArgs(jasmine.any(Number));

        CommentsUtils.loadComments.and.returnValue(Promise.resolve({
          Comment: {
            total: 25,
            values: [{}, {}, {}],
          },
        }));

        await viewModel.loadMoreComments();

        expect(viewModel.attr('comments').length).toBe(2);
        expect(viewModel.loadFirstComments).toHaveBeenCalledWith(5);
        expect(viewModel.loadMoreComments).toHaveBeenCalledWith(7);
      });

    it('turns on/off isLoading flag if loaded successfully', (done) => {
      viewModel.attr('isLoading', false);

      CommentsUtils.loadComments
        .and.returnValue(Promise.resolve({
          Comment: {
            total: 0,
            values: [],
          },
        }));

      viewModel.loadMoreComments()
        .finally(() => {
          expect(viewModel.attr('isLoading')).toBe(false);
          done();
        });

      expect(viewModel.attr('isLoading')).toBe(true);
    });

    it('turns on/off isLoading flag if loading failed', (done) => {
      viewModel.attr('isLoading', false);

      CommentsUtils.loadComments.and.returnValue(Promise.reject());

      viewModel.loadMoreComments()
        .catch(() => {
          expect(viewModel.attr('isLoading')).toBe(false);
          done();
        });

      expect(viewModel.attr('isLoading')).toBe(true);
    });
  });

  describe('addComment() method', () => {
    it('adds comment to the beginning of the collection', () => {
      viewModel.attr('comments').replace(['comment2']);
      viewModel.addComment({
        items: ['comment1'],
      });

      expect(viewModel.attr('comments')[0]).toBe('comment1');
    });
  });

  describe('removeComment() method', () => {
    it('removes the comment', () => {
      viewModel.attr('comments').replace([
        {title: 'comment1'},
        {title: 'comment2'},
      ]);
      viewModel.removeComment(viewModel.attr('comments')[0]);

      expect(viewModel.attr('comments').length).toBe(1);
      expect(viewModel.attr('comments')[0].attr('title')).toBe('comment2');
    });
  });

  describe('processComment() method', () => {
    let mapDfd;
    beforeEach(() => {
      mapDfd = $.Deferred();
      spyOn(viewModel, 'mapToInstance').and.returnValue(mapDfd.promise());
      viewModel.attr('instance', {
        refresh: jasmine.createSpy(),
      });
    });

    it('calls mapToInstance if success', () => {
      viewModel.processComment({success: true, item: 'item'});

      expect(viewModel.mapToInstance).toHaveBeenCalledWith('item');
    });

    it('refresh instance when comment was mapped', (done) => {
      viewModel.processComment({success: true, item: 'item'});

      mapDfd.resolve().then(() => {
        expect(viewModel.attr('instance').refresh).toHaveBeenCalled();
        done();
      });
    });

    it('calls removeComment if fail', () => {
      spyOn(viewModel, 'removeComment');

      viewModel.processComment({success: false, item: 'item'});

      expect(viewModel.removeComment).toHaveBeenCalledWith('item');
    });
  });
});
