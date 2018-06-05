/*
  Copyright (C) 2018 Google Inc.
  Licensed under http://www.apache.org/licenses/LICENSE-2.0 <see LICENSE file>
*/

import {getComponentVM} from '../../../../js_specs/spec_helpers';
import Component from '../simple-popover';

describe('simplePopover component', function () {
  let viewModel;
  let init;

  beforeAll(function () {
    viewModel = getComponentVM(Component);
    init = Component.prototype.init.bind({
      viewModel,
    });
  });

  describe('init() method ', function () {
    it('saves element in viewModel', ()=> {
      let element = {};
      init(element);

      expect(viewModel.element).toBeDefined();
    });
  });

  describe('show() method ', function () {
    beforeEach(function () {
      viewModel.hide();
    });

    it('opens popover', ()=> {
      viewModel.show();

      expect(viewModel.attr('open')).toBeTruthy();
    });

    it('creates event listener', ()=> {
      spyOn(document, 'addEventListener');
      viewModel.show();

      expect(document.addEventListener).toHaveBeenCalled();
    });
  });

  describe('hide() method ', function () {
    beforeEach(function () {
      viewModel.show();
    });

    it('closes popover', ()=> {
      viewModel.hide();

      expect(viewModel.attr('open')).toBeFalsy();
    });

    it('removes event listener', ()=> {
      spyOn(document, 'removeEventListener');
      viewModel.hide();

      expect(document.removeEventListener).toHaveBeenCalled();
    });
  });

  describe('toggle() method ', function () {
    it('delegates to hide', ()=> {
      viewModel.attr('open', true);
      spyOn(viewModel, 'hide');
      viewModel.toggle();

      expect(viewModel.hide).toHaveBeenCalled();
    });

    it('delegates to show', ()=> {
      viewModel.attr('open', false);
      spyOn(viewModel, 'show');
      viewModel.toggle();

      expect(viewModel.show).toHaveBeenCalled();
    });
  });
});
