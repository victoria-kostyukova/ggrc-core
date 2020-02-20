/*
 Copyright (C) 2020 Google Inc.
 Licensed under http://www.apache.org/licenses/LICENSE-2.0 <see LICENSE file>
 */

import canMap from 'can-map';
import {getComponentVM} from '../../../../js_specs/spec-helpers';
import Component from '../mapper-results-item-details';

describe('mapper-results-item-details component', () => {
  let viewModel;

  beforeEach(() => {
    let init;
    init = Component.prototype.ViewModel.prototype.init;
    Component.prototype.ViewModel.prototype.init = undefined;
    viewModel = getComponentVM(Component);
    Component.prototype.ViewModel.prototype.init = init;
    viewModel.init = init;
  });

  describe('init() method', () => {
    let instance;
    beforeEach(() => {
      instance = new canMap({
        type: 'Control',
      });
      viewModel.instance = instance;
    });
    it('sets correct instance for Snapshot objects', () => {
      let result;
      let snapshotInstance = new canMap({
        snapshotObject: 'snapshotObject',
      });
      viewModel.instance = snapshotInstance;
      viewModel.init();
      result = viewModel.instance;
      expect(result).toEqual('snapshotObject');
    });

    it('sets model for non-snapshot objects', () => {
      let result;
      viewModel.init();
      result = viewModel.model;
      expect(result.model_singular)
        .toEqual('Control');
    });
  });

  describe('assessmentType get() method', () => {
    it('returns plural title for instance.assessment_type', () => {
      const instance = new canMap({
        assessment_type: 'Control',
      });
      viewModel.instance = instance;

      expect(viewModel.assessmentType).toBe('Controls');
    });
  });
});
