/*
 Copyright (C) 2020 Google Inc.
 Licensed under http://www.apache.org/licenses/LICENSE-2.0 <see LICENSE file>
 */

import canMap from 'can-map';
import Component from '../apply-decline-proposal';
import {
  getComponentVM,
} from '../../../../js_specs/spec-helpers';
import * as Proposal from '../../../models/service-models/proposal';
import * as NotifiersUtils from '../../../plugins/utils/notifiers-utils';

describe('apply-decline-proposal component', () => {
  let viewModel;

  beforeEach(() => {
    viewModel = getComponentVM(Component);
  });

  describe('prepareDataAndSave() method', () => {
    let prepareDataAndSave;
    let fakeProposal;
    let dfdSave;
    let comment;

    beforeEach(() => {
      dfdSave = $.Deferred();
      fakeProposal = new canMap({
        save: jasmine.createSpy()
          .and.returnValue(dfdSave),
      });

      comment = 'actionComment';

      viewModel.attr('actionComment', comment);

      spyOn(Proposal, 'default').and.returnValue(fakeProposal);
      viewModel.closeModal = jasmine.createSpy();
      viewModel.refreshPage = jasmine.createSpy();

      prepareDataAndSave = viewModel.prepareDataAndSave.bind(viewModel);
    });

    it('sets value of "proposal.id" attribute from component' +
      'to "id" attribute of new proposal', () => {
      const fakeId = 123;
      dfdSave.promise();
      viewModel.attr('proposal.id', fakeId);
      fakeProposal.attr('id', null);

      prepareDataAndSave();

      expect(fakeProposal.attr('id')).toBe(fakeId);
    });

    it('calls save() method of new proposal', () => {
      dfdSave.promise();

      prepareDataAndSave();

      expect(fakeProposal.save).toHaveBeenCalled();
    });

    describe('if proposed changes has been applied', () => {
      it('sets comment to "apply_reason" attribute of new proposal', () => {
        dfdSave.promise();
        fakeProposal.attr('apply_reason', null);

        prepareDataAndSave(true);

        expect(fakeProposal.attr('apply_reason')).toBe(comment);
      });

      it('sets "applied" to "status" attribute of new proposal', () => {
        dfdSave.promise();
        fakeProposal.attr('status', null);

        prepareDataAndSave(true);

        expect(fakeProposal.attr('status')).toBe('applied');
      });
    });

    describe('if proposed changes has been declined', () => {
      it('sets comment to "decline_reason" attribute of new proposal', () => {
        dfdSave.promise();
        fakeProposal.attr('decline_reason', null);

        prepareDataAndSave(false);

        expect(fakeProposal.attr('decline_reason')).toBe(comment);
      });

      it('sets "declined" to "status" attribute of new proposal', () => {
        dfdSave.promise();
        fakeProposal.attr('status', null);

        prepareDataAndSave(false);

        expect(fakeProposal.attr('status')).toBe('declined');
      });
    });

    describe('after save() success', () => {
      beforeEach(() => {
        dfdSave.resolve();
      });

      it('calls refreshPage() method if proposed changes has been applied',
        async () => {
          await prepareDataAndSave(true);

          expect(viewModel.refreshPage).toHaveBeenCalled();
        });

      it('doesn\'t call refreshPage() method if proposed changes' +
        'has been declined', async () => {
        await prepareDataAndSave(false);

        expect(viewModel.refreshPage).not.toHaveBeenCalled();
      });

      it('sets false to "isLoading" attribute', async () => {
        viewModel.attr('isLoading', true);

        await prepareDataAndSave();

        expect(viewModel.attr('isLoading')).toBe(false);
      });

      it('calls closeModal() method', async () => {
        viewModel.attr('isLoading', true);

        await prepareDataAndSave();

        expect(viewModel.closeModal).toHaveBeenCalled();
      });
    });

    describe('if save() was failed', () => {
      let error;

      beforeEach(() => {
        spyOn(NotifiersUtils, 'notifierXHR');

        error = {
          responseJSON: {
            message: 'errorMessage',
          },
        };

        dfdSave.reject({}, error);
      });

      it('calls notifierXHR() util', async () => {
        await prepareDataAndSave();

        expect(NotifiersUtils.notifierXHR).toHaveBeenCalledWith(
          'error',
          error,
        );
      });

      it('sets false to "isLoading" attribute', async () => {
        viewModel.attr('isLoading', true);

        await prepareDataAndSave();

        expect(viewModel.attr('isLoading')).toBe(false);
      });

      it('calls closeModal() method', async () => {
        viewModel.attr('isLoading', true);

        await prepareDataAndSave();

        expect(viewModel.closeModal).toHaveBeenCalled();
      });
    });
  });
});
