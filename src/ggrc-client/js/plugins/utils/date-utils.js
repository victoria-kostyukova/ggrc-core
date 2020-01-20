/*
 Copyright (C) 2020 Google Inc.
 Licensed under http://www.apache.org/licenses/LICENSE-2.0 <see LICENSE file>
 */

import moment from 'moment';

/**
 @description
 Date formats for the actual selected value, and for the date as
 displayed to the user. The Moment.js library and the jQuery datepicker
 use different format notation, thus separate settings for each.
 IMPORTANT: The pair of settings for each "type" of value (i.e. actual
 value / display value) must be consistent across both libraries!
*/
const DATE_FORMAT = {
  MOMENT_ISO_DATE: 'YYYY-MM-DD',
  MOMENT_DISPLAY_FMT: 'MM/DD/YYYY',
  PICKER_ISO_DATE: 'yy-mm-dd',
  PICKER_DISPLAY_FMT: 'mm/dd/yy',
  ISO_SHORT: 'YYYY-MM-DDTHH:mm:ss',
  DATETIME_DISPLAY_FMT: 'MM/DD/YYYY hh:mm:ss A Z',
};

/**
 * Adjust date to the closest week day that is less than current.
 *
 * @param {Date} date - date value
 *
 * @return {Date} closest week date to provided
 */
function getClosestWeekday(date) {
  let momDate = moment(date);

  if (momDate.isoWeekday() > 5) {
    return momDate.isoWeekday(5).toDate();
  }

  return date;
}

/**
 * Convert given Date, string or null to an Date object.
 *
 * @param {Date|string|null} date - Date, string in ISO date format or null
 * @param {string} format - date format string ('YYYY-MM-DD' default value)
 * @return {string|null} - Date object or null if string is not in ISO format or null
 */
function getDate(date, format = DATE_FORMAT.MOMENT_ISO_DATE) {
  let momDate;

  if (date instanceof Date) {
    return date;
  }

  momDate = moment(date, format, true);
  if (momDate.isValid()) {
    return momDate.toDate();
  }

  return null;
}

/**
 * Convert given Date to UTC string.
 * Uses current time if Date is not passed.
 *
 * @param {Date|string} date - Date or string in ISO date format
 * @param {string} format - date format string ('YYYY-MM-DDTHH:mm:ss' default value)
 * @return {string} - formatted date string in UTC
 */
function getFormattedUtcDate(date, format = DATE_FORMAT.ISO_SHORT) {
  return moment.utc(date).format(format);
}

/**
 * Convert given UTC date string in ISO format to local date string
 * @param {string} date - UTC date string in ISO date format
 * @param {string} format - date format string ('MM/DD/YYYY hh:mm:ss A Z' default value)
 * @return {string} converted date string in local time
*/
function getFormattedLocalDate(date,
  format = DATE_FORMAT.DATETIME_DISPLAY_FMT) {
  return moment.utc(date).local().format(format);
}

function formatDate(date, hideTime) {
  let currentTimezone = moment.tz.guess();
  let formats = [
    'YYYY-MM-DD',
    'YYYY-MM-DDTHH:mm:ss',
    'YYYY-MM-DDTHH:mm:ss.SSSSSS',
  ];
  let inst;

  if ( !date ) {
    return '';
  }

  if (typeof date === 'string') {
    // string dates are assumed to be in ISO format

    if (hideTime) {
      return moment.utc(date, formats, true).format('MM/DD/YYYY');
    }
    return moment.utc(date, formats, true)
      .format('MM/DD/YYYY hh:mm:ss A Z');
  }

  inst = moment(new Date(date.isComputed ? date() : date));
  if (hideTime === true) {
    return inst.format('MM/DD/YYYY');
  }
  return inst.tz(currentTimezone).format('MM/DD/YYYY hh:mm:ss A Z');
}

export {
  DATE_FORMAT,
  getClosestWeekday,
  getDate,
  getFormattedUtcDate,
  getFormattedLocalDate,
  formatDate,
};
