/*
 Copyright (C) 2020 Google Inc.
 Licensed under http://www.apache.org/licenses/LICENSE-2.0 <see LICENSE file>
 */

import {getComponentVM} from '../../../../js_specs/spec-helpers';
import Component from '../repeat-on-button-wrapper';

describe('repeat-on-button-wrapper component', function () {
  'use strict';

  let viewModel;

  beforeEach(function () {
    viewModel = getComponentVM(Component);
  });

  describe('setRepeatOn method', function () {
    it('should set unit and repeat_every properties', function () {
      let unit = 'Day';
      let repeatEvery = '2';

      viewModel.setRepeatOn(unit, repeatEvery);

      expect(viewModel.attr('instance.unit'))
        .toEqual(unit);
      expect(viewModel.attr('instance.repeat_every'))
        .toEqual(repeatEvery);
    });
  });

  describe('updateRepeatOn method', function () {
    let saveDfd;
    let instance;

    beforeEach(function () {
      instance = viewModel.attr('instance');
      saveDfd = $.Deferred();
      instance.save = jasmine.createSpy('save')
        .and
        .returnValue(saveDfd);
      spyOn($.prototype, 'trigger');
    });

    it('should notify when update was successful', function () {
      viewModel.updateRepeatOn();
      saveDfd.resolve();

      expect(instance.save.calls.count()).toEqual(1);
      expect($.prototype.trigger)
        .toHaveBeenCalledWith(
          'ajax:flash',
          {success: 'Repeat updated successfully'});
    });

    it('should notify when update was unsuccessful', function () {
      viewModel.updateRepeatOn();
      saveDfd.reject();

      expect(instance.save.calls.count()).toEqual(1);
      expect($.prototype.trigger)
        .toHaveBeenCalledWith(
          'ajax:flash',
          {error: 'An error occurred'});
    });
  });

  describe('onSetRepeat method', function () {
    let saveDfd;
    let instance;
    beforeEach(function () {
      instance = viewModel.attr('instance');
      saveDfd = $.Deferred();
      instance.save = jasmine.createSpy('save')
        .and
        .returnValue(saveDfd);
      spyOn($.prototype, 'trigger');
    });

    it('should update instance values when auto-save disabled',
      function () {
        let unit = 'Week';
        let repeatEvery = '22';
        viewModel.onSetRepeat(unit, repeatEvery);
        expect(instance.save.calls.count()).toEqual(0);
        expect(viewModel.attr('instance.unit'))
          .toEqual(unit);
        expect(viewModel.attr('instance.repeat_every'))
          .toEqual(repeatEvery);
      });

    it('should save instance when auto-save enabled',
      function () {
        let unit = 'Week';
        let repeatEvery = '22';
        viewModel.attr('autoSave', true);
        viewModel.onSetRepeat(unit, repeatEvery);
        saveDfd.resolve();
        expect(viewModel.attr('instance.unit'))
          .toEqual(unit);
        expect(viewModel.attr('instance.repeat_every'))
          .toEqual(repeatEvery);
        expect(instance.save.calls.count()).toEqual(1);
      });
  });
});
