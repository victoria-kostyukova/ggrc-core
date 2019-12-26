/*
  Copyright (C) 2020 Google Inc.
  Licensed under http://www.apache.org/licenses/LICENSE-2.0 <see LICENSE file>
*/

import {getComponentVM} from '../../../../js_specs/spec-helpers';
import Component from '../simple-popover';

describe('simple-popover component', () => {
  let viewModel;
  let init;

  beforeAll(() => {
    viewModel = getComponentVM(Component);
    init = Component.prototype.init.bind({
      viewModel,
    });
  });

  describe('init() method ', () => {
    it('saves element in viewModel', () => {
      let element = {};
      init(element);

      expect(viewModel.element).toBeDefined();
    });
  });

  describe('show() method ', () => {
    beforeEach(() => {
      viewModel.hide();
    });

    it('opens popover', () => {
      viewModel.show();

      expect(viewModel.open).toBeTruthy();
    });

    it('creates event listener', () => {
      spyOn(document, 'addEventListener');
      viewModel.show();

      expect(document.addEventListener).toHaveBeenCalled();
    });
  });

  describe('hide() method ', () => {
    beforeEach(() => {
      viewModel.show();
    });

    it('closes popover', () => {
      viewModel.hide();

      expect(viewModel.open).toBeFalsy();
    });

    it('removes event listener', () => {
      spyOn(document, 'removeEventListener');
      viewModel.hide();

      expect(document.removeEventListener).toHaveBeenCalled();
    });
  });

  describe('toggle() method ', () => {
    it('delegates to hide', () => {
      viewModel.open = true;
      spyOn(viewModel, 'hide');
      viewModel.toggle();

      expect(viewModel.hide).toHaveBeenCalled();
    });

    it('delegates to show', () => {
      viewModel.open = false;
      spyOn(viewModel, 'show');
      viewModel.toggle();

      expect(viewModel.show).toHaveBeenCalled();
    });
  });
});
