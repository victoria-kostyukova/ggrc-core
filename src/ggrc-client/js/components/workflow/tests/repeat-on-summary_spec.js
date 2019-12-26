/*
 Copyright (C) 2020 Google Inc.
 Licensed under http://www.apache.org/licenses/LICENSE-2.0 <see LICENSE file>
 */

import {getComponentVM} from '../../../../js_specs/spec-helpers';
import Component from '../repeat-on-summary';
import * as WorkflowConfig from '../../../apps/workflow-config';

describe('repeat-on-summary component', () => {
  'use strict';

  let ViewModel;

  beforeEach(() => {
    ViewModel = getComponentVM(Component);
  });

  describe('unitText getter', () => {
    let unitOptions;
    beforeAll(() => {
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

    afterAll(() => {
      WorkflowConfig.unitOptions = unitOptions;
    });

    it('returns empty text when unit is not specified', () => {
      let result;

      result = ViewModel.unitText;

      expect(result).toBe('');
    });

    it('returns empty text when incorrect unit specified', () => {
      let result;
      ViewModel.unit = 'Hour';

      result = ViewModel.unitText;

      expect(result).toBe('');
    });

    it('returns appropriate when correct unit specified', () => {
      let result;
      ViewModel.unit = 'Week';

      result = ViewModel.unitText;

      expect(result).toBe('week');
    });

    it('returns appropriate when correct unit specified', () => {
      let result;
      ViewModel.unit = 'Week';
      ViewModel.repeatEvery = 4;

      result = ViewModel.unitText;

      expect(result).toBe('4 weeks');
    });
  });
});
