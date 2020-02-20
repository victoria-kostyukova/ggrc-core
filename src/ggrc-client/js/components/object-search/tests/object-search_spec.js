/*
  Copyright (C) 2020 Google Inc.
  Licensed under http://www.apache.org/licenses/LICENSE-2.0 <see LICENSE file>
*/

import canMap from 'can-map';
import Component from '../object-search';

describe('object-search component', () => {
  let viewModel;
  let parentViewModel;

  beforeEach(() => {
    parentViewModel = new canMap();
    viewModel = Component.prototype.viewModel({}, parentViewModel)();
  });

  describe('onSubmit() method', () => {
    it('sets resultsRequested flag to true', () => {
      viewModel.resultsRequested = false;

      viewModel.onSubmit();

      expect(viewModel.resultsRequested).toBe(true);
    });
  });
});
