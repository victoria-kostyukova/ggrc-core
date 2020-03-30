/*
  Copyright (C) 2020 Google Inc.
  Licensed under http://www.apache.org/licenses/LICENSE-2.0 <see LICENSE file>
*/

import loMap from 'lodash/map';
import Component from './assessment-template-clone';
import {getComponentVM} from '../../../js_specs/spec-helpers';
import * as AjaxUtils from '../../plugins/ajax-extensions';

describe('assessment-template-clone component', () => {
  let events;
  let viewModel;

  beforeAll(() => {
    events = Component.prototype.events;
  });

  beforeEach(() => {
    viewModel = getComponentVM(Component);
  });

  describe('events', () => {
    let handler;

    describe('inserted handler', () => {
      beforeEach(() => {
        spyOn(viewModel, 'onSubmit');
        handler = events.inserted.bind({viewModel});
      });

      it('calls onSubmit()', () => {
        handler();
        expect(viewModel.onSubmit).toHaveBeenCalled();
      });
    });

    describe('"{window} preload" handler', () => {
      let that;
      let ev;
      let $target;
      let spy;

      beforeEach(() => {
        $target = $('<div></div>');
        $('body').append($target);

        spy = spyOn($.fn, 'data');
        spyOn(viewModel, 'closeModal');
        that = {
          closeModal: jasmine.createSpy(),
          viewModel,
        };
        ev = {target: $target};
        handler = events['{window} preload'].bind(that);
      });

      afterEach(() => {
        $target.remove();
      });

      it('calls closeModal() if modal is in cloner', () => {
        spy.and.returnValue({
          options: {
            inCloner: true,
          },
        });
        handler({}, ev);
        expect(viewModel.closeModal).toHaveBeenCalled();
      });

      it('does not call closeModal() if modal is not in cloner', () => {
        spy.and.returnValue({
          options: {},
        });
        handler({}, ev);
        expect(viewModel.closeModal).not.toHaveBeenCalled();
      });
    });
  });

  describe('cloneObjects() method', () => {
    it('returns response of post request for clone', () => {
      viewModel.selected = [{id: 1}, {id: 2}, {id: 3}];
      viewModel.join_object_id = 321;

      const expectedArguments = [{
        sourceObjectIds: loMap(viewModel.selected, (item) => item.id),
        destination: {
          type: 'Audit',
          id: viewModel.join_object_id,
        },
      }];

      spyOn(AjaxUtils, 'ggrcPost').and.returnValue('expectedResult');

      const result = viewModel.cloneObjects();

      expect(result).toBe('expectedResult');
      expect(AjaxUtils.ggrcPost).toHaveBeenCalledWith(
        '/api/assessment_template/clone',
        expectedArguments
      );
    });
  });

  describe('cloneAsmtTempalte() method', () => {
    let dfdClone;

    beforeEach(() => {
      dfdClone = $.Deferred();
      spyOn(viewModel, 'cloneObjects').and.returnValue(dfdClone);
    });

    it('sets true to is_saving field', () => {
      viewModel.is_saving = false;

      viewModel.cloneAsmtTempalte();

      expect(viewModel.is_saving).toBe(true);
    });

    describe('after cloneObjects success', () => {
      beforeEach(() => {
        dfdClone.resolve();
        spyOn(viewModel, 'dispatch');
        spyOn(viewModel, 'closeModal');
      });

      it('sets false to is_saving field', async () => {
        viewModel.is_saving = true;

        await viewModel.cloneAsmtTempalte();

        expect(viewModel.is_saving).toBe(false);
      });

      it('calls dispatch "refreshTreeView" event', async () => {
        await viewModel.cloneAsmtTempalte();

        expect(viewModel.dispatch).toHaveBeenCalledWith('refreshTreeView');
      });

      it('calls closeModal()', async () => {
        await viewModel.cloneAsmtTempalte();

        expect(viewModel.closeModal).toHaveBeenCalled();
      });
    });

    describe('if cloneObjects was failed', () => {
      beforeEach(() => {
        dfdClone.reject();
      });

      it('sets false to is_saving field', async () => {
        viewModel.is_saving = true;

        await viewModel.cloneAsmtTempalte();

        expect(viewModel.is_saving).toBe(false);
      });
    });
  });

  describe('closeModal() method', () => {
    it('triggers click event on modal-dismiss button', () => {
      const targetElem = {
        trigger: jasmine.createSpy(),
      };
      viewModel.element = {
        find: () => targetElem,
      };

      viewModel.closeModal();

      expect(targetElem.trigger).toHaveBeenCalledWith('click');
    });
  });
});
