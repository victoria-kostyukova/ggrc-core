/*
  Copyright (C) 2020 Google Inc.
  Licensed under http://www.apache.org/licenses/LICENSE-2.0 <see LICENSE file>
*/

import canMap from 'can-map';
import Component from '../object-search';

describe('object-search component', function () {
  'use strict';

  let viewModel;
  let parentViewModel;

  beforeEach(function () {
    parentViewModel = new canMap();
    viewModel = new Component.prototype.viewModel({}, parentViewModel)();
  });

  describe('onSubmit() method', function () {
    it('sets resultsRequested flag to true', function () {
      viewModel.attr('resultsRequested', false);

      viewModel.onSubmit();

      expect(viewModel.attr('resultsRequested')).toBe(true);
    });
  });
});
