/*
  Copyright (C) 2020 Google Inc.
  Licensed under http://www.apache.org/licenses/LICENSE-2.0 <see LICENSE file>
*/

import Component from '../assessment-mapped-comments';
import {getComponentVM} from '../../../../../js_specs/spec-helpers';
import * as CommentsUtils from '../../../../plugins/utils/comments-utils';

describe('assessment-mapped-comments component', () => {
  let viewModel;

  beforeEach(() => {
    viewModel = getComponentVM(Component);
  });

  describe('initMappedComments() method', () => {
    it('sets isLoading attr to true before loading comments', () => {
      viewModel.attr('isLoading', false);

      viewModel.initMappedComments();

      expect(viewModel.attr('isLoading')).toBe(true);
    });

    it('calls loadComments() method', () => {
      viewModel.attr('instance', 'instance');
      spyOn(CommentsUtils, 'loadComments').and.returnValue(Promise.resolve());

      viewModel.initMappedComments();

      expect(CommentsUtils.loadComments)
        .toHaveBeenCalledWith('instance', 'Comment', 0, 5);
    });

    it('assigns loaded comments to mappedComments attr ' +
    'after loading comments', async () => {
      viewModel.attr('mappedComments', []);
      const fakeLoadedObjects = {
        Comment: {
          values: ['Comment1', 'Comment2'],
          total: 2,
        },
      };
      spyOn(CommentsUtils, 'loadComments')
        .and.returnValue(Promise.resolve(fakeLoadedObjects));

      await viewModel.initMappedComments();

      expect(viewModel.attr('mappedComments').serialize())
        .toEqual(['Comment1', 'Comment2']);
    });

    it('sets showMore attr to true if total comments count more ' +
    'then loaded comments count', async () => {
      viewModel.attr('mappedComments', []);
      const fakeLoadedObjects = {
        Comment: {
          values: ['Comment1', 'Comment2'],
          total: 5,
        },
      };
      spyOn(CommentsUtils, 'loadComments')
        .and.returnValue(Promise.resolve(fakeLoadedObjects));

      await viewModel.initMappedComments();

      expect(viewModel.attr('showMore')).toBe(true);
    });

    it('sets showMore attr to false if total comments count less or ' +
    'equal to loaded comments count', async () => {
      viewModel.attr('mappedComments', []);
      const fakeLoadedObjects = {
        Comment: {
          values: ['Comment1', 'Comment2'],
          total: 2,
        },
      };
      spyOn(CommentsUtils, 'loadComments')
        .and.returnValue(Promise.resolve(fakeLoadedObjects));

      await viewModel.initMappedComments();

      expect(viewModel.attr('showMore')).toBe(false);
    });

    it('sets isInitialized attr to true after loading comments', async () => {
      viewModel.attr('isInitialized', false);
      spyOn(CommentsUtils, 'loadComments')
        .and.returnValue(Promise.resolve({Comment: {values: []}}));

      await viewModel.initMappedComments();

      expect(viewModel.attr('isInitialized')).toBe(true);
    });

    it('sets isLoading attr to false after loading comments', async () => {
      viewModel.attr('isLoading', true);
      spyOn(CommentsUtils, 'loadComments')
        .and.returnValue(Promise.resolve({Comment: {values: []}}));

      await viewModel.initMappedComments();

      expect(viewModel.attr('isLoading')).toBe(false);
    });
  });

  describe('events', () => {
    let events;
    let handler;

    beforeAll(() => {
      events = Component.prototype.events;
    });

    describe('{viewModel} expanded', () => {
      beforeEach(() => {
        handler = events['{viewModel} expanded'].bind({viewModel});
      });

      it('calls initMappedComments if subtree is expanded ' +
      'and it is not initialized', () => {
        viewModel.attr('expanded', true);
        viewModel.attr('isInitialized', false);
        spyOn(viewModel, 'initMappedComments');

        handler();

        expect(viewModel.initMappedComments).toHaveBeenCalled();
      });

      it('does not call initMappedComments if subtree is not expanded',
        () => {
          viewModel.attr('expanded', false);
          viewModel.attr('isInitialized', true);
          spyOn(viewModel, 'initMappedComments');

          handler();

          expect(viewModel.initMappedComments).not.toHaveBeenCalled();
        });

      it('does not call initMappedObjects if subtree is initialized',
        () => {
          viewModel.attr('expanded', true);
          viewModel.attr('isInitialized', true);
          spyOn(viewModel, 'initMappedComments');

          handler();

          expect(viewModel.initMappedComments).not.toHaveBeenCalled();
        });
    });
  });
});
