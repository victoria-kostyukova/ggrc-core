/*
    Copyright (C) 2020 Google Inc.
    Licensed under http://www.apache.org/licenses/LICENSE-2.0 <see LICENSE file>
*/

import moment from 'moment';
import canStache from 'can-stache';
import canMap from 'can-map';
import canComponent from 'can-component';
import {
  inViewport,
  isInnerClick,
} from '../../plugins/ggrc-utils';
import {DATE_FORMAT} from '../../plugins/utils/date-utils';
import template from './datepicker-component.stache';

export default canComponent.extend({
  tag: 'datepicker-component',
  view: canStache(template),
  leakScope: true,
  viewModel: canMap.extend({
    format: '',
    helptext: '',
    label: '',
    placeholder: DATE_FORMAT.MOMENT_DISPLAY_FMT,
    setMinDate: null,
    setMaxDate: null,
    define: {
      date: {
        set(newDate) {
          newDate = this.validateDate(newDate);
          this.updatePicker('setDate', newDate);
          return newDate;
        },
      },
      inputDate: {
      /**
       * Set date to 'inputDate' in FTM format and to 'date' in ISO format
       * if date is valid, otherwise set null.
       * Update "minDate" if new date less than it
       * and update "maxDate" if new date more than it.
       *
       * @param {string} newDate - the new date value.
       * @return {string|null} - the new date value in FTM format.
       */
        set(newDate) {
          const ISONewDate = this.formatDate(
            newDate,
            DATE_FORMAT.MOMENT_ISO_DATE,
            DATE_FORMAT.MOMENT_DISPLAY_FMT
          );
          const FTMNewDate = this.formatDate(
            newDate,
            DATE_FORMAT.MOMENT_DISPLAY_FMT,
            DATE_FORMAT.MOMENT_DISPLAY_FMT
          );
          const minDate = this.attr('minDate');
          const maxDate = this.attr('maxDate');

          if (minDate &&
            moment.utc(ISONewDate) < moment.utc(minDate)) {
            this.attr('minDate', ISONewDate);
          }
          if (maxDate &&
            moment.utc(ISONewDate) > moment.utc(maxDate)) {
            this.attr('maxDate', ISONewDate);
          }

          this.attr('date', ISONewDate);
          return FTMNewDate;
        },
      },
      minDate: {
        set(newDate) {
          this.updatePicker('minDate', newDate);
          return newDate;
        },
      },
      maxDate: {
        set(newDate) {
          this.updatePicker('maxDate', newDate);
          return newDate;
        },
      },
      readonly: {
        type: 'boolean',
        value: false,
      },
      disabled: {
        type: 'boolean',
        value: false,
      },
      required: {
        type: 'htmlbool',
        value: false,
      },
      persistent: {
        type: 'boolean',
        value: false,
      },
      isShown: {
        type: 'boolean',
        value: false,
      },
      noWeekends: {
        type: 'boolean',
        value: false,
      },
    },

    init() {
      this.attr('inputDate',
        this.formatDate(this.attr('date'), DATE_FORMAT.MOMENT_DISPLAY_FMT)
      );
    },

    onSelect(newDate, event) {
      this.attr('date', newDate);
      this.attr('isShown', false);
    },

    onFocus(element, event) {
      this.attr('showTop', false);
      this.attr('isShown', true);

      if (!inViewport(this.picker)) {
        this.attr('showTop', true);
      }
    },

    removeValue(event) {
      event.preventDefault();

      this.attr('inputDate', null);
    },

    validateDate(date, format = DATE_FORMAT.MOMENT_ISO_DATE) {
      return moment(date, format, true).isValid() ?
        date :
        null;
    },

    formatDate(date, newFormat, currentFormat = DATE_FORMAT.MOMENT_ISO_DATE) {
      return this.validateDate(date, currentFormat) ?
        moment.utc(date, currentFormat)
          .format(newFormat) :
        null;
    },

    updatePicker(field, date) {
      const picker = this.attr('picker');
      if (!picker) {
        return;
      }

      if (field === 'setDate') {
        picker.datepicker(field, date);
        return;
      }
      picker.datepicker('option', field, date);
    },

    /**
     * Correct minDate/maxDate relative to the incoming date.
     *
     * @param {string} field - the setting to change ("minDate" or "maxDate").
     *   The value given is automatically adjusted for a day as business
     *   rules dictate.
     * @param {string|null} date - the new value of the `date`.
     *   If given as string, it must be in ISO date format.
     * @param {string} format - the format of date.
     * @return {string} - the new validated date value
     */
    correctDate(field, date, format = DATE_FORMAT.MOMENT_ISO_DATE) {
      const correctedDate = moment.utc(date, format);

      switch (field) {
        case 'minDate':
          correctedDate.add(1, 'day');
          break;
        case 'maxDate':
          correctedDate.subtract(1, 'day');
          break;
      }

      return this.formatDate(correctedDate, format);
    },
  }),

  events: {
    inserted() {
      const {viewModel} = this;
      const {noWeekends, date, setMinDate, setMaxDate} = viewModel.attr();
      const element = this.element.find('.datepicker__calendar');
      const options = {
        dateFormat: DATE_FORMAT.PICKER_ISO_DATE,
        altField: this.element.find('.datepicker__input'),
        altFormat: DATE_FORMAT.PICKER_DISPLAY_FMT,
        onSelect: viewModel.onSelect.bind(viewModel),
      };

      if (noWeekends) {
        options.beforeShowDay = $.datepicker.noWeekends;
      }

      element.datepicker(options);
      viewModel.attr('picker', element);

      viewModel.attr('date', date);
      viewModel.attr('minDate', viewModel.correctDate('minDate', setMinDate));
      viewModel.attr('maxDate', viewModel.correctDate('maxDate', setMaxDate));
    },

    '{viewModel} setMinDate'([viewModel], event, date) {
      viewModel.attr('minDate',
        viewModel.correctDate('minDate', date)
      );
    },

    '{viewModel} setMaxDate'([viewModel], event, date) {
      viewModel.attr('maxDate',
        viewModel.correctDate('maxDate', date)
      );
    },

    '{window} mousedown'(element, event) {
      const {viewModel} = this;
      if (viewModel.attr('persistent')) {
        return;
      }
      const isInside = isInnerClick(this.element, event.target);

      if (viewModel.isShown && !isInside) {
        viewModel.attr('isShown', false);
      }
    },
  },

  helpers: {
    isHidden(opts) {
      if (this.attr('isShown') || this.attr('persistent')) {
        return opts.inverse();
      }
      return opts.fn();
    },
  },
});
