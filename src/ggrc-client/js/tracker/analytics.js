/*
    Copyright (C) 2020 Google Inc.
    Licensed under http://www.apache.org/licenses/LICENSE-2.0 <see LICENSE file>
*/

import BaseStrategy from './base';

/**
 * The tracking ID for Google Analytics property.
 */
const TRACKING_ID = GOOGLE_ANALYTICS_ID;

/**
 * Bump this when making backwards incompatible changes to the tracking
 * implementation. This allows you to create a segment or view filter
 * that isolates only data captured with the most recent tracking changes.
 */
const BUILD_INFO = GGRC.config.VERSION;
const TRACKING_VERSION = BUILD_INFO.split(' ')[0];

/**
 * A default value for dimensions so unset values always are reported as
 * something. This is needed since Google Analytics will drop empty dimension
 * values in reports.
 */
const NULL_VALUE = '(not set)';

/**
 * A mapping between custom dimension names and their indexes.
 */
const dimensions = {
  TRACKING_VERSION: 'dimension1',
  BUILD_INFO: 'dimension2',
  CLIENT_ID: 'dimension3',
};

const createTracker = Symbol('createTracker');
const trackErrors = Symbol('trackErrors');
const trackCustomDimensions = Symbol('trackCustomDimensions');
const sendInitialPageview = Symbol('sendInitialPageview');

/**
 *
 */
export default class AnalyticsStrategy extends BaseStrategy {
  constructor() {
    super();

    // Initialize the command queue in case analytics.js hasn't loaded yet.
    window.ga = window.ga || ((...args) => (ga.q = ga.q || []).push(args));

    this[createTracker]();
    this[trackErrors]();
    this[trackCustomDimensions]();
    this[sendInitialPageview]();
  }

  timing(category, variable, label, value) {
    let data = {
      hitType: 'timing',
      timingCategory: category,
      timingVar: variable,
      timingValue: value,
    };

    if (label) {
      data.timingLabel = label;
    }

    ga('send', data);
  }

  /**
   * Tracks a JavaScript error with optional fields object overrides.
   * @param {Object} err - Error object.
   * @param {Object} fieldsObj - Overrides object.
   */
  trackError(err = {}, fieldsObj = {}) {
    ga('send', 'event', Object.assign({
      eventCategory: 'Error',
      eventAction: err.name || '(no error name)',
      eventLabel: `${err.message}\n${err.stack || '(no stack trace)'}`,
      nonInteraction: true,
    }, fieldsObj));
  }

  /**
   * Creates the trackers and sets the default transport and tracking
   * version fields.
   */
  [createTracker]() {
    ga('create', TRACKING_ID, {siteSpeedSampleRate: 100});

    // Ensures all hits are sent via `navigator.sendBeacon()`.
    ga('set', 'transport', 'beacon');
  }

  /**
   * Tracks any errors that may have occurred on the page prior to analytics being
   * initialized, then adds an event handler to track future errors.
   */
  [trackErrors]() {
    const trackErrorEvent = (event) => {
      // Use a different eventCategory for uncaught errors.
      const fieldsObj = {eventCategory: 'Uncaught Error'};

      this.trackError(event.error || event, fieldsObj);
    };

    // Add a new listener to track event immediately.
    window.addEventListener('error', trackErrorEvent);
  }

  [trackCustomDimensions]() {
    // Sets a default dimension value for all custom dimensions to ensure
    // that every dimension in every hit has *some* value. This is necessary
    // because Google Analytics will drop rows with empty dimension values
    // in reports.
    Object.keys(dimensions).forEach((key) => {
      ga('set', dimensions[key], NULL_VALUE);
    });

    // Adds tracking of dimensions known at page load time.
    ga((tracker) => {
      tracker.set({
        [dimensions.TRACKING_VERSION]: TRACKING_VERSION,
        [dimensions.BUILD_INFO]: BUILD_INFO,
        [dimensions.CLIENT_ID]: tracker.get('clientId'),
      });
    });
  }

  /**
   * Sends the initial pageview to Google Analytics.
   */
  [sendInitialPageview]() {
    ga('send', 'pageview');
  }
}
