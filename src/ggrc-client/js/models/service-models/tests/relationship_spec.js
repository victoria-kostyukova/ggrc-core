/*
 Copyright (C) 2020 Google Inc.
 Licensed under http://www.apache.org/licenses/LICENSE-2.0 <see LICENSE file>
 */

import * as AjaxExtensions from '../../../plugins/ajax-extensions';
import canEvent from 'can-event';
import {makeFakeInstance} from '../../../../js_specs/spec-helpers';
import Relationship from '../relationship';

describe('Relationship model', function () {
  describe('unmap() method', function () {
    let instance;

    beforeEach(function () {
      instance = makeFakeInstance({model: Relationship})({
        id: 'testId',
      });
    });

    it('sends correct request if not cascade', function () {
      spyOn(AjaxExtensions, 'ggrcAjax')
        .and.returnValue(jasmine.createSpyObj(['done']));

      instance.unmap(false);

      expect(AjaxExtensions.ggrcAjax).toHaveBeenCalledWith({
        type: 'DELETE',
        url: '/api/relationships/testId?cascade=false',
      });
    });

    it('sends correct request if cascade', function () {
      spyOn(AjaxExtensions, 'ggrcAjax')
        .and.returnValue(jasmine.createSpyObj(['done']));

      instance.unmap(true);

      expect(AjaxExtensions.ggrcAjax).toHaveBeenCalledWith({
        type: 'DELETE',
        url: '/api/relationships/testId?cascade=true',
      });
    });

    it('triggers "destroyed" event', function () {
      spyOn(AjaxExtensions, 'ggrcAjax').and.returnValue($.Deferred().resolve());
      spyOn(canEvent, 'trigger');

      instance.unmap(true);

      expect(canEvent.trigger)
        .toHaveBeenCalledWith('destroyed', instance);
    });
  });
});
