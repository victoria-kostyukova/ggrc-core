/*
  Copyright (C) 2020 Google Inc.
  Licensed under http://www.apache.org/licenses/LICENSE-2.0 <see LICENSE file>
 */

import {getComponentVM} from '../../../../js_specs/spec-helpers';
import Component from '../comment-list-item';

describe('comment-list-item component', () => {
  let viewModel;

  beforeEach(() => {
    viewModel = getComponentVM(Component);
  });

  describe('should have some default values', () => {
    it('and they should be correct', () => {
      expect(viewModel.attr('showIcon')).toBeFalsy();
      expect(viewModel.attr('commentAuthor')).toBeFalsy();
      expect(viewModel.attr('hasRevision')).toBeFalsy();
    });
  });

  describe('expected assignee type with a capital letter in brackets, ' +
    'when the input:', () => {
    it('type in lower case', () => {
      viewModel.attr('instance', {
        assignee_type: 'foo',
      });

      expect(viewModel.attr('commentAuthorType')).toEqual('(Foo)');
    });

    it('type in upper case', () => {
      viewModel.attr('instance', {
        assignee_type: 'BAR',
      });

      expect(viewModel.attr('commentAuthorType')).toEqual('(Bar)');
    });

    it('type\'s letters in different cases', () => {
      viewModel.attr('instance', {
        assignee_type: 'bAz',
      });

      expect(viewModel.attr('commentAuthorType')).toEqual('(Baz)');
    });
  });

  describe('expected first assignee type is selected', () => {
    it('if multiple types specified', () => {
      viewModel.attr('instance', {
        assignee_type: 'foo, bar',
      });

      expect(viewModel.attr('commentAuthorType')).toEqual('(Foo)');
    });
  });

  describe('expected empty string ', () => {
    it('if input empty string', () => {
      viewModel.attr('instance', {
        assignee_type: '',
      });

      expect(viewModel.attr('commentAuthorType')).toEqual('');
    });

    it('if input null', () => {
      viewModel.attr('instance', {
        assignee_type: null,
      });

      expect(viewModel.attr('commentAuthorType')).toEqual('');
    });
  });
});
