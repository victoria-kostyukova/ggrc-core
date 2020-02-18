/*
 Copyright (C) 2020 Google Inc.
 Licensed under http://www.apache.org/licenses/LICENSE-2.0 <see LICENSE file>
 */

import * as Utils from '../../plugins/ggrc-utils';
import {DATE_FORMAT} from '../../plugins/utils/date-utils';
import {getComponentVM} from '../../../js_specs/spec-helpers';
import Component from '../datepicker/datepicker-component';


describe('datepicker component', () => {
  let events;
  let viewModel;
  let someValue;
  let expectedResult;

  beforeEach(() => {
    viewModel = getComponentVM(Component);
    viewModel.attr('date', null);
    viewModel.attr('inputDate', null);
    viewModel.attr('minDate', null);
    viewModel.attr('maxDate', null);
    viewModel.attr('setMinDate', null);
    viewModel.attr('setMaxDate', null);
    someValue = null;
    expectedResult = null;
  });

  beforeAll(() => {
    events = Component.prototype.events;
  });

  describe('viewModel', () => {
    describe('date setter', () => {
      it('should call "updatePicker" with correct params',
        () => {
          someValue = '2019-03-03';
          spyOn(viewModel, 'updatePicker');
          expectedResult = ['setDate', '2019-03-03'];

          viewModel.attr('date', someValue);

          expect(viewModel.updatePicker)
            .toHaveBeenCalledWith(...expectedResult);
        });

      it('should return date for ISO date argument',
        () => {
          someValue = '2019-03-03';
          expectedResult = '2019-03-03';

          viewModel.attr('date', someValue);

          expect(viewModel.attr('date')).toBe(expectedResult);
        });

      it('should return null for not ISO date argument',
        () => {
          someValue = '2019-03-03';
          viewModel.attr('date', '03/03/2019');

          expect(viewModel.attr('date')).toBeNull();
        });
    });

    describe('inputDate setter', () => {
      it(`should return date in FTM format
      if format of argument is FTM`, () => {
        someValue = '03/03/2019';
        expectedResult = '03/03/2019';

        viewModel.attr('inputDate', someValue);

        expect(viewModel.attr('inputDate')).toBe(expectedResult);
      });

      it(`should set date in ISO format to date
      if format of argument is FTM`, () => {
        someValue = '03/03/2019';
        expectedResult = '2019-03-03';

        viewModel.attr('inputDate', someValue);

        expect(viewModel.attr('date')).toBe(expectedResult);
      });

      it(`should update maximum allowable date
      if new date more than it`, () => {
        someValue = '03/03/2019';
        viewModel.attr('maxDate', '2019-03-02');
        viewModel.attr('inputDate', someValue);
        expectedResult = '2019-03-03';

        expect(viewModel.attr('maxDate')).toBe(expectedResult);
      });

      it(`should update minimum allowable date
      if new date less than it`, () => {
        someValue = '03/03/2019';
        viewModel.attr('minDate', '2019-03-04');
        viewModel.attr('inputDate', someValue);
        expectedResult = '2019-03-03';

        expect(viewModel.attr('minDate')).toBe(expectedResult);
      });

      it(`should return null
      if format of argument is not FTM`, () => {
        someValue = '2019-03-03';
        viewModel.attr('inputDate', someValue);

        expect(viewModel.attr('inputDate')).toBeNull();
      });

      it(`should set null to date
      if format of argument is not FTM`, () => {
        someValue = '2019-03-03';
        viewModel.attr('inputDate', someValue);

        expect(viewModel.attr('date')).toBeNull();
      });
    });

    describe('minDate setter', () => {
      it('should return date in ISO format',
        () => {
          someValue = '2019-03-03';
          expectedResult = '2019-03-03';

          viewModel.attr('minDate', someValue);

          expect(viewModel.attr('minDate')).toBe(expectedResult);
        });

      it('should call "updatePicker" method with correct params',
        () => {
          someValue = '2019-03-03';
          spyOn(viewModel, 'updatePicker');
          expectedResult = ['minDate', '2019-03-03'];

          viewModel.attr('minDate', someValue);

          expect(viewModel.updatePicker)
            .toHaveBeenCalledWith(...expectedResult);
        });
    });

    describe('maxDate setter', () => {
      it('should return date in ISO format',
        () => {
          someValue = '2019-03-03';
          expectedResult = '2019-03-03';

          viewModel.attr('maxDate', someValue);

          expect(viewModel.attr('maxDate')).toBe(expectedResult);
        });

      it('should call "updatePicker" method with correct params',
        () => {
          someValue = '2019-03-03';
          spyOn(viewModel, 'updatePicker');
          expectedResult = ['maxDate', '2019-03-03'];

          viewModel.attr('maxDate', someValue);

          expect(viewModel.updatePicker)
            .toHaveBeenCalledWith(...expectedResult);
        });
    });

    describe('init() method', () => {
      it(`should set initial value of inputDate
        from date in FMT format`, () => {
        someValue = '2019-03-03';
        viewModel.attr('date', someValue);
        expectedResult = '03/03/2019';

        viewModel.init();

        expect(viewModel.attr('inputDate')).toBe(expectedResult);
      });
    });

    describe('onSelect() method', () => {
      it('sets new date', () => {
        someValue = '2019-03-03';
        viewModel.attr('date', someValue);
        expectedResult = '2019-04-04';

        viewModel.onSelect('2019-04-04');

        expect(viewModel.attr('date')).toBe(expectedResult);
      });

      it('sets false to isShown attribute', () => {
        viewModel.attr('isShown', true);
        viewModel.onSelect();
        expectedResult = false;

        expect(viewModel.attr('isShown')).toBe(expectedResult);
      });
    });

    describe('onFocus() method', () => {
      it('sets false to showTop attribute', () => {
        spyOn(Utils, 'inViewport')
          .and.returnValue(true);
        viewModel.attr('showTop', true);
        viewModel.onFocus();
        expectedResult = false;

        expect(viewModel.attr('showTop')).toBe(expectedResult);
      });

      it('sets true to isShown attribute', () => {
        spyOn(Utils, 'inViewport')
          .and.returnValue(true);
        viewModel.attr('isShown', false);
        viewModel.onFocus();
        expectedResult = true;

        expect(viewModel.attr('isShown')).toBe(expectedResult);
      });

      it('does not set true to showTop attribute if picker is in viewport',
        () => {
          spyOn(Utils, 'inViewport')
            .and.returnValue(true);
          viewModel.onFocus();
          expectedResult = false;

          expect(viewModel.attr('showTop')).toBe(expectedResult);
        });

      it('sets true to showTop attribute if picker is not in viewport',
        () => {
          spyOn(Utils, 'inViewport').and.returnValue(false);
          viewModel.onFocus();
          expectedResult = true;

          expect(viewModel.attr('showTop')).toBe(expectedResult);
        });
    });

    describe('removeValue() method', () => {
      let event;

      beforeEach(() => {
        event = {
          preventDefault: jasmine.createSpy(),
        };
      });

      it('should cancel default action', () => {
        viewModel.removeValue(event);

        expect(event.preventDefault)
          .toHaveBeenCalled();
      });

      it('should set null to "inputDate"', () => {
        someValue = '2019-03-03';
        viewModel.attr('inputDate', someValue);

        viewModel.removeValue(event);

        expect(viewModel.attr('inputDate'))
          .toBeNull();
      });
    });

    describe('validateDate() method', () => {
      it('should return date if ISO date is valid', () => {
        expectedResult = '2011-11-11';

        expect(viewModel.validateDate('2011-11-11')).toBe(expectedResult);
      });

      it('should return date if FTM date is valid', () => {
        expectedResult = '02/02/2018';

        expect(
          viewModel.validateDate('02/02/2018', DATE_FORMAT.MOMENT_DISPLAY_FMT)
        ).toEqual(expectedResult);
      });

      it('should return null if date is invalid', () => {
        expect(viewModel.validateDate(null)).toBeNull();
        expect(viewModel.validateDate('')).toBeNull();
        expect(viewModel.validateDate('2011-33-01')).toBeNull();
        expect(viewModel.validateDate(
          '11/12/2017',
          DATE_FORMAT.MOMENT_ISO_DATE
        )).toBeNull();
      });
    });

    describe('formatDate() method', () => {
      it('should return date in FTM format', () => {
        someValue = '2019-03-03';
        expectedResult = '03/03/2019';

        expect(viewModel.formatDate(someValue, DATE_FORMAT.MOMENT_DISPLAY_FMT))
          .toBe(expectedResult);
      });

      it('should return date in ISO format', () => {
        someValue = '03/03/2019';
        expectedResult = '2019-03-03';

        expect(viewModel.formatDate(
          someValue,
          DATE_FORMAT.MOMENT_ISO_DATE,
          DATE_FORMAT.MOMENT_DISPLAY_FMT
        )).toBe(expectedResult);
      });

      it('should return null for invalid date', () => {
        someValue = '2019-03-03';
        expect(viewModel.formatDate(
          someValue,
          DATE_FORMAT.MOMENT_ISO_DATE,
          DATE_FORMAT.MOMENT_DISPLAY_FMT
        )).toBeNull();

        expect(viewModel.formatDate(
          '03/03/2019',
          DATE_FORMAT.MOMENT_DISPLAY_FMT
        )).toBeNull();

        expect(viewModel.formatDate(null, DATE_FORMAT.MOMENT_DISPLAY_FMT))
          .toBeNull();
      });
    });

    describe('updatePicker() method', () => {
      it(`should call "datepicker" method with correct params for "setDate"
      if picker is initialized`,
      () => {
        someValue = '2019-03-03';
        const picker = {datepicker: jasmine.createSpy()};
        viewModel.attr('picker', picker);
        expectedResult = ['setDate', '2019-03-03'];
        const unexpectedResult = ['option', 'setDate', '2019-03-03'];

        viewModel.updatePicker('setDate', someValue);

        expect(viewModel.picker.datepicker)
          .toHaveBeenCalledWith(...expectedResult);
        expect(viewModel.picker.datepicker)
          .not
          .toHaveBeenCalledWith(...unexpectedResult);
      });

      it(`should call "datepicker" method with correct params for "minDate"
      if picker is initialized`,
      () => {
        someValue = '2019-03-03';
        const picker = {datepicker: jasmine.createSpy()};
        viewModel.attr('picker', picker);
        expectedResult = ['option', 'minDate', '2019-03-03'];
        const unexpectedResult = ['minDate', '2019-03-03'];

        viewModel.updatePicker('minDate', someValue);

        expect(viewModel.picker.datepicker)
          .toHaveBeenCalledWith(...expectedResult);
        expect(viewModel.picker.datepicker)
          .not
          .toHaveBeenCalledWith(...unexpectedResult);
      });
    });

    describe('correctDate() method', () => {
      it('should return date increased by one day for "minDate"', () => {
        someValue = '2019-03-03';
        expectedResult = '2019-03-04';

        expect(viewModel.correctDate('minDate', someValue))
          .toBe(expectedResult);
      });

      it('should return the date reduced by one day for "maxDate"', () => {
        someValue = '2019-03-03';
        expectedResult = '2019-03-02';

        expect(viewModel.correctDate('maxDate', someValue))
          .toBe(expectedResult);
      });

      it('should return null if date is invalid', () => {
        expect(viewModel.correctDate('minDate', null)).toBeNull();
        expect(viewModel.correctDate('maxDate', '2011-33-01')).toBeNull();
      });
    });
  });

  describe('events', () => {
    let method;
    let that;

    beforeEach(() => {
      that = {
        viewModel,
      };
    });

    describe('inserted() method', () => {
      let altField;
      let element;

      beforeEach(() => {
        viewModel.updatePicker = jasmine.createSpy();
        viewModel.onSelect.bind = jasmine.createSpy()
          .and.returnValue('mockOnSelect');
        element = $('<div class="datepicker__calendar"></div>');
        altField = $('<div class="datepicker__input"></div>');
        $('body').append(element);
        $('body').append(altField);
        that.element = $('body');
        method = events.inserted.bind(that);
      });

      afterEach(() => {
        $('body').html('');
      });

      it('create datepicker in specified format', () => {
        method();
        expect(element.datepicker('option', 'dateFormat'))
          .toBe(DATE_FORMAT.PICKER_ISO_DATE);
        expect(element.datepicker('option', 'altField')[0])
          .toBe(altField[0]);
        expect(element.datepicker('option', 'altFormat'))
          .toBe(DATE_FORMAT.PICKER_DISPLAY_FMT);
      });

      it('sets new datepicker to picker of viewModel', () => {
        method();
        expect(viewModel.attr('picker')[0]).toBe(element[0]);
      });

      it('should set minDate corrected value from setMinDate',
        () => {
          someValue = '2019-03-03';
          viewModel.attr('setMinDate', someValue);
          expectedResult = '2019-03-04';

          method();

          expect(viewModel.minDate).toBe(expectedResult);
        });

      it('should set maxDate corrected value from setMaxDate',
        () => {
          someValue = '2019-03-03';
          viewModel.attr('setMaxDate', someValue);
          expectedResult = '2019-03-02';

          method();

          expect(viewModel.maxDate).toBe(expectedResult);
        });
    });

    describe('"{window} mousedown" handler', () => {
      beforeEach(() => {
        method = events['{window} mousedown'].bind(that);
      });

      it('sets isShown to false if datepicker is shown' +
      ' and click was outside the datepicker', () => {
        viewModel.attr('isShown', true);
        spyOn(Utils, 'isInnerClick').and.returnValue(false);
        expectedResult = false;

        method({}, {});

        expect(viewModel.attr('isShown')).toBe(expectedResult);
      });

      it('does nothing if datepicker is persistent', () => {
        viewModel.attr('persistent', true);
        viewModel.attr('isShown', true);
        expectedResult = true;

        method({}, {});

        expect(viewModel.attr('isShown')).toBe(expectedResult);
      });

      it('does nothing if click was inside the datepicker', () => {
        viewModel.attr('persistent', false);
        viewModel.attr('isShown', true);
        spyOn(Utils, 'isInnerClick').and.returnValue(true);
        expectedResult = true;

        method({}, {});

        expect(viewModel.attr('isShown')).toBe(expectedResult);
      });
    });
  });
});
