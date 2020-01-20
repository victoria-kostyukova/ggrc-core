/*
 Copyright (C) 2020 Google Inc.
 Licensed under http://www.apache.org/licenses/LICENSE-2.0 <see LICENSE file>
 */

import makeArray from 'can-util/js/make-array/make-array';
import {getComponentVM} from '../../../../js_specs/spec-helpers';
import Component from '../repeat-on-button';

describe('repeat-on-button component', function () {
  'use strict';

  let viewModel;
  let events;
  let getTitle = function (option) {
    return option.title;
  };

  beforeAll(function () {
    events = Component.prototype.events;
  });

  beforeEach(function () {
    viewModel = getComponentVM(Component);
  });

  describe('buttonText getter', function () {
    it('returns Off-indication when no unit was selected', function () {
      let result = viewModel.attr('buttonText');

      expect(result).toEqual('Repeat Off');
    });

    it('returns on-indication when unit was selected', function () {
      let result;
      viewModel.attr('unit', 'day');

      result = viewModel.attr('buttonText');

      expect(result).toEqual('Repeat On');
    });
  });

  describe('modalTitle getter', function () {
    it('returns Off-indication when repeat was disabled', function () {
      let result = viewModel.attr('modalTitle');

      expect(result).toEqual('Repeat Off');
    });

    it('returns on-indication when repeat was enabled', function () {
      let result;
      viewModel.attr('repeatEnabled', true);

      result = viewModel.attr('modalTitle');

      expect(result).toEqual('Repeat On');
    });
  });

  describe('updateRepeatEveryOptions method', function () {
    let repeatOptions = [
      {
        value: 1,
        title: '1',
      },
      {
        value: 2,
        title: '2',
      }];
    let unitOptions = [
      {title: 'Daily', value: 'day', plural: 'days', singular: 'day'},
      {title: 'Weekly', value: 'week', plural: 'weeks', singular: 'week'},
      {title: 'Monthly', value: 'month', plural: 'months', singular: 'month'},
    ];

    beforeEach(function () {
      viewModel.attr('repeatOptions', repeatOptions);
      viewModel.attr('unitOptions', unitOptions);
    });

    it('should not update options when unit was not selected',
      function () {
        let actualTitles;
        let expectedTitles = repeatOptions.map(getTitle);

        viewModel.updateRepeatEveryOptions();

        actualTitles = makeArray(viewModel.attr('repeatOptions'))
          .map(getTitle);
        expect(actualTitles).toEqual(expectedTitles);
      });

    it('should update options when unit was not selected',
      function () {
        let actualTitles;
        let expectedTitles = ['1 week', '2 weeks'];
        viewModel.attr('state.result.unit', 'week');

        viewModel.updateRepeatEveryOptions();

        actualTitles = makeArray(viewModel.attr('repeatOptions'))
          .map(getTitle);
        expect(actualTitles).toEqual(expectedTitles);
      });
  });

  describe('initSelectedOptions method', function () {
    it('should initialize values from injected properties',
      function () {
        let unit = 'day';
        let repeatEvery = '2';
        viewModel.attr('unit', unit);
        viewModel.attr('repeatEvery', repeatEvery);

        viewModel.initSelectedOptions();

        expect(viewModel.attr('state.result.unit')).toEqual(unit);
        expect(viewModel.attr('state.result.repeatEvery')).toEqual(repeatEvery);
        expect(viewModel.attr('repeatEnabled')).toBeTruthy();
      });
  });

  describe('init method', function () {
    it('should initialize values from injected properties',
      function () {
        let unit = 'day';
        let repeatEvery = '2';
        viewModel.attr('unit', unit);
        viewModel.attr('repeatEvery', repeatEvery);

        viewModel.init();

        expect(viewModel.attr('state.result.unit')).toEqual(unit);
        expect(viewModel.attr('state.result.repeatEvery')).toEqual(repeatEvery);
        expect(viewModel.attr('repeatEnabled')).toBeTruthy();
      });
  });

  describe('save method', function () {
    let saveDfd;
    beforeEach(function () {
      saveDfd = $.Deferred();
      viewModel.attr('onSaveRepeat', function () {
        return saveDfd;
      });
    });

    it('should notify with selected values when repeat is enabled',
      function (done) {
        let unit = 'day';
        let repeatEvery = '2';
        viewModel.attr('state.result.unit', unit);
        viewModel.attr('state.result.repeatEvery', repeatEvery);
        viewModel.attr('repeatEnabled', true);

        let saveChain = viewModel.save();

        expect(viewModel.attr('isSaving')).toBeTruthy();

        saveDfd.resolve().then(() => {
          saveChain.then(() => {
            expect(viewModel.attr('isSaving')).toBeFalsy();
            expect(viewModel.attr('state.open')).toBeFalsy();
            done();
          });
        });
      });

    it('should notify with empty values when repeat is disabled',
      function (done) {
        let saveChain = viewModel.save();

        expect(viewModel.attr('isSaving')).toBeTruthy();

        saveDfd.resolve().then(() => {
          saveChain.then(() => {
            expect(viewModel.attr('isSaving')).toBeFalsy();
            expect(viewModel.attr('state.open')).toBeFalsy();
            done();
          });
        });
      });
  });

  describe('unit update event', function () {
    let unitChanged;
    let context;
    let repeatOptions = [
      {
        value: 1,
        title: '1',
      },
      {
        value: 2,
        title: '2',
      }];

    beforeAll(function () {
      unitChanged = events['{state.result} unit'];
      viewModel.attr('repeatOptions', repeatOptions);
      context = {
        viewModel: viewModel,
      };
    });

    it('should update repeat options when unit changed',
      function () {
        let actualTitles;
        let expectedTitles = ['1 weekday', '2 weekdays'];
        context.viewModel.attr('state.result.unit', 'day');

        unitChanged.apply(context);

        actualTitles = makeArray(context.viewModel.attr('repeatOptions'))
          .map(getTitle);
        expect(actualTitles).toEqual(expectedTitles);
      });
  });

  describe('open update event', function () {
    let openChanged;
    let context;

    beforeAll(function () {
      openChanged = events['{state} open'];
      context = {
        viewModel: viewModel,
      };
    });

    it('should set saved values for options when modal with unit opens',
      function () {
        let unit = 'day';
        let repeatEvery = '2';
        context.viewModel.attr('state.open', true);
        context.viewModel.attr('unit', unit);
        context.viewModel.attr('repeatEvery', repeatEvery);
        openChanged.apply(context);

        expect(context.viewModel.attr('state.result.unit'))
          .toEqual(unit);
        expect(context.viewModel.attr('state.result.repeatEvery'))
          .toEqual(repeatEvery);
        expect(context.viewModel.attr('repeatEnabled'))
          .toBeTruthy();
      });

    it('should set default values for options when modal without unit opens',
      function () {
        context.viewModel.attr('state.open', true);
        context.viewModel.attr('unit', null);
        context.viewModel.attr('repeatEvery', 0);

        openChanged.apply(context);

        expect(context.viewModel.attr('state.result.unit')).toEqual('month');
        expect(context.viewModel.attr('state.result.repeatEvery')).toEqual(1);
      });
  });
});
