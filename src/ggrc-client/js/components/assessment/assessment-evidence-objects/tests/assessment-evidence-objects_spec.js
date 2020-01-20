/*
  Copyright (C) 2020 Google Inc.
  Licensed under http://www.apache.org/licenses/LICENSE-2.0 <see LICENSE file>
*/

import Component from '../assessment-evidence-objects';
import {getComponentVM} from '../../../../../js_specs/spec-helpers';
import * as QueryApiUtils from '../../../../plugins/utils/query-api-utils';
import {CUSTOM_ATTRIBUTE_TYPE} from '../../../../plugins/utils/custom-attribute/custom-attribute-config';

describe('assessment-evidence-objects component', () => {
  let viewModel;

  beforeEach(() => {
    viewModel = getComponentVM(Component);
  });

  describe('loadEvidences() method', () => {
    it('calls buildParam method with specified params', () => {
      const filters = {
        expression: {
          left: {
            left: 'kind',
            op: {
              name: 'IN',
            },
            right: ['URL', 'FILE'],
          },
          op: {
            name: 'AND',
          },
          right: {
            object_name: 'Assessment',
            op: {
              name: 'relevant',
            },
            ids: [123],
          },
        },
      };
      viewModel.attr('instance', {id: 123});
      spyOn(QueryApiUtils, 'buildParam');

      viewModel.loadEvidences();

      expect(QueryApiUtils.buildParam)
        .toHaveBeenCalledWith(
          'Evidence',
          {},
          null,
          [],
          filters,
        );
    });

    it('calls batchRequests with specified params ', () => {
      const dfd = $.Deferred();
      spyOn(QueryApiUtils, 'buildParam')
        .and.returnValue({
          fakeParam: 'fakeValue',
        });
      spyOn(QueryApiUtils, 'batchRequests')
        .and.returnValue(dfd);

      viewModel.loadEvidences();

      expect(QueryApiUtils.batchRequests)
        .toHaveBeenCalledWith({fakeParam: 'fakeValue'});
    });

    it('returns deferred object with Evidence values', (done) => {
      const dfd = $.Deferred();
      spyOn(QueryApiUtils, 'batchRequests')
        .and.returnValue(dfd);

      dfd.resolve({
        Evidence: {
          values: [1, 2, 3],
        },
      });

      viewModel.loadEvidences().then((values) => {
        expect(values).toEqual([1, 2, 3]);
        done();
      });
    });
  });

  describe('initLocalCustomAttributes() method', () => {
    let customAttr;

    beforeEach(() => {
      customAttr = jasmine.createSpy('customAttr');
      viewModel.attr('instance', {customAttr});
    });

    it('calls customAttr with specified params', () => {
      viewModel.initLocalCustomAttributes();

      expect(customAttr).toHaveBeenCalledWith({
        type: CUSTOM_ATTRIBUTE_TYPE.LOCAL,
      });
    });

    it('assigns instance lca to localCustomAttributes attr', () => {
      viewModel.attr('localCustomAttributes', []);
      customAttr.and.returnValue([{
        lca1: 1,
        lca2: 2,
      }]);

      viewModel.initLocalCustomAttributes();

      expect(viewModel.attr('localCustomAttributes').serialize()).toEqual([{
        lca1: 1,
        lca2: 2,
      }]);
    });
  });

  describe('initEvidences() method', () => {
    it('sets isLoading attr to true before loading evidences', () => {
      viewModel.attr('isLoading', false);

      viewModel.initEvidences();

      expect(viewModel.attr('isLoading')).toBe(true);
    });

    it('calls loadEvidences() method', () => {
      spyOn(viewModel, 'loadEvidences');

      viewModel.initEvidences();

      expect(viewModel.loadEvidences).toHaveBeenCalled();
    });

    describe('assigns loaded evidence', () => {
      let fakeLoadedObjects;

      beforeEach(() => {
        fakeLoadedObjects = [
          {
            kind: 'URL',
            value: 'url1',
          },
          {
            kind: 'FILE',
            value: 'file1',
          },
          {
            kind: 'URL',
            value: 'url2',
          },
        ];
        spyOn(viewModel, 'loadEvidences')
          .and.returnValue(Promise.resolve(fakeLoadedObjects));
      });

      it('urls to evidenceUrls attr after loading evidences', async () => {
        viewModel.attr('evidenceUrls', []);

        await viewModel.initEvidences();

        expect(viewModel.attr('evidenceUrls').serialize())
          .toEqual([
            {
              kind: 'URL',
              value: 'url1',
            },
            {
              kind: 'URL',
              value: 'url2',
            },
          ]);
      });

      it('files to evidenceFiles attr after loading evidences', async () => {
        viewModel.attr('evidenceFiles', []);

        await viewModel.initEvidences();

        expect(viewModel.attr('evidenceFiles').serialize())
          .toEqual([
            {
              kind: 'FILE',
              value: 'file1',
            },
          ]);
      });
    });

    it('sets isInitialized attr to true after loading evidences',
      async () => {
        viewModel.attr('isInitialized', false);
        spyOn(viewModel, 'loadEvidences')
          .and.returnValue(Promise.resolve([]));

        await viewModel.initEvidences();

        expect(viewModel.attr('isInitialized')).toBe(true);
      });

    it('sets isLoading attr to false after loading evidences',
      async () => {
        viewModel.attr('isLoading', true);
        spyOn(viewModel, 'loadEvidences')
          .and.returnValue(Promise.resolve([]));

        await viewModel.initEvidences();

        expect(viewModel.attr('isLoading')).toBe(false);
      });
  });

  describe('events', () => {
    let events;
    let handler;

    beforeAll(() => {
      events = Component.prototype.events;
    });

    describe('{viewModel} expanded', () => {
      beforeEach(() => {
        handler = events['{viewModel} expanded'].bind({viewModel});
      });

      it('calls initLocalCustomAttributes if subtree is expanded ' +
      'and it is not initialized', () => {
        viewModel.attr('expanded', true);
        viewModel.attr('isInitialized', false);
        spyOn(viewModel, 'initLocalCustomAttributes');

        handler();

        expect(viewModel.initLocalCustomAttributes).toHaveBeenCalled();
      });

      it('does not call initLocalCustomAttributes if subtree is not expanded',
        () => {
          viewModel.attr('expanded', false);
          viewModel.attr('isInitialized', true);
          spyOn(viewModel, 'initLocalCustomAttributes');

          handler();

          expect(viewModel.initLocalCustomAttributes).not.toHaveBeenCalled();
        });

      it('does not call initLocalCustomAttributes if subtree is initialized',
        () => {
          viewModel.attr('expanded', true);
          viewModel.attr('isInitialized', true);
          spyOn(viewModel, 'initLocalCustomAttributes');

          handler();

          expect(viewModel.initLocalCustomAttributes).not.toHaveBeenCalled();
        });
    });
  });
});
