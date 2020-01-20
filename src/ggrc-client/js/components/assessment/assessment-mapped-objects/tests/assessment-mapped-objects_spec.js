/*
  Copyright (C) 2020 Google Inc.
  Licensed under http://www.apache.org/licenses/LICENSE-2.0 <see LICENSE file>
*/

import Component from '../assessment-mapped-objects';
import {getComponentVM} from '../../../../../js_specs/spec-helpers';
import * as QueryApiUtils from '../../../../plugins/utils/query-api-utils';


describe('assessment-mapped-objects component', () => {
  let viewModel;

  beforeEach(() => {
    viewModel = getComponentVM(Component);
  });

  describe('loadMappedObjects() method', () => {
    it('calls buildParam method with specified params', () => {
      const fields = ['id', 'revision'];
      const filters = {
        expression: {
          left: {
            left: 'child_type',
            op: {
              name: '=',
            },
            right: 'Control',
          },
          op: {
            name: 'AND',
          },
          right: {
            object_name: 'Assessment',
            op: {
              name: 'relevant',
            },
            ids: [
              123,
            ],
          },
        },
      };
      viewModel.attr('instance', {
        assessment_type: 'Control',
        id: 123,
      });
      spyOn(QueryApiUtils, 'buildParam');

      viewModel.loadMappedObjects();

      expect(QueryApiUtils.buildParam)
        .toHaveBeenCalledWith(
          'Snapshot',
          {},
          null,
          fields,
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

      viewModel.loadMappedObjects();

      expect(QueryApiUtils.batchRequests)
        .toHaveBeenCalledWith({fakeParam: 'fakeValue'});
    });

    it('returns deferred object with snapshot values', (done) => {
      const dfd = $.Deferred();
      spyOn(QueryApiUtils, 'batchRequests')
        .and.returnValue(dfd);

      dfd.resolve({
        Snapshot: {
          values: [1, 2, 3],
        },
      });

      viewModel.loadMappedObjects().then((values) => {
        expect(values).toEqual([1, 2, 3]);
        done();
      });
    });
  });

  describe('initMappedObjects() method', () => {
    it('sets isLoading attr to true before loading of mapped objects', () => {
      viewModel.attr('isLoading', false);

      viewModel.initMappedObjects();

      expect(viewModel.attr('isLoading')).toBe(true);
    });

    it('calls loadMappedObjects() method', () => {
      spyOn(viewModel, 'loadMappedObjects');

      viewModel.initMappedObjects();

      expect(viewModel.loadMappedObjects).toHaveBeenCalled();
    });

    it('assigns re-formed loaded mapped objects to mappedObjects attr ' +
    'after loading of mapped objects', async () => {
      viewModel.attr('mappedObjects', []);
      const fakeLoadedObjects = [
        {
          id: 123,
          revision: {
            content: {
              type: 'Control',
              id: 1,
            },
          },
        },
        {
          id: 235,
          revision: {
            content: {
              type: 'Issues',
              id: 2,
            },
          },
        },
      ];
      spyOn(viewModel, 'loadMappedObjects')
        .and.returnValue(Promise.resolve(fakeLoadedObjects));

      await viewModel.initMappedObjects();

      expect(viewModel.attr('mappedObjects').serialize())
        .toEqual([
          {
            id: 123,
            revision: {
              content: {
                type: 'Control',
                id: 1,
              },
            },
            type: 'Snapshot',
            child_type: 'Control',
            child_id: 1,
          },
          {
            id: 235,
            revision: {
              content: {
                type: 'Issues',
                id: 2,
              },
            },
            type: 'Snapshot',
            child_type: 'Issues',
            child_id: 2,
          },
        ]);
    });

    it('sets isInitialized attr to true after loading of mapped objects',
      async () => {
        viewModel.attr('isInitialized', false);
        spyOn(viewModel, 'loadMappedObjects')
          .and.returnValue(Promise.resolve([]));

        await viewModel.initMappedObjects();

        expect(viewModel.attr('isInitialized')).toBe(true);
      });

    it('sets isLoading attr to false after loading of mapped objects',
      async () => {
        viewModel.attr('isLoading', true);
        spyOn(viewModel, 'loadMappedObjects')
          .and.returnValue(Promise.resolve([]));

        await viewModel.initMappedObjects();

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

      it('calls initMappedObjects if subtree is expanded ' +
      'and it is not initialized', () => {
        viewModel.attr('expanded', true);
        viewModel.attr('isInitialized', false);
        spyOn(viewModel, 'initMappedObjects');

        handler();

        expect(viewModel.initMappedObjects).toHaveBeenCalled();
      });

      it('does not call initMappedObjects if subtree is not expanded',
        () => {
          viewModel.attr('expanded', false);
          viewModel.attr('isInitialized', true);
          spyOn(viewModel, 'initMappedObjects');

          handler();

          expect(viewModel.initMappedObjects).not.toHaveBeenCalled();
        });

      it('does not call initMappedObjects if subtree is initialized',
        () => {
          viewModel.attr('expanded', true);
          viewModel.attr('isInitialized', true);
          spyOn(viewModel, 'initMappedObjects');

          handler();

          expect(viewModel.initMappedObjects).not.toHaveBeenCalled();
        });
    });
  });
});
