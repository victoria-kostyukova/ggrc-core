/*
  Copyright (C) 2020 Google Inc.
  Licensed under http://www.apache.org/licenses/LICENSE-2.0 <see LICENSE file>
*/

import makeArray from 'can-util/js/make-array/make-array';
import canMap from 'can-map';
import {getComponentVM} from '../../../../js_specs/spec-helpers';
import * as TreeViewUtils from '../../../plugins/utils/tree-view-utils';
import Component from '../mapper-results-columns-configuration';
import Program from '../../../models/business-models/program';

describe('mapper-results-columns-configuration component', () => {
  let viewModel;

  beforeAll(() => {
    viewModel = getComponentVM(Component);
  });

  describe('set() of viewModel.selectedColumns', () => {
    beforeEach(() => {
      spyOn(viewModel, 'initializeColumns');
    });

    it('updates value of viewModel.selectedColumns', () => {
      viewModel.selectedColumns = 123;
      expect(viewModel.selectedColumns).toEqual(123);
    });

    it('calls viewModel.initializeColumns()', () => {
      viewModel.selectedColumns = 123;
      expect(viewModel.initializeColumns).toHaveBeenCalled();
    });
  });

  describe('set() of viewModel.availableColumns', () => {
    beforeEach(() => {
      spyOn(viewModel, 'initializeColumns');
    });

    it('updates value of viewModel.availableColumns',
      () => {
        viewModel.availableColumns = 123;
        expect(viewModel.availableColumns).toEqual(123);
      });

    it('calls viewModel.initializeColumns()',
      () => {
        viewModel.availableColumns = 123;
        expect(viewModel.initializeColumns).toHaveBeenCalled();
      });
  });

  describe('set() of viewModel.serviceColumns', () => {
    beforeEach(() => {
      spyOn(TreeViewUtils, 'getVisibleColumnsConfig').and.returnValue(456);
    });

    it('updates value of viewModel.serviceColumns with the result of ' +
    'TreeViewUtils.getVisibleColumnsConfig function', () => {
      viewModel.serviceColumns = 123;
      expect(TreeViewUtils.getVisibleColumnsConfig)
        .toHaveBeenCalledWith(123, 123);
      expect(viewModel.serviceColumns).toEqual(456);
    });
  });

  describe('init() method', () => {
    beforeEach(() => {
      spyOn(viewModel, 'initializeColumns');
    });

    it('calls initializeColumns()', () => {
      viewModel.init();
      expect(viewModel.initializeColumns).toHaveBeenCalled();
    });
  });

  describe('getModel() method', () => {
    it('returns the current model type constructor', () => {
      let result;
      viewModel.modelType = 'Program';
      result = viewModel.getModel();
      expect(result).toEqual(Program);
    });
  });

  describe('initializeColumns() method', () => {
    let selectedColumns;
    let availableColumns;

    beforeAll(() => {
      selectedColumns = new makeArray([
        new canMap({attr_name: 'title'}),
      ]);
      availableColumns = new makeArray([
        new canMap({attr_name: 'title'}),
        new canMap({attr_name: 'date'}),
      ]);
    });

    beforeEach(() => {
      viewModel.selectedColumns = selectedColumns;
      viewModel.availableColumns = availableColumns;
    });

    it('updates viewModel.columns', () => {
      let columns;
      viewModel.initializeColumns();
      columns = viewModel.columns;

      expect(columns.length).toBe(2);
      expect(columns[0].name).toEqual('title');
      expect(columns[0].selected).toBeTruthy();
      expect(columns[1].name).toEqual('date');
      expect(columns[1].selected).toBeFalsy();
    });
  });

  describe('setColumns() method', () => {
    beforeEach(() => {
      viewModel.columns = [
        {name: 'title', selected: true},
        {name: 'date', selected: false},
      ];
      spyOn(TreeViewUtils, 'setColumnsForModel')
        .and.returnValue({
          selected: 'selectedColumns',
        });
    });

    it('updates value of viewModel.selectedColumns', () => {
      viewModel.setColumns();
      expect(viewModel.selectedColumns).toEqual('selectedColumns');
    });
  });
});
