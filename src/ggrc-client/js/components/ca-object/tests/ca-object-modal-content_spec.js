/*
 Copyright (C) 2020 Google Inc.
 Licensed under http://www.apache.org/licenses/LICENSE-2.0 <see LICENSE file>
*/

import canMap from 'can-map';
import Component from '../ca-object-modal-content';
import {getComponentVM} from '../../../../js_specs/spec-helpers';
import * as Utils from '../../../plugins/utils/comments-utils';

describe('ca-object-modal-content component', () => {
  let viewModel;

  beforeEach(() => {
    viewModel = getComponentVM(Component);
  });

  describe('onCommentCreated() method', () => {
    let comment;

    beforeEach(() => {
      viewModel.attr({
        instance: new canMap(),
        state: {},
        content: {
          contextScope: {
            errorsMap: {},
            validation: {},
            valueId: jasmine.createSpy(),
          },
        },
      });
      comment = new canMap();
    });

    it('call "addComment" when saveDfd resolved', (done) => {
      let saveDfd = $.Deferred();
      viewModel.attr('content.saveDfd', saveDfd);
      spyOn(viewModel, 'addComment');
      spyOn(Utils, 'getAssigneeType');

      viewModel.onCommentCreated({
        comment,
      });

      expect(viewModel.addComment).not.toHaveBeenCalled();

      saveDfd.resolve().then(() => {
        expect(viewModel.addComment).toHaveBeenCalled();
        done();
      });
    });
  });
});
