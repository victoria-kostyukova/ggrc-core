/*
  Copyright (C) 2020 Google Inc.
  Licensed under http://www.apache.org/licenses/LICENSE-2.0 <see LICENSE file>
*/

import {trackStatus} from '../../utils/background-task-utils';
import * as AjaxExtensions from '../../../plugins/ajax-extensions';
import * as ErrorsUtils from '../../../plugins/utils/errors-utils';


describe('background-task-utils', () => {
  describe('trackStatus() function', () => {
    let url;
    let onSuccessHandler;
    let onFailureHandler;
    let defaultTimeout;

    beforeEach(() => {
      url = 'fakeUrl';
      onSuccessHandler = jasmine.createSpy();
      onFailureHandler = jasmine.createSpy();
      defaultTimeout = 2000;
      jasmine.clock().install();
    });

    afterEach(() => {
      jasmine.clock().uninstall();
    });

    it('calls ggrcAjax() with specified params', () => {
      spyOn(AjaxExtensions, 'ggrcAjax')
        .and.returnValue($.Deferred());

      trackStatus(url, onSuccessHandler, onFailureHandler);
      jasmine.clock().tick(defaultTimeout + 1);

      expect(AjaxExtensions.ggrcAjax).toHaveBeenCalledWith({
        method: 'GET',
        url: 'fakeUrl',
        cache: false,
      });
    });

    it('does not call ggrcAjax()', () => {
      spyOn(AjaxExtensions, 'ggrcAjax')
        .and.returnValue($.Deferred());

      trackStatus(url, onSuccessHandler, onFailureHandler);
      jasmine.clock().tick(defaultTimeout - 1);

      expect(AjaxExtensions.ggrcAjax).not.toHaveBeenCalled();
    });

    it('calls onSuccessHandler() if ggrcAjax returns "Success" status', () => {
      spyOn(AjaxExtensions, 'ggrcAjax')
        .and.returnValue($.Deferred().resolve({
          background_task: {
            status: 'Success',
          },
        }));

      trackStatus(url, onSuccessHandler, onFailureHandler);
      jasmine.clock().tick(defaultTimeout + 1);

      expect(onSuccessHandler).toHaveBeenCalledWith();
    });

    it('calls onSuccessHandler() if ggrcAjax returns "Failure" status', () => {
      spyOn(AjaxExtensions, 'ggrcAjax')
        .and.returnValue($.Deferred().resolve({
          background_task: {
            status: 'Failure',
          },
        }));

      trackStatus(url, onSuccessHandler, onFailureHandler);
      jasmine.clock().tick(defaultTimeout + 1);

      expect(onFailureHandler).toHaveBeenCalledWith();
    });

    it('calls handleAjaxError with specified params ' +
    'if ggrcAjax is rejected', () => {
      spyOn(ErrorsUtils, 'handleAjaxError');
      spyOn(AjaxExtensions, 'ggrcAjax')
        .and.returnValue($.Deferred()
          .reject('fakeJqxhr', 'fakeStatus', 'fakeError')
        );

      trackStatus(url, onSuccessHandler, onFailureHandler);
      jasmine.clock().tick(defaultTimeout + 1);

      expect(ErrorsUtils.handleAjaxError)
        .toHaveBeenCalledWith('fakeJqxhr', 'fakeError');
    });
  });
});
