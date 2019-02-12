/*
    Copyright (C) 2019 Google Inc.
    Licensed under http://www.apache.org/licenses/LICENSE-2.0 <see LICENSE file>
*/

import {getComponentVM} from '../../../../js_specs/spec_helpers';
import Component from '../issue-unmap-dropdown-item';

describe('issue-unmap-dropdown-item component', function () {
  describe('viewModel scope', function () {
    let viewModel;

    beforeEach(function () {
      viewModel = getComponentVM(Component);
    });

    describe('issueUnmap get() method', function () {
      it('returns true if page_instance.type equals to "Issue" string',
        function () {
          viewModel.attr('page_instance.type', 'Issue');
          expect(viewModel.attr('issueUnmap')).toBe(true);
        });

      it('returns true if instance.type equals to "Issue" string', function () {
        viewModel.attr('instance.type', 'Issue');
        expect(viewModel.attr('issueUnmap')).toBe(true);
      });

      it('returns false if there are no instance.type and page_instance.type',
        function () {
          viewModel.attr('page_instance.type', null);
          viewModel.attr('instance.type', null);
          expect(viewModel.attr('issueUnmap')).toBe(false);
        });
    });

    describe('denyIssueUnmap get() method', function () {
      it('returns true if page_instance.type equals to "Audit" and' +
      'instance.allow_unmap_from_audit is false', function () {
        viewModel.attr('page_instance.type', 'Audit');
        viewModel.attr('instance.allow_unmap_from_audit', false);
        expect(viewModel.attr('denyIssueUnmap')).toBe(true);
      });

      it('returns true if instance.type equals to "Audit" and ' +
      'page_instance.allow_unmap_from_audit is false', function () {
        viewModel.attr('instance.type', 'Audit');
        viewModel.attr('page_instance.allow_unmap_from_audit', false);
        expect(viewModel.attr('denyIssueUnmap')).toBe(true);
      });

      it('returns false if instance.allow_unmap_from_audit and ' +
      'page_instance.allow_unmap_from_audit are both true', function () {
        viewModel.attr('instance.allow_unmap_from_audit', true);
        viewModel.attr('page_instance.allow_unmap_from_audit', true);
        expect(viewModel.attr('denyIssueUnmap')).toBe(false);
      });

      it('returns false if instnace.type and page_instnace.type do not equal' +
      'to "Audit"', function () {
        viewModel.attr('instance.type', 'Type');
        viewModel.attr('page_instance', 'Type');
        expect(viewModel.attr('denyIssueUnmap')).toBe(false);
      });
    });
  });
});
