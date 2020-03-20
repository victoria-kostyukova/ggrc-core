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
      const fakeLoadedObjects = {
        Comment: {
          values: [],
          total: 0,
        },
      };
      spyOn(CommentsUtils, 'loadComments')
        .and.returnValue(fakeLoadedObjects);
      viewModel.isLoading = false;

      viewModel.initMappedComments();

      expect(viewModel.isLoading).toBe(true);
    });

    it('calls loadComments() method', () => {
      viewModel.instance = 'instance';
      const fakeLoadedObjects = {
        Comment: {
          values: [],
          total: 0,
        },
      };
      spyOn(CommentsUtils, 'loadComments')
        .and.returnValue(fakeLoadedObjects);

      viewModel.initMappedComments();

      expect(CommentsUtils.loadComments)
        .toHaveBeenCalledWith('instance', 'Comment', 0, 5);
    });

    it('assigns loaded comments to mappedComments attr ' +
    'after loading comments', async () => {
      viewModel.mappedComments = [];
      const fakeLoadedObjects = {
        Comment: {
          values: ['Comment1', 'Comment2'],
          total: 2,
        },
      };
      spyOn(CommentsUtils, 'loadComments')
        .and.returnValue(Promise.resolve(fakeLoadedObjects));

      await viewModel.initMappedComments();

      expect(viewModel.mappedComments.serialize())
        .toEqual(['Comment1', 'Comment2']);
    });

    it('sets showMore attr to true if total comments count more ' +
    'then loaded comments count', async () => {
      viewModel.mappedComments = [];
      const fakeLoadedObjects = {
        Comment: {
          values: ['Comment1', 'Comment2'],
          total: 5,
        },
      };
      spyOn(CommentsUtils, 'loadComments')
        .and.returnValue(Promise.resolve(fakeLoadedObjects));

      await viewModel.initMappedComments();

      expect(viewModel.showMore).toBe(true);
    });

    it('sets showMore attr to false if total comments count less or ' +
    'equal to loaded comments count', async () => {
      viewModel.mappedComments = [];
      const fakeLoadedObjects = {
        Comment: {
          values: ['Comment1', 'Comment2'],
          total: 2,
        },
      };
      spyOn(CommentsUtils, 'loadComments')
        .and.returnValue(Promise.resolve(fakeLoadedObjects));

      await viewModel.initMappedComments();

      expect(viewModel.showMore).toBe(false);
    });

    it('sets isInitialized attr to true after loading comments', async () => {
      viewModel.isInitialized = false;
      spyOn(CommentsUtils, 'loadComments')
        .and.returnValue(Promise.resolve({Comment: {values: []}}));

      await viewModel.initMappedComments();

      expect(viewModel.isInitialized).toBe(true);
    });

    it('sets isLoading attr to false after loading comments', async () => {
      viewModel.isLoading = true;
      spyOn(CommentsUtils, 'loadComments')
        .and.returnValue(Promise.resolve({Comment: {values: []}}));

      await viewModel.initMappedComments();

      expect(viewModel.isLoading).toBe(false);
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
        viewModel.expanded = true;
        viewModel.isInitialized = false;
        spyOn(viewModel, 'initMappedComments');

        handler();

        expect(viewModel.initMappedComments).toHaveBeenCalled();
      });

      it('does not call initMappedComments if subtree is not expanded',
        () => {
          viewModel.expanded = false;
          viewModel.isInitialized = true;
          spyOn(viewModel, 'initMappedComments');

          handler();

          expect(viewModel.initMappedComments).not.toHaveBeenCalled();
        });

      it('does not call initMappedObjects if subtree is initialized',
        () => {
          viewModel.expanded = true;
          viewModel.isInitialized = true;
          spyOn(viewModel, 'initMappedComments');

          handler();

          expect(viewModel.initMappedComments).not.toHaveBeenCalled();
        });
    });
  });
});
