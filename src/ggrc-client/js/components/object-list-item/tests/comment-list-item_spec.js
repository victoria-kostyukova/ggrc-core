/*
  Copyright (C) 2020 Google Inc.
  Licensed under http://www.apache.org/licenses/LICENSE-2.0 <see LICENSE file>
 */

import canMap from 'can-map';
import {getComponentVM} from '../../../../js_specs/spec-helpers';
import Component from '../comment-list-item';

describe('comment-list-item component', () => {
  let viewModel;

  beforeEach(() => {
    viewModel = getComponentVM(Component);
  });

  describe('should have some default values', () => {
    it('and they should be correct', () => {
      viewModel.instance = new canMap({});
      expect(viewModel.showIcon).toBe(false);
      expect(viewModel.commentAuthor).toBe(false);
      expect(viewModel.hasRevision).toBe(false);
    });
  });

  describe('expected assignee type with a capital letter in brackets, ' +
    'when the input:', () => {
    it('type in lower case', () => {
      viewModel.instance = new canMap({
        assignee_type: 'foo',
      });

      expect(viewModel.commentAuthorType).toEqual('(Foo)');
    });

    it('type in upper case', () => {
      viewModel.instance = new canMap({
        assignee_type: 'BAR',
      });

      expect(viewModel.commentAuthorType).toEqual('(Bar)');
    });

    it('type\'s letters in different cases', () => {
      viewModel.instance = new canMap({
        assignee_type: 'bAz',
      });

      expect(viewModel.commentAuthorType).toEqual('(Baz)');
    });
  });

  describe('expected first assignee type is selected', () => {
    it('if multiple types specified', () => {
      viewModel.instance = new canMap({
        assignee_type: 'foo, bar',
      });

      expect(viewModel.commentAuthorType).toEqual('(Foo)');
    });
  });

  describe('expected empty string ', () => {
    it('if input empty string', () => {
      viewModel.instance = new canMap({
        assignee_type: '',
      });

      expect(viewModel.commentAuthorType).toEqual('');
    });

    it('if input null', () => {
      viewModel.instance = new canMap({
        assignee_type: null,
      });

      expect(viewModel.commentAuthorType).toEqual('');
    });
  });
});
