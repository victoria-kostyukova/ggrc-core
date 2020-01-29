/*
 Copyright (C) 2020 Google Inc.
 Licensed under http://www.apache.org/licenses/LICENSE-2.0 <see LICENSE file>
 */

import Component from '../evidence-item';
import {getComponentVM, makeFakeInstance} from '../../../../js_specs/spec-helpers';
import Evidence from '../../../models/business-models/evidence';
import * as notifierUtils from '../../../plugins/utils/notifiers-utils';

const getFakeEvidence = () => {
  return makeFakeInstance({model: Evidence})({
    id: 1,
    type: 'Evidence',
  });
};

describe('evidence-item component', () => {
  let viewModel;

  beforeEach(() => {
    viewModel = getComponentVM(Component);
  });

  describe('updateItem() method', () => {
    let method;
    beforeEach(() => {
      const evidence = getFakeEvidence();

      viewModel.attr('evidence', evidence);
      method = viewModel.updateItem.bind(viewModel);

      spyOn(notifierUtils, 'notifier');
    });

    it('should set "isLoading" to true before save evidence', () => {
      spyOn(Evidence, 'findOne').and.returnValue(Promise.reject());
      viewModel.attr('isLoading', false);

      method();
      expect(viewModel.attr('isLoading')).toBe(true);
    });

    describe('when "findOne()" is failed', () => {
      beforeEach(() => {
        spyOn(Evidence, 'findOne').and.returnValue(Promise.reject());
      });

      it('should call "notifier"', async () => {
        await method();
        expect(notifierUtils.notifier)
          .toHaveBeenCalledWith('error', 'Unable to update.');
      });

      it('should set "isLoading" to false', async () => {
        viewModel.attr('isLoading', true);
        await method();
        expect(viewModel.attr('isLoading')).toBe(false);
      });

      it('should not change "notes" attribute', async () => {
        viewModel.attr('evidence.notes', 'oldValue');
        await method('newValue');
        expect(viewModel.attr('evidence.notes')).toEqual('oldValue');
      });
    });

    describe('when "save()" is failed', () => {
      beforeEach(() => {
        const evidenceInstance = getFakeEvidence();
        spyOn(Evidence, 'findOne').and
          .returnValue(Promise.resolve(evidenceInstance));

        evidenceInstance.save = jasmine.createSpy()
          .and.returnValue(Promise.reject());
      });

      it('should call "notifier"', async () => {
        await method();
        expect(notifierUtils.notifier)
          .toHaveBeenCalledWith('error', 'Unable to update.');
      });

      it('should set "isLoading" to false', async () => {
        viewModel.attr('isLoading', true);
        await method();
        expect(viewModel.attr('isLoading')).toBe(false);
      });
    });

    describe('when "findOne()" is successful', () => {
      let evidenceInstance;

      beforeEach(() => {
        evidenceInstance = getFakeEvidence();
        spyOn(Evidence, 'findOne').and
          .returnValue(Promise.resolve(evidenceInstance));

        spyOn(evidenceInstance, 'save').and.returnValue(Promise.resolve());
      });

      it('should set new value to "evidenceInstance.notes" attr', async () => {
        const expectedNotes = 'hello world!';
        await method(expectedNotes);
        expect(evidenceInstance.attr('notes')).toEqual(expectedNotes);
      });
    });

    describe('when "save()" is successful', () => {
      beforeEach(() => {
        const evidenceInstance = getFakeEvidence();
        spyOn(Evidence, 'findOne').and
          .returnValue(Promise.resolve(evidenceInstance));

        spyOn(evidenceInstance, 'save').and.returnValue(Promise.resolve());
      });

      it('should set "isLoading" to false', async () => {
        viewModel.attr('isLoading', true);
        await method();
        expect(viewModel.attr('isLoading')).toBe(false);
      });
    });
  });
});
