/*
  Copyright (C) 2020 Google Inc.
  Licensed under http://www.apache.org/licenses/LICENSE-2.0 <see LICENSE file>
*/

import {getComponentVM} from '../../../../js_specs/spec-helpers';
import Component from '../revision-log-data';

describe('revision-log-data component', function () {
  'use strict';

  let viewModel;

  beforeAll(function () {
    viewModel = getComponentVM(Component);
  });

  afterAll(function () {
    viewModel = getComponentVM(Component);
  });

  describe('isObject', function () {
    it('return true if data value is object', function () {
      viewModel.attr('data', {});
      expect(viewModel.attr('isObject')).toEqual(true);
    });
  });
});
