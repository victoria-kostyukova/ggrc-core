/*
  Copyright (C) 2020 Google Inc.
  Licensed under http://www.apache.org/licenses/LICENSE-2.0 <see LICENSE file>
*/

import {getComponentVM} from '../../../../js_specs/spec-helpers';
import Component from '../mapper-results-item';
import Snapshot from '../../../models/service-models/snapshot';
import Program from '../../../models/business-models/program';

describe('mapper-results-item', function () {
  'use strict';

  let viewModel;

  beforeEach(function () {
    viewModel = getComponentVM(Component);
  });

  describe('showOpenButton get() method', () => {
    it('returns true if searchOnly attr is true', () => {
      viewModel.attr('searchOnly', true);
      expect(viewModel.attr('showOpenButton')).toBe(true);
    });

    it('returns true if it is bulk-update view', () => {
      viewModel.attr('searchOnly', false);
      spyOn(viewModel, 'isBulkUpdateView').and.returnValue(true);
      expect(viewModel.attr('showOpenButton')).toBe(true);
    });

    it('returns false if searchOnly attr is false ' +
    'and it is not bulk-update view', () => {
      viewModel.attr('searchOnly', false);
      spyOn(viewModel, 'isBulkUpdateView').and.returnValue(false);
      expect(viewModel.attr('showOpenButton')).toBe(false);
    });
  });

  describe('viewClass get() method', () => {
    it('returns "bulk-update-view" if it is bulk-update view', () => {
      spyOn(viewModel, 'isBulkUpdateView').and.returnValue(true);
      expect(viewModel.attr('viewClass')).toBe('bulk-update-view');
    });

    it('returns "" if it is not bulk-update view', () => {
      spyOn(viewModel, 'isBulkUpdateView').and.returnValue(false);
      expect(viewModel.attr('viewClass')).toBe('');
    });
  });

  describe('displayItem() method', function () {
    it('returns content of revesion if itemData.revesion defined',
      function () {
        let result;
        viewModel.attr('itemData', {
          revision: {
            content: 'mockData',
          },
        });
        result = viewModel.displayItem();
        expect(result).toEqual('mockData');
      });

    it('returns itemData if itemData.revesion undefined',
      function () {
        let result;
        viewModel.attr('itemData', 'mockData');
        result = viewModel.displayItem();
        expect(result).toEqual('mockData');
      });
  });

  describe('title() method', function () {
    let itemData;
    beforeEach(function () {
      itemData = {
        title: 'mockTitle',
        name: 'mockName',
        email: 'mockEmail',
      };
    });

    it('returns item title', function () {
      let result;
      viewModel.attr('itemData', itemData);
      result = viewModel.title();
      expect(result).toEqual('mockTitle');
    });

    it('returns item name if no title', function () {
      let result;
      viewModel.attr('itemData', Object.assign(itemData, {
        title: undefined,
      }));
      result = viewModel.title();
      expect(result).toEqual('mockName');
    });

    it('returns item email if no title, name',
      function () {
        let result;
        viewModel.attr('itemData', Object.assign(itemData, {
          title: undefined,
          name: undefined,
        }));
        result = viewModel.title();
        expect(result).toEqual('mockEmail');
      });
  });

  describe('toggleIconCls() method', function () {
    it('returns fa-caret-down if showDetails is true', function () {
      let result;
      viewModel.attr('showDetails', true);
      result = viewModel.toggleIconCls();
      expect(result).toEqual('fa-caret-down');
    });

    it('returns fa-caret-right if showDetails is false',
      function () {
        let result;
        viewModel.attr('showDetails', false);
        result = viewModel.toggleIconCls();
        expect(result).toEqual('fa-caret-right');
      });
  });

  describe('toggleDetails() method', function () {
    it('changes viewModel.showDetails to false if was true', function () {
      viewModel.attr('showDetails', true);
      viewModel.toggleDetails();
      expect(viewModel.attr('showDetails')).toEqual(false);
    });
    it('changes viewModel.showDetails to true if was false', function () {
      viewModel.attr('showDetails', false);
      viewModel.toggleDetails();
      expect(viewModel.attr('showDetails')).toEqual(true);
    });
  });

  describe('isSnapshot() method', function () {
    it('returns true if it is snapshot', function () {
      let result;
      viewModel.attr('itemData', {
        type: Snapshot.model_singular,
      });
      result = viewModel.isSnapshot();
      expect(result).toEqual(true);
    });

    it('returns false if it is not snapshot', function () {
      let result;
      viewModel.attr('itemData', {
        type: 'mockType',
      });
      result = viewModel.isSnapshot();
      expect(result).toEqual(false);
    });
  });

  describe('isBulkUpdateView() method', () => {
    it('returns true if it is bulk-update view', () => {
      let result;
      viewModel.attr('itemDetailsViewType', 'bulk-update');
      result = viewModel.isBulkUpdateView();
      expect(result).toEqual(true);
    });

    it('returns false if it is not bulk-update view', () => {
      let result;
      viewModel.attr('itemDetailsViewType', 'fake-view');
      result = viewModel.isBulkUpdateView();
      expect(result).toEqual(false);
    });
  });

  describe('objectType() method', function () {
    it('returns child_type if it is snapshot', function () {
      let result;
      viewModel.attr('itemData', {
        type: Snapshot.model_singular,
        child_type: 'mockType',
      });
      result = viewModel.objectType();
      expect(result).toEqual('mockType');
    });

    it('returns type if it is not snapshot', function () {
      let result;
      viewModel.attr('itemData', {
        type: 'mockType',
      });
      result = viewModel.objectType();
      expect(result).toEqual('mockType');
    });
  });

  describe('objectTypeIcon() method', function () {
    it('returns object type icon', function () {
      let postfix;
      let result;
      viewModel.attr('itemData', {
        type: 'Program',
      });
      postfix = Program.table_singular;
      result = viewModel.objectTypeIcon();
      expect(result).toEqual('fa-' + postfix);
    });
  });

  describe('showRelatedAssessments() method', function () {
    it('dispatches event', function () {
      spyOn(viewModel, 'dispatch');
      viewModel.attr('itemData', 'mockData');
      viewModel.showRelatedAssessments();
      expect(viewModel.dispatch).toHaveBeenCalledWith(
        jasmine.objectContaining({
          type: 'showRelatedAssessments',
          instance: 'mockData',
        })
      );
    });
  });

  describe('"{viewModel.itemData} destroyed"() event handler', () => {
    let handler;

    beforeEach(() => {
      handler = Component.prototype.events['{viewModel.itemData} destroyed']
        .bind({viewModel});
      spyOn(viewModel, 'dispatch');
    });

    it('dispatches "itemDataDestroyed" event with defined "itemId" field',
      () => {
        viewModel.attr('itemData', {id: 12345});

        handler();

        expect(viewModel.dispatch).toHaveBeenCalledWith({
          type: 'itemDataDestroyed',
          itemId: 12345,
        });
      });
  });
});
