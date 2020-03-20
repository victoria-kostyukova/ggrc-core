/*
  Copyright (C) 2020 Google Inc.
  Licensed under http://www.apache.org/licenses/LICENSE-2.0 <see LICENSE file>
*/

import canMap from 'can-map';
import Component from '../unarchive-link';
import {getComponentVM} from '../../../js_specs/spec-helpers';

describe('unarchive-link component', () => {
  let viewModel;

  beforeEach(() => {
    viewModel = getComponentVM(Component);
  });

  describe('unarchive() method', () => {
    beforeEach(() => {
      viewModel.attr('instance', new canMap({
        display_name: () => 'fake_instance',
        save: jasmine.createSpy(),
      }));
    });

    describe('if instance is archived', () => {
      let event;

      beforeEach(() => {
        viewModel.attr('instance.archived', true);
        event = {
          preventDefault: jasmine.createSpy(),
        };
      });

      it('sets false to instance.archived attribute', () => {
        viewModel.attr('instance.save')
          .and.returnValue(new Promise(() => {}));

        viewModel.unarchive(event);

        expect(viewModel.attr('instance.archived')).toBe(false);
      });

      it('calls instance\'s save() method', () => {
        viewModel.attr('instance.save')
          .and.returnValue(new Promise(() => {}));

        viewModel.unarchive(event);

        expect(viewModel.attr('instance.save')).toHaveBeenCalled();
      });

      it('trigger ajax:flash after instance.save() success', async () => {
        viewModel.attr('instance.save')
          .and.returnValue(Promise.resolve());
        viewModel.attr('notify', 'success');
        spyOn($.fn, 'trigger').and.callThrough();

        await viewModel.unarchive(event);

        expect($.fn.trigger).toHaveBeenCalledWith('ajax:flash',
          {success: ['fake_instance was unarchived successfully']});
      });
    });
  });
});
