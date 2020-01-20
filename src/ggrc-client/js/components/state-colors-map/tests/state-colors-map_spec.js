/*
  Copyright (C) 2020 Google Inc.
  Licensed under http://www.apache.org/licenses/LICENSE-2.0 <see LICENSE file>
*/

import {getComponentVM} from '../../../../js_specs/spec-helpers';
import Component from '../state-colors-map';

describe('state-colors-map component', function () {
  'use strict';

  let completedState = 'In Progress';
  let completedSuffix = 'inprogress';
  let defaultSuffix = 'notstarted';

  describe('in case state is set as "In Progress"', function () {
    let viewModel;

    beforeEach(function () {
      viewModel = getComponentVM(Component);
    });

    it('suffix property should be "inprogress"', function () {
      viewModel.attr('state', completedState);
      expect(viewModel.attr('suffix')).toBe(completedSuffix);
    });
  });

  describe('in case state is not defined', function () {
    let viewModel;

    beforeEach(function () {
      viewModel = getComponentVM(Component);
    });

    it('suffix property should be "notstarted"', function () {
      viewModel.attr('state', null);
      expect(viewModel.attr('suffix')).toBe(defaultSuffix);
    });
  });
});
