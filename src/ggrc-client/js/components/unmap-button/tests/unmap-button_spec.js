/*
 Copyright (C) 2020 Google Inc.
 Licensed under http://www.apache.org/licenses/LICENSE-2.0 <see LICENSE file>
 */

import Component from '../unmap-button';
import {getComponentVM} from '../../../../js_specs/spec-helpers';

describe('unmap-button component', function () {
  'use strict';
  let events;
  let viewModel;

  beforeAll(function () {
    events = Component.prototype.events;
  });

  beforeEach(function () {
    viewModel = getComponentVM(Component);
  });

  describe('"click" event handler', function () {
    let handler;
    beforeEach(function () {
      handler = events.click;
    });

    it('calls "unmapInstance"', function () {
      spyOn(viewModel, 'unmapInstance');

      handler.call({viewModel: viewModel});

      expect(viewModel.unmapInstance).toHaveBeenCalled();
    });

    it('does not call "unmapInstance" when "preventClick" is ON', function () {
      viewModel.attr('preventClick', true);
      spyOn(viewModel, 'unmapInstance');

      handler.call({viewModel: viewModel});

      expect(viewModel.unmapInstance).not.toHaveBeenCalled();
    });
  });

  describe('unmapInstance() method', function () {
    let refreshDfd;
    beforeEach(function () {
      refreshDfd = $.Deferred();
      spyOn(viewModel, 'getMapping').and.returnValue(refreshDfd);
      spyOn(console, 'warn');
    });

    it('sets "isUnmapping" flag to true', function () {
      viewModel.attr('isUnmapping', false);

      viewModel.unmapInstance();

      expect(viewModel.attr('isUnmapping')).toBe(true);
    });

    describe('sets "isUnmapping" flag to false', function () {
      beforeEach(function () {
        viewModel.attr('isUnmapping', true);
      });

      it('when refresh() was failed', async function (done) {
        refreshDfd.reject('Server Error');
        await viewModel.unmapInstance();
        expect(viewModel.attr('isUnmapping')).toBe(false);
        expect(console.warn)
          .toHaveBeenCalledWith('Unmap failed', 'Server Error');
        done();
      });

      it('after destroy() success', async function (done) {
        refreshDfd.resolve({
          destroy: jasmine.createSpy()
            .and.returnValue($.Deferred().resolve()),
        });
        await viewModel.unmapInstance();
        expect(viewModel.attr('isUnmapping')).toBe(false);
        done();
      });

      it('when destroy() was failed', async function (done) {
        refreshDfd.resolve({
          destroy: jasmine.createSpy()
            .and.returnValue($.Deferred().reject()),
        });
        await viewModel.unmapInstance();
        expect(viewModel.attr('isUnmapping')).toBe(false);
        done();
      });
    });
  });
});
