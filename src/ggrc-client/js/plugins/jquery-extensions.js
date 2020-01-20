/*
    Copyright (C) 2020 Google Inc.
    Licensed under http://www.apache.org/licenses/LICENSE-2.0 <see LICENSE file>
*/

import makeArray from 'can-util/js/make-array/make-array';
import canMap from 'can-map';
const originalViewModel = $.fn.viewModel;

$.fn.extend({
  load: function (callback) {
    $(window).on('load', callback);
  },

  // Get component's viewModel from jQuery element
  viewModel: function () {
    if (!this.length) {
      return new canMap();
    }

    return originalViewModel.apply(this, arguments);
  },

  /*
  * @function jQuery.fn.controls jQuery.fn.controls
  * @parent can-control.plugin
  * @description Get the Controls associated with elements.
  * @signature `jQuery.fn.controls([type])`
  * @param {String|can-control} [control] The type of Controls to find.
  * @return {can-control} The controls associated with the given elements.
  *
  * @body
  * When the widget is initialized, the plugin control creates an array
  * of control instance(s) with the DOM element it was initialized on using
  * [canData] helper.
  *
  * The `controls` method allows you to get the control instance(s) for any element
  * either by their type or pluginName.
  */
  controls: function () {
    let controllerNames = makeArray(arguments);
    let instances = [];
    let controls;
    // check if arguments
    this.each(function () {
      controls = $(this).data('controls');
      if (!controls) {
        return;
      }
      for (let i = 0; i < controls.length; i++) {
        let control = controls[i];
        if (!controllerNames.length) {
          instances.push(control);
        }
      }
    });
    return instances;
  },

  /*
   * @function jQuery.fn.control jQuery.fn.control
   * @parent can-control.plugin
   * @description Get the Control associated with elements.
   * @signature `jQuery.fn.control([type])`
   * @param {String|can-control} [control] The type of Control to find.
   * @return {can-control} The first control found.
   *
   * @body
   * This is the same as [jQuery.fn.controls $().controls] except that
   * it only returns the first Control found.
   */
  control: function () {
    /* eslint-disable */
    return this.controls.apply(this, arguments)[0];
  },
});
