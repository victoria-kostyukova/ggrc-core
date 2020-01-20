/*
 Copyright (C) 2020 Google Inc.
 Licensed under http://www.apache.org/licenses/LICENSE-2.0 <see LICENSE file>
 */

import {getComponentVM} from '../../../../js_specs/spec-helpers';
import Component from '../repeat-on-summary';
import * as WorkflowConfig from '../../../apps/workflow-config';

describe('repeat-on-summary component', function () {
  'use strict';

  let viewModel;

  beforeEach(function () {
    viewModel = getComponentVM(Component);
  });

  describe('unitText getter', function () {
    let unitOptions;
    beforeAll(function () {
      unitOptions = WorkflowConfig.unitOptions;
      WorkflowConfig.unitOptions = [
        {
          title: 'Daily',
          value: 'Day',
          plural: 'days',
          singular: 'day'},
        {
          title: 'Weekly',
          value: 'Week',
          plural: 'weeks',
          singular: 'week'},
        {
          title: 'Monthly',
          value: 'Month',
          plural: 'months',
          singular: 'month'}];
    });

    afterAll(function () {
      WorkflowConfig.unitOptions = unitOptions;
    });

    it('returns empty text when unit is not specified', function () {
      let result;

      result = viewModel.attr('unitText');

      expect(result).toBe('');
    });

    it('returns empty text when incorrect unit specified', function () {
      let result;
      viewModel.attr('unit', 'Hour');

      result = viewModel.attr('unitText');

      expect(result).toBe('');
    });

    it('returns appropriate when correct unit specified', function () {
      let result;
      viewModel.attr('unit', 'Week');

      result = viewModel.attr('unitText');

      expect(result).toBe('week');
    });

    it('returns appropriate when correct unit specified', function () {
      let result;
      viewModel.attr('unit', 'Week');
      viewModel.attr('repeatEvery', 4);

      result = viewModel.attr('unitText');

      expect(result).toBe('4 weeks');
    });
  });
});
