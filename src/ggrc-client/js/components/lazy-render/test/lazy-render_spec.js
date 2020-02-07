/*
 Copyright (C) 2020 Google Inc.
 Licensed under http://www.apache.org/licenses/LICENSE-2.0 <see LICENSE file>
 */

import {getComponentVM} from '../../../../js_specs/spec-helpers';
import Component from '../lazy-render';

describe('lazy-render component', () => {
  let ViewModel;

  beforeEach(() => {
    ViewModel = getComponentVM(Component);
  });

  it('should set "activated" to true if "activate" is true', () => {
    ViewModel.activated = false;

    ViewModel.activate = true;
    expect(ViewModel.activated).toBe(true);
  });

  it('should NOT change "activated" if "activate" is true ' +
  'and panel was activated', () => {
    ViewModel.activated = true;

    ViewModel.activate = true;
    expect(ViewModel.activated).toBe(true);
  });

  it('should NOT change "activated" if "activate" is false ' +
  'and panel was activated', () => {
    ViewModel.activated = true;

    ViewModel.activate = false;
    expect(ViewModel.activated).toBe(true);
  });

  it('should NOT change "activated" if "activate" is false ' +
  'and panel was NOT activated', () => {
    ViewModel.activated = false;

    ViewModel.activate = false;
    expect(ViewModel.activated).toBe(false);
  });
});
