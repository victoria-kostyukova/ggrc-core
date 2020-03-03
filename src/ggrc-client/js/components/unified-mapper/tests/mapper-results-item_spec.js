/*
  Copyright (C) 2020 Google Inc.
  Licensed under http://www.apache.org/licenses/LICENSE-2.0 <see LICENSE file>
*/

import {getComponentVM} from '../../../../js_specs/spec-helpers';
import Component from '../mapper-results-item';
import Snapshot from '../../../models/service-models/snapshot';
import Program from '../../../models/business-models/program';

describe('mapper-results-item', () => {
  let viewModel;

  beforeEach(() => {
    viewModel = getComponentVM(Component);
  });

  describe('showOpenButton get() method', () => {
    it('returns true if searchOnly attr is true', () => {
      viewModel.searchOnly = true;
      expect(viewModel.showOpenButton).toBe(true);
    });

    it('returns true if it is bulk-update view', () => {
      viewModel.searchOnly = false;
      spyOn(viewModel, 'isBulkUpdateView').and.returnValue(true);
      expect(viewModel.showOpenButton).toBe(true);
    });

    it('returns false if searchOnly attr is false ' +
    'and it is not bulk-update view', () => {
      viewModel.searchOnly = false;
      spyOn(viewModel, 'isBulkUpdateView').and.returnValue(false);
      expect(viewModel.showOpenButton).toBe(false);
    });
  });

  describe('viewClass get() method', () => {
    it('returns "bulk-update-view" if it is bulk-update view', () => {
      spyOn(viewModel, 'isBulkUpdateView').and.returnValue(true);
      expect(viewModel.viewClass).toBe('bulk-update-view');
    });

    it('returns "" if it is not bulk-update view', () => {
      spyOn(viewModel, 'isBulkUpdateView').and.returnValue(false);
      expect(viewModel.viewClass).toBe('');
    });
  });

  describe('displayItem() method', () => {
    it('returns content of revesion if itemData.revesion defined',
      () => {
        let result;
        viewModel.itemData = {
          revision: {
            content: 'mockData',
          },
        };
        result = viewModel.displayItem();
        expect(result).toEqual('mockData');
      });

    it('returns itemData if itemData.revision undefined',
      () => {
        let result;
        viewModel.itemData = 'mockData';
        result = viewModel.displayItem();
        expect(result).toEqual('mockData');
      });
  });

  describe('title() method', () => {
    let itemData;
    beforeEach(() => {
      itemData = {
        title: 'mockTitle',
        name: 'mockName',
        email: 'mockEmail',
      };
    });

    it('returns item title', () => {
      let result;
      viewModel.itemData = itemData;
      result = viewModel.title();
      expect(result).toEqual('mockTitle');
    });

    it('returns item name if no title', () => {
      let result;
      viewModel.itemData = Object.assign(itemData, {
        title: undefined,
      });
      result = viewModel.title();
      expect(result).toEqual('mockName');
    });

    it('returns item email if no title, name',
      () => {
        let result;
        viewModel.itemData = Object.assign(itemData, {
          title: undefined,
          name: undefined,
        });
        result = viewModel.title();
        expect(result).toEqual('mockEmail');
      });
  });

  describe('toggleIconCls() method', () => {
    it('returns fa-caret-down if showDetails is true', () => {
      let result;
      viewModel.showDetails = true;
      result = viewModel.toggleIconCls();
      expect(result).toEqual('fa-caret-down');
    });

    it('returns fa-caret-right if showDetails is false',
      () => {
        let result;
        viewModel.showDetails = false;
        result = viewModel.toggleIconCls();
        expect(result).toEqual('fa-caret-right');
      });
  });

  describe('toggleDetails() method', () => {
    it('changes viewModel.showDetails to false if was true', () => {
      viewModel.showDetails = true;
      viewModel.toggleDetails();
      expect(viewModel.showDetails).toEqual(false);
    });
    it('changes viewModel.showDetails to true if was false', () => {
      viewModel.showDetails = false;
      viewModel.toggleDetails();
      expect(viewModel.showDetails).toEqual(true);
    });
  });

  describe('isSnapshot() method', () => {
    it('returns true if it is snapshot', () => {
      let result;
      viewModel.itemData = {
        type: Snapshot.model_singular,
      };
      result = viewModel.isSnapshot();
      expect(result).toEqual(true);
    });

    it('returns false if it is not snapshot', () => {
      let result;
      viewModel.itemData = {
        type: 'mockType',
      };
      result = viewModel.isSnapshot();
      expect(result).toEqual(false);
    });
  });

  describe('isBulkUpdateView() method', () => {
    it('returns true if it is bulk-update view', () => {
      let result;
      viewModel.itemDetailsViewType = 'bulk-update';
      result = viewModel.isBulkUpdateView();
      expect(result).toEqual(true);
    });

    it('returns false if it is not bulk-update view', () => {
      let result;
      viewModel.itemDetailsViewType = 'fake-view';
      result = viewModel.isBulkUpdateView();
      expect(result).toEqual(false);
    });
  });

  describe('objectType() method', () => {
    it('returns child_type if it is snapshot', () => {
      let result;
      viewModel.itemData = {
        type: Snapshot.model_singular,
        child_type: 'mockType',
      };
      result = viewModel.objectType();
      expect(result).toEqual('mockType');
    });

    it('returns type if it is not snapshot', () => {
      let result;
      viewModel.itemData = {
        type: 'mockType',
      };
      result = viewModel.objectType();
      expect(result).toEqual('mockType');
    });
  });

  describe('objectTypeIcon() method', () => {
    it('returns object type icon', () => {
      let postfix;
      let result;
      viewModel.itemData = {
        type: 'Program',
      };
      postfix = Program.table_singular;
      result = viewModel.objectTypeIcon();
      expect(result).toEqual('fa-' + postfix);
    });
  });

  describe('showRelatedAssessments() method', () => {
    it('dispatches event', () => {
      spyOn(viewModel, 'dispatch');
      viewModel.itemData = 'mockData';
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
        viewModel.itemData = {id: 12345};

        handler();

        expect(viewModel.dispatch).toHaveBeenCalledWith({
          type: 'itemDataDestroyed',
          itemId: 12345,
        });
      });
  });
});
