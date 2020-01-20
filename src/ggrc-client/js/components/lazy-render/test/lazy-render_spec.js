/*
 Copyright (C) 2020 Google Inc.
 Licensed under http://www.apache.org/licenses/LICENSE-2.0 <see LICENSE file>
 */

import {getComponentVM} from '../../../../js_specs/spec-helpers';
import Component from '../lazy-render';

describe('lazy-render component', function () {
  'use strict';

  let viewModel;

  beforeEach(function () {
    viewModel = getComponentVM(Component);
  });

  it('should set "activated" to true if "trigger" is true', () => {
    viewModel.attr('activated', false);

    viewModel.attr('trigger', true);
    expect(viewModel.attr('activated')).toBe(true);
  });

  it('should NOT change "activated" if "trigger" is true ' +
  'and panel was activated', () => {
    viewModel.attr('activated', true);

    viewModel.attr('trigger', true);
    expect(viewModel.attr('activated')).toBe(true);
  });

  it('should NOT change "activated" if "trigger" is false ' +
  'and panel was activated', () => {
    viewModel.attr('activated', true);

    viewModel.attr('trigger', false);
    expect(viewModel.attr('activated')).toBe(true);
  });

  it('should NOT change "activated" if "trigger" is false ' +
  'and panel was NOT activated', () => {
    viewModel.attr('activated', false);

    viewModel.attr('trigger', false);
    expect(viewModel.attr('activated')).toBe(false);
  });
});
