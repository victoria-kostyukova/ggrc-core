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

describe('mapper-results-columns-configuration component', function () {
  'use strict';
  let viewModel;

  beforeAll(function () {
    viewModel = getComponentVM(Component);
  });

  describe('set() of viewModel.selectedColumns', function () {
    beforeEach(function () {
      spyOn(viewModel, 'initializeColumns');
    });

    it('updates value of viewModel.selectedColumns', function () {
      viewModel.attr('selectedColumns', 123);
      expect(viewModel.attr('selectedColumns')).toEqual(123);
    });

    it('calls viewModel.initializeColumns()', function () {
      viewModel.attr('selectedColumns', 123);
      expect(viewModel.initializeColumns).toHaveBeenCalled();
    });
  });

  describe('set() of viewModel.availableColumns', function () {
    beforeEach(function () {
      spyOn(viewModel, 'initializeColumns');
    });

    it('updates value of viewModel.availableColumns',
      function () {
        viewModel.attr('availableColumns', 123);
        expect(viewModel.attr('availableColumns')).toEqual(123);
      });

    it('calls viewModel.initializeColumns()',
      function () {
        viewModel.attr('availableColumns', 123);
        expect(viewModel.initializeColumns).toHaveBeenCalled();
      });
  });

  describe('set() of viewModel.serviceColumns', function () {
    beforeEach(function () {
      spyOn(TreeViewUtils, 'getVisibleColumnsConfig').and.returnValue(456);
    });

    it('updates value of viewModel.serviceColumns with the result of ' +
    'TreeViewUtils.getVisibleColumnsConfig function', function () {
      viewModel.attr('serviceColumns', 123);
      expect(TreeViewUtils.getVisibleColumnsConfig)
        .toHaveBeenCalledWith(123, 123);
      expect(viewModel.serviceColumns).toEqual(456);
    });
  });

  describe('init() method', function () {
    beforeEach(function () {
      spyOn(viewModel, 'initializeColumns');
    });

    it('calls initializeColumns()', function () {
      viewModel.init();
      expect(viewModel.initializeColumns).toHaveBeenCalled();
    });
  });

  describe('getModel() method', function () {
    it('returns the current model type constructor', function () {
      let result;
      viewModel.attr('modelType', 'Program');
      result = viewModel.getModel();
      expect(result).toEqual(Program);
    });
  });

  describe('initializeColumns() method', function () {
    let selectedColumns;
    let availableColumns;

    beforeAll(function () {
      selectedColumns = new makeArray([
        new canMap({attr_name: 'title'}),
      ]);
      availableColumns = new makeArray([
        new canMap({attr_name: 'title'}),
        new canMap({attr_name: 'date'}),
      ]);
    });

    beforeEach(function () {
      viewModel.attr('selectedColumns', selectedColumns);
      viewModel.attr('availableColumns', availableColumns);
    });

    it('updates viewModel.columns', function () {
      let columns;
      viewModel.initializeColumns();
      columns = viewModel.attr('columns');

      expect(columns.length).toBe(2);
      expect(columns[0].name).toEqual('title');
      expect(columns[0].selected).toBeTruthy();
      expect(columns[1].name).toEqual('date');
      expect(columns[1].selected).toBeFalsy();
    });
  });

  describe('setColumns() method', function () {
    beforeEach(function () {
      viewModel.attr('columns', [
        {name: 'title', selected: true},
        {name: 'date', selected: false},
      ]);
      spyOn(TreeViewUtils, 'setColumnsForModel')
        .and.returnValue({
          selected: 'selectedColumns',
        });
    });

    it('updates value of viewModel.selectedColumns', function () {
      viewModel.setColumns();
      expect(viewModel.selectedColumns).toEqual('selectedColumns');
    });
  });
});
