/*
 Copyright (C) 2020 Google Inc.
 Licensed under http://www.apache.org/licenses/LICENSE-2.0 <see LICENSE file>
 */

import {getComponentVM} from '../../../../js_specs/spec-helpers';
import Component from '../tab-panel';

describe('tab-panel component', function () {
  'use strict';

  let viewModel;

  beforeEach(function () {
    viewModel = getComponentVM(Component);
  });

  describe('.addPanel() method', function () {
    it('should add viewModel reference to the Panels List', function () {
      viewModel.addPanel();
      expect(viewModel.attr('panels').indexOf(viewModel) > -1).toBe(true);
    });

    it('should add viewModel reference only once the Panels List', function () {
      viewModel.addPanel();
      viewModel.addPanel();
      expect(viewModel.attr('panels').indexOf(viewModel) > -1).toBe(true);
      expect(viewModel.attr('panels').length).toBe(1);
    });
  });

  describe('removePanel() method', function () {
    it('should remove viewModel reference from the Panels List', function () {
      viewModel.addPanel();
      viewModel.removePanel();
      expect(viewModel.attr('panels').indexOf(viewModel) < 0).toBe(true);
    });

    it('should do nothing ' +
      'if this is no panel in the Panels List', function () {
      viewModel.addPanel();
      viewModel.removePanel();
      // Call the second remove
      viewModel.removePanel();
      expect(viewModel.attr('panels').indexOf(viewModel) < 0).toBe(true);
    });
  });

  describe('lazyTrigger property', () => {
    it('should be "true" for active tab', () => {
      viewModel.attr('preRender', false);
      viewModel.attr('active', true);

      expect(viewModel.attr('lazyTrigger')).toBeTruthy();
    });

    it('should be "true" for active tab', () => {
      viewModel.attr('preRender', true);
      viewModel.attr('active', true);

      expect(viewModel.attr('lazyTrigger')).toBeTruthy();
    });
  });

  describe('lazy render mode is active', () => {
    it('if cache-content is true', () => {
      viewModel.attr('cacheContent', true);

      expect(viewModel.attr('isLazyRender')).toBeTruthy();
    });

    it('if preRenderContent is true', () => {
      viewModel.attr('preRenderContent', true);

      expect(viewModel.attr('isLazyRender')).toBeTruthy();
    });
  });
});
