/*
  Copyright (C) 2020 Google Inc.
  Licensed under http://www.apache.org/licenses/LICENSE-2.0 <see LICENSE file>
*/

import Component from '../tooltip-content';
import {getComponentVM} from '../../../../js_specs/spec-helpers';

describe('tooltip-content component', () => {
  let viewModel;

  beforeEach(function () {
    viewModel = getComponentVM(Component);
  });

  describe('updateOverflow() method', () => {
    beforeEach(function () {
      viewModel.$el = $('<div><div data-trim-target="true"></div></div>');
    });

    describe('sets showTooltip flag to true if', () => {
      let fakeElement;

      beforeEach(function () {
        fakeElement = {
          offsetHeight: 0,
          scrollHeight: 0,
          offsetWidth: 0,
          scrollWidth: 0,
        };
        spyOn(viewModel.$el, 'find').and.returnValue([fakeElement]);
      });

      it('there is vertical overflow', function () {
        fakeElement.offsetHeight = 50;
        fakeElement.scrollHeight = 100;

        viewModel.updateOverflow();

        expect(viewModel.attr('showTooltip')).toBe(true);
      });

      it('there is horizontal overflow', function () {
        fakeElement.offsetWidth = 50;
        fakeElement.scrollWidth = 100;

        viewModel.updateOverflow();

        expect(viewModel.attr('showTooltip')).toBe(true);
      });
    });

    it('sets showTooltip to false, when there is no overflow', function () {
      viewModel.updateOverflow();
      expect(viewModel.attr('showTooltip')).toBe(false);
    });
  });

  describe('events scope', () => {
    let events;

    beforeAll(function () {
      events = Component.prototype.events;
    });

    describe('"inserted"() event handler', () => {
      let handler;

      beforeEach(function () {
        handler = events['inserted'].bind({viewModel});
        spyOn(viewModel, 'updateOverflow');
      });

      it('sets viewModel.$el to passed element', function () {
        const element = {};
        handler(element);
        expect(viewModel.$el).toBe(element);
      });

      it('updates overflow indicator', function () {
        handler();
        expect(viewModel.updateOverflow).toHaveBeenCalled();
      });
    });
  });
});
