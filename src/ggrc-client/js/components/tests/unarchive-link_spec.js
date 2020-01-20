/*
  Copyright (C) 2020 Google Inc.
  Licensed under http://www.apache.org/licenses/LICENSE-2.0 <see LICENSE file>
*/

import canMap from 'can-map';
import Component from '../unarchive-link';

describe('unarchive-link component', function () {
  describe('click() event', function () {
    let displayName = 'DISPLAY NAME';
    let notifyText = 'was unarchived successfully';
    let eventObj;
    let instance;
    let pendingSave;
    let viewModel;
    let $element;
    let event;

    beforeEach(function () {
      pendingSave = new $.Deferred();

      instance = new canMap({
        save: jasmine.createSpy('save')
          .and.returnValue(pendingSave.promise()),
        display_name: function () {
          return displayName;
        },
      });

      viewModel = new canMap({
        instance: instance,
        notifyText: notifyText,
      });
      eventObj = $.Event();
      $element = $('<div></div>');

      spyOn($.fn, 'trigger').and.callThrough();

      event = Component.prototype.events['a click']
        .bind({viewModel});
    });

    it('instance was not unarchived if was not archived', function () {
      event($element, eventObj);

      expect(instance.attr('archived')).toBeFalsy();
      expect(instance.save).not.toHaveBeenCalled();
      expect($.fn.trigger).not.toHaveBeenCalled();
    });

    it('instance was saved without notification', function (done) {
      instance.attr('archived', true);

      event($element, eventObj);
      pendingSave.resolve().then(() => {
        expect(instance.attr('archived')).toBeFalsy();
        expect(instance.save).toHaveBeenCalled();
        expect($.fn.trigger).not.toHaveBeenCalled();
        done();
      });
    });

    it('instance was saved without notification', function (done) {
      let successMessage = displayName + ' ' + notifyText;
      instance.attr('archived', true);
      viewModel.attr('notify', true);

      event($element, eventObj);
      pendingSave.resolve().then(() => {
        expect(instance.attr('archived')).toBeFalsy();
        expect(instance.save).toHaveBeenCalled();
        expect($.fn.trigger).toHaveBeenCalledWith('ajax:flash',
          {success: [successMessage]});
        done();
      });
    });
  });
});
