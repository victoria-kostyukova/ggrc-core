/*
 Copyright (C) 2020 Google Inc.
 Licensed under http://www.apache.org/licenses/LICENSE-2.0 <see LICENSE file>
 */
import {getComponentVM} from '../../../../js_specs/spec-helpers';
import Component from '../external-data-provider';
import * as NotifiersUtils from '../../../plugins/utils/notifiers-utils';
import * as AjaxUtils from '../../../plugins/ajax-extensions';

describe('external-data-provider component', () => {
  let viewModel;
  let events;
  beforeEach(() => {
    viewModel = getComponentVM(Component);
    events = Component.prototype.events;
  });

  describe('init() method', () => {
    let method;
    beforeEach(() => {
      method = Component.prototype.init.bind({viewModel});
    });

    it('loads data', () => {
      spyOn(viewModel, 'loadData');

      method();

      expect(viewModel.loadData).toHaveBeenCalled();
    });
  });

  describe('viewModel', () => {
    describe('loadData() method', () => {
      let originalConfig;
      let requestDfd;
      let $getSpy;
      beforeAll(() => originalConfig = GGRC.config);
      afterAll(() => GGRC.config = originalConfig);
      beforeEach(() => {
        GGRC.config = {
          external_services: {
            Person: 'testUrl',
          },
        };
        requestDfd = $.Deferred();
        $getSpy = spyOn(AjaxUtils, 'ggrcGet');
        $getSpy.and.returnValue(requestDfd);
      });

      it('turns on "loading" flag', () => {
        viewModel.loading = false;

        viewModel.loadData();

        expect(viewModel.loading).toBe(true);
      });

      it('increases request number', () => {
        viewModel.currentRequest = 0;

        viewModel.loadData();

        expect(viewModel.currentRequest).toBe(1);
      });

      it('send correct request', () => {
        viewModel.searchCriteria = 'someText';
        viewModel.type = 'Person';

        viewModel.loadData();

        expect(AjaxUtils.ggrcGet).toHaveBeenCalledWith(
          'testUrl',
          {
            prefix: 'someText',
          },
        );
      });

      it('sets response to "values" property', (done) => {
        let testResponse = ['res1', 'res2'];
        viewModel.values = null;

        viewModel.loadData();

        requestDfd.resolve(testResponse).then(() => {
          expect(viewModel.values.serialize()).toEqual(testResponse);
          done();
        });
      });

      it('shows message if there was error', (done) => {
        spyOn(NotifiersUtils, 'notifier');
        viewModel.type = 'TestModel';

        viewModel.loadData();

        requestDfd.reject().always(() => {
          expect(NotifiersUtils.notifier)
            .toHaveBeenCalledWith('error', 'Unable to load TestModels');
          done();
        });
      });

      describe('turns off "loading" flag', () => {
        beforeEach(() => {
          spyOn(NotifiersUtils, 'notifier');
          viewModel.loading = true;
          viewModel.loadData();
        });

        it('when there was success', (done) => {
          requestDfd.resolve().always(() => {
            expect(viewModel.loading).toBe(false);
            done();
          });
        });

        it('when there was error', (done) => {
          requestDfd.reject().always(() => {
            expect(viewModel.loading).toBe(false);
            done();
          });
        });
      });

      it('processes callbacks only for latest request', (done) => {
        let request1 = $.Deferred();
        let response1 = ['res1'];
        let request2 = $.Deferred();
        let response2 = ['res2'];

        $getSpy.and.returnValue(request1);
        viewModel.loadData();
        $getSpy.and.returnValue(request2);
        viewModel.loadData();

        request2.resolve(response2);
        request1.resolve(response1);

        $.when(request1, request2).then(() => {
          expect(viewModel.values.serialize()).toEqual(response2);
          done();
        });
      });
    });
  });

  describe('events', () => {
    describe('"{viewModel} searchCriteria" handler', () => {
      let handler;
      beforeEach(() => {
        handler = events['{viewModel} searchCriteria'].bind({viewModel});
      });

      it('loads data', () => {
        spyOn(viewModel, 'loadData');

        handler();

        expect(viewModel.loadData).toHaveBeenCalled();
      });
    });
  });
});
