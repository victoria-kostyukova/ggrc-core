/*
  Copyright (C) 2020 Google Inc.
  Licensed under http://www.apache.org/licenses/LICENSE-2.0 <see LICENSE file>
*/

import canMap from 'can-map';
import {getComponentVM} from '../../../../js_specs/spec-helpers';
import Component from '../revision-log';

import * as NotifierUtils from '../../../plugins/utils/notifiers-utils';
import RefreshQueue from '../../../models/refresh-queue';
import Revision from '../../../models/service-models/revision';
import Person from '../../../models/business-models/person';
import Stub from '../../../models/stub';
import * as ReifyUtils from '../../../plugins/utils/reify-utils';
import * as QueryApiUtils from '../../../plugins/utils/query-api-utils';

describe('revision-log component', function () {
  let viewModel;

  beforeEach(function () {
    viewModel = getComponentVM(Component);
  });

  describe('init() method', () => {
    let init;

    beforeEach(() => {
      init = Component.prototype.init.bind({
        viewModel: viewModel,
      });
      spyOn(viewModel, 'initObjectReview');
      spyOn(viewModel, 'fetchItems');
    });

    it('calls initObjectReview', () => {
      init();

      expect(viewModel.initObjectReview).toHaveBeenCalled();
    });

    it('calls fetchItems', () => {
      init();

      expect(viewModel.fetchItems).toHaveBeenCalled();
    });
  });

  describe('defining default scope values', function () {
    it('sets the instance to null', function () {
      expect(viewModel.attr('instance')).toBeNull();
    });

    it('sets revisions to null', function () {
      expect(viewModel.attr('revisions')).toBeNull();
    });
  });

  describe('fetchItems() method', function () {
    let fetchDfd;

    beforeEach(function () {
      fetchDfd = new $.Deferred();
      spyOn(viewModel, 'fetchRevisions')
        .and.returnValue(fetchDfd);
      spyOn(NotifierUtils, 'notifier');
      spyOn(viewModel, 'fetchAdditionalInfoForRevisions')
        .and.callFake(() => 'additionalFetched');
      spyOn(viewModel, 'composeRevisionsData')
        .and.callFake(() => 'composedRevisions');
    });

    it('assigns true to isLoading', () => {
      viewModel.fetchItems();

      expect(viewModel.attr('isLoading')).toBe(true);
    });

    it('assigns null to revisions', () => {
      viewModel.fetchItems();

      expect(viewModel.attr('revisions')).toBeNull();
    });

    it('calls fetchAdditionalInfoForRevisions with fetched revisions',
      (done) => {
        viewModel.fetchItems();

        fetchDfd.resolve('revisions').then(() => {
          expect(viewModel.fetchAdditionalInfoForRevisions)
            .toHaveBeenCalledWith('revisions');
          done();
        });
      });

    it('calls composeRevisionsData with fetched revisions ' +
    'after additional info fetched', (done) => {
      fetchDfd.resolve('revisions');

      viewModel.fetchItems().then(() => {
        expect(viewModel.composeRevisionsData)
          .toHaveBeenCalledWith('additionalFetched');
        done();
      });
    });

    it('displays specified error if fetching the data fails', function (done) {
      fetchDfd.reject('Server error');

      viewModel.fetchItems().fail(() => {
        expect(NotifierUtils.notifier).toHaveBeenCalledWith(
          'error',
          'Failed to fetch revision history data.'
        );
        done();
      });
    });

    it('assigns result of composeRevisionsData to revisions attr', (done) => {
      fetchDfd.resolve('revisions');

      viewModel.fetchItems().then(() => {
        expect(viewModel.attr('revisions')).toEqual('composedRevisions');
        done();
      });
    });

    it('assigns false to "isLoading" after data fetching ' +
    'in case of success', (done) => {
      fetchDfd.resolve();

      viewModel.fetchItems().done(() => {
        expect(viewModel.attr('isLoading')).toBe(false);
        done();
      });
    });

    it('assigns false to "isLoading" after data fetching ' +
    'in case of fail', (done) => {
      fetchDfd.reject();

      viewModel.fetchItems().fail(() => {
        expect(viewModel.attr('isLoading')).toBe(false);
        done();
      });
    });
  });

  describe('fetchRevisions() method', () => {
    let requestDfd;

    beforeEach(() => {
      requestDfd = $.Deferred();
      spyOn(viewModel, 'getQueryFilter').and.returnValue('filter');
      spyOn(QueryApiUtils, 'buildParam').and.returnValue('buildedParams');
      spyOn(QueryApiUtils, 'batchRequests').and.returnValue(requestDfd);
      spyOn(viewModel, 'makeRevisionModels').and.returnValue('revisionsModels');
    });

    it('builds params according to passed params', () => {
      const pageInfo = {
        current: 123,
        pageSize: 321,
      };
      viewModel.attr('pageInfo', pageInfo);
      const page = {
        current: pageInfo.current,
        pageSize: pageInfo.pageSize,
        buffer: 1,
        sort: [{
          direction: 'desc',
          key: 'created_at',
        }],
      };
      viewModel.fetchRevisions();

      expect(QueryApiUtils.buildParam).toHaveBeenCalledWith(
        'Revision',
        page,
        null,
        null,
        'filter'
      );
      expect(QueryApiUtils.buildParam.calls.count()).toBe(1);
    });

    it('batches request with builded params', () => {
      viewModel.fetchRevisions();

      expect(QueryApiUtils.batchRequests).toHaveBeenCalledWith('buildedParams');
    });

    it('assigns total of received data to pageInfo of viewModel', (done) => {
      const revisionsData = {total: 696};
      requestDfd.resolve({Revision: revisionsData});

      viewModel.fetchRevisions().then(() => {
        expect(viewModel.attr('pageInfo.total')).toBe(revisionsData.total);
        done();
      });
    });

    it('makes revision models from received data', (done) => {
      const revisionsData = {};
      requestDfd.resolve({Revision: revisionsData});

      viewModel.fetchRevisions().then(() => {
        expect(viewModel.makeRevisionModels)
          .toHaveBeenCalledWith(revisionsData);
        done();
      });
    });

    it('returns revisions models', (done) => {
      const revisionsData = {};
      requestDfd.resolve({Revision: revisionsData});

      viewModel.fetchRevisions().then((revisions) => {
        expect(revisions).toBe('revisionsModels');
        done();
      });
    });
  });

  describe('makeRevisionModels(data) method', () => {
    it('returns models of Revision from data.values', () => {
      const values = [{id: 1}, {id: 2}];

      const result = viewModel.makeRevisionModels({values});

      result.forEach((revision, index) => {
        expect(revision instanceof Revision).toBe(true);
        expect(revision).toEqual(jasmine.objectContaining(values[index]));
      });
    });
  });

  describe('fetchAdditionalInfoForRevisions() method', () => {
    let revisions;

    beforeEach(() => {
      revisions = [{
        modified_by: 'mock1',
      }, {
        destination_type: 'mock2',
        destination_id: 'mock3',
      }, {
        source_type: 'mock4',
        source_id: 'mock5',
        content: {
          automapping: {
            modified_by: 'mock1',
            destination_type: 'mock2',
            destination_id: 'mock3',
            source_type: 'mock4',
            source_id: 'mock5',
          },
        },
      }];

      spyOn(viewModel, 'enqueueRelated');
      spyOn(RefreshQueue.prototype, 'trigger')
        .and.returnValue(Promise.resolve(revisions));
    });

    it('calls "enqueueRelated" for each revision', () => {
      viewModel.fetchAdditionalInfoForRevisions(revisions);
      revisions.forEach((revision) => {
        expect(viewModel.enqueueRelated)
          .toHaveBeenCalledWith(revision, jasmine.any(RefreshQueue));
      });
    });

    it('calls "enqueueRelated"  ' +
      'if revisions contains automapping content', () => {
      viewModel.fetchAdditionalInfoForRevisions(revisions);
      const automappingRevisions = revisions
        .filter((revision) => revision.content && revision.content.automapping)
        .map((revision) => revision.content.automapping);

      automappingRevisions.forEach((revision) => {
        expect(viewModel.enqueueRelated)
          .toHaveBeenCalledWith(revision, jasmine.any(RefreshQueue));
      });
    });

    it('returns revisions', (done) => {
      viewModel.fetchAdditionalInfoForRevisions(revisions)
        .then((result) => {
          expect(RefreshQueue.prototype.trigger).toHaveBeenCalled();
          expect(result).toEqual(revisions);
          done();
        });
    });
  });

  describe('enqueueRelated() method',
    () => {
      let revisions;
      let enqueueSpy;
      let loadACLPeopleSpy;

      beforeEach(() => {
        revisions = [{
          modified_by: 'mock1',
        }, {
          destination_type: 'mock2',
          destination_id: 'mock3',
        }, {
          source_type: 'mock4',
          source_id: 'mock5',
          content: {
            automapping: {
              modified_by: 'mock1',
              destination_type: 'mock2',
              destination_id: 'mock3',
              source_type: 'mock4',
              source_id: 'mock5',
            },
          },
        }];

        enqueueSpy = spyOn(RefreshQueue.prototype, 'enqueue');
        loadACLPeopleSpy = spyOn(viewModel, 'loadACLPeople');

        revisions.forEach((revision) => {
          viewModel.enqueueRelated(revision, RefreshQueue.prototype);
        });
      });

      it('calls "loadACLpeople" method for each revision', () => {
        revisions.forEach((revision) => {
          expect(loadACLPeopleSpy)
            .toHaveBeenCalledWith(revision, RefreshQueue.prototype);
        });
      });

      it('calls "enqueue" for all users which modified object', () => {
        const modifiers = revisions
          .filter((revision) => revision.modified_by)
          .map((revision) => revision.modified_by);
        expect(modifiers.length).not.toBe(0);
        modifiers.forEach((modifier) => {
          expect(enqueueSpy).toHaveBeenCalledWith(modifier);
        });
      });

      it('adds to revisions attribute "destination" ' +
      'if "destination_type" and "destination_id" are defined', () => {
        const destinations = revisions
          .filter((revision) => revision.destination_id &&
          revision.destination_type)
          .map((revision) => revision.destination);
        expect(destinations.length).not.toBe(0);

        revisions.forEach((revision) => {
          if (revision.destination_id && revision.destination_type) {
            expect(revision.destination instanceof Stub);
            expect(revision.destination).toEqual(jasmine.objectContaining({
              id: revision.destination_id,
              type: revision.destination_type,
            }));
          }
        });
      });

      it('calls "enqueue" for each created "destination" in revision', () => {
        const destinations = revisions
          .filter((revision) => revision.destination_id &&
            revision.destination_type)
          .map((revision) => revision.destination);
        expect(destinations.length).not.toBe(0);
        destinations.forEach((destination) => {
          expect(enqueueSpy).toHaveBeenCalledWith(destination);
        });
      });

      it('adds to revisions attribute "source" ' +
      'if "source_type" and "source_id" are defined', () => {
        const sources = revisions
          .filter((revision) => revision.source_id &&
          revision.source_type)
          .map((revision) => revision.source);
        expect(sources.length).not.toBe(0);

        revisions.forEach((revision) => {
          if (revision.source_id && revision.source_type) {
            expect(revision.source instanceof Stub);
            expect(revision.source).toEqual(jasmine.objectContaining({
              id: revision.source_id,
              type: revision.source_type,
            }));
          }
        });
      });

      it('calls "enqueue" for each created "source" in revision', () => {
        const sources = revisions
          .filter((revision) => revision.source_id &&
            revision.source_type)
          .map((revision) => revision.source);
        expect(sources.length).not.toBe(0);
        sources.forEach((source) => {
          expect(enqueueSpy).toHaveBeenCalledWith(source);
        });
      });
    });

  describe('loadACLPeople() method', () => {
    let revision;
    let enqueueSpy;

    beforeEach(() => {
      enqueueSpy = spyOn(RefreshQueue.prototype, 'enqueue');
    });

    it('should do nothing if revision doesn\'t have  content', () => {
      revision = {};

      viewModel.loadACLPeople(revision, RefreshQueue.prototype);

      expect(enqueueSpy).not.toHaveBeenCalled();
    });

    it('should do nothing if access list doesn\'t have people', () => {
      revision = {
        content: {
          access_control_list: [],
        },
      };

      viewModel.loadACLPeople(revision, RefreshQueue.prototype);

      expect(enqueueSpy).not.toHaveBeenCalled();
    });

    it('should do nothing if person from access list exists in cache', () => {
      revision = {
        content: {
          access_control_list: [{
            person: {
              id: 123,
            },
          }],
        },
      };

      spyOn(Person, 'findInCacheById').and.returnValue(true);

      viewModel.loadACLPeople(revision, RefreshQueue.prototype);

      expect(enqueueSpy).not.toHaveBeenCalled();
    });

    it('calls "enqueue" for each user who doesn\'t exist in cache', () => {
      revision = {
        content: {
          access_control_list: [{
            person: {
              id: 123,
            },
          },
          {
            person: {
              id: 244,
            },
          },
          {
            person: {
              id: 432,
            },
          }],
        },
      };

      spyOn(Person, 'findInCacheById').and.returnValue(false);

      viewModel.loadACLPeople(revision, RefreshQueue.prototype);

      revision.content.access_control_list.forEach((aclItem) => {
        expect(enqueueSpy).toHaveBeenCalledWith(aclItem.person);
      });
    });
  });

  describe('composeRevisionsData(revisions) method',
    () => {
      let revisions;
      let revisionsForCompare;

      beforeEach(() => {
        revisions = [{
          destination: 'destination',
        }, {
          source: 'source',
        }, {
          modified_by: 'modified_by',
          content: {
            automapping: {
              source: 'mock',
            },
          },
        }];

        revisionsForCompare = {mock: 'mock'};
        revisions.push(revisionsForCompare);

        spyOn(viewModel, 'reifyObject').and.callFake(
          (revision) => {
            revision.isReified = true;
            return revision;
          });
      });

      it('returns specified object composed from revisions ' +
      'with not empty revisionsForCompare ' +
      'if there is more revisions than pageSize', () => {
        const expected = {
          object: [jasmine.objectContaining(revisions[2])],
          mappings: [revisions[0], revisions[1]].map((revision) =>
            jasmine.objectContaining(revision)),
          revisionsForCompare: [jasmine.objectContaining(revisionsForCompare)],
        };
        viewModel.attr('pageInfo.pageSize', 3);

        const result =
          viewModel.composeRevisionsData(revisions);

        expect(result).toEqual(expected);
      });

      it('returns specified object composed from revisions' +
      'with empty revisionsForCompare ' +
      'if there is not more revisions than pageSize', () => {
        const expected = {
          object: [jasmine.objectContaining(revisions[2])],
          mappings: [revisions[0], revisions[1]].map((revision) =>
            jasmine.objectContaining(revision)),
          revisionsForCompare: [],
        };
        revisions.splice(-1);
        viewModel.attr('pageInfo.pageSize', 10);

        const result =
          viewModel.composeRevisionsData(revisions);

        expect(result).toEqual(expected);
      });

      it('calls "reifyObject" with automapping ' +
        'if revisions contains automapping content', () => {
        viewModel.composeRevisionsData(revisions);

        const automappingRevisions = revisions
          .filter((revision) => revision.content
            && revision.content.automapping)
          .map((revision) => revision.content.automapping);
        expect(automappingRevisions.length).not.toBe(0);

        automappingRevisions.forEach((revision) => {
          expect(viewModel.reifyObject).toHaveBeenCalledWith(revision);
        });
      });

      it('reifies all revisions in returned object', () => {
        viewModel.attr('pageInfo.pageSize', 3);

        const result =
          viewModel.composeRevisionsData(revisions);

        result.object.forEach((revision) => {
          expect(revision.isReified).toBe(true);
        });
        result.mappings.forEach((revision) => {
          expect(revision.isReified).toBe(true);
        });
        result.revisionsForCompare.forEach((revision) => {
          expect(revision.isReified).toBe(true);
        });
      });
    });

  describe('reifyObject(revision) method', () => {
    let revision;
    let isReifiableSpy;
    let reifySpy;

    beforeEach(() => {
      revision = {
        attr: jasmine.createSpy('attr').and.callFake(function (prop) {
          return this.prop;
        }),
      };
      isReifiableSpy = spyOn(ReifyUtils, 'isReifiable');
      reifySpy = spyOn(ReifyUtils, 'reify');
    });

    it('reifies "modified_by" field if it is reifiable', () => {
      revision = Object.assign(revision, {modified_by: {}});
      isReifiableSpy.and.returnValue(true);

      viewModel.reifyObject(revision);

      expect(reifySpy).toHaveBeenCalled();
    });

    it('works without errors ' +
    'if "modified_by" field does not have reify method', () => {
      revision = Object.assign(revision, {modified_by: {}});
      isReifiableSpy.and.returnValue(false);

      expect(viewModel.reifyObject.bind(null, revision)).not.toThrowError();
    });

    it('reifies "source" field if it has reify method', () => {
      revision = Object.assign(revision, {source: {}});
      isReifiableSpy.and.returnValue(true);

      viewModel.reifyObject(revision);

      expect(reifySpy).toHaveBeenCalled();
    });

    it('works without errors ' +
    'if "destination" field does not have reify method', () => {
      revision = Object.assign(revision, {source: {}});
      isReifiableSpy.and.returnValue(false);

      expect(viewModel.reifyObject.bind(null, revision)).not.toThrowError();
    });

    it('reifies "destination" field if it has reify method', () => {
      revision = Object.assign(revision, {destination: {}});
      isReifiableSpy.and.returnValue(true);

      viewModel.reifyObject(revision);

      expect(reifySpy).toHaveBeenCalled();
    });

    it('works without errors ' +
    'if "destination" field does not have reify method', () => {
      revision = Object.assign(revision, {destination: {}});
      isReifiableSpy.and.returnValue(false);

      expect(viewModel.reifyObject.bind(null, revision)).not.toThrowError();
    });
  });

  describe('changeLastUpdatesFilter(element) method', () => {
    beforeEach(() => {
      spyOn(viewModel, 'fetchItems');
    });

    it('assigns value of "element.checked" to options.showLastReviewUpdates',
      () => {
        const expected = 'value';
        viewModel.attr('options.showLastReviewUpdates', null);
        viewModel.changeLastUpdatesFilter({
          checked: expected,
        });

        expect(viewModel.attr('options.showLastReviewUpdates'))
          .toBe(expected);
      });

    it('assigns 1 to "pageInfo.current"', () => {
      viewModel.attr('pageInfo', {
        current: 123,
      });
      viewModel.changeLastUpdatesFilter({});

      expect(viewModel.attr('pageInfo.current'))
        .toBe(1);
    });

    it('calls fetchItems', () => {
      viewModel.changeLastUpdatesFilter({});

      expect(viewModel.fetchItems).toHaveBeenCalled();
    });
  });

  describe('initObjectReview() method', () => {
    it('assigns reified review in "review" attr ' +
    'if review present in instance', () => {
      const review = new canMap();
      spyOn(ReifyUtils, 'reify').and.returnValue('reifiedReview');
      viewModel.attr('review', 'previousReview');
      viewModel.attr('instance', {review});

      viewModel.initObjectReview();

      expect(viewModel.attr('review')).toBe('reifiedReview');
    });

    it('does not assigns "review" attr if it is not present in instance',
      () => {
        viewModel.attr('instance', {});
        viewModel.attr('review', 'previousReview');

        viewModel.initObjectReview();

        expect(viewModel.attr('review')).toBe('previousReview');
      });
  });

  describe('events', () => {
    const events = Component.prototype.events;
    let handler;

    describe('"{viewModel.instance} refreshInstance" handler', () => {
      beforeEach(() => {
        handler = events['{viewModel.instance} refreshInstance']
          .bind({viewModel});
        spyOn(viewModel, 'fetchItems');
      });

      it('calls fetchItems of viewModel', () => {
        handler();

        expect(viewModel.fetchItems).toHaveBeenCalled();
      });
    });

    describe('"{viewModel.pageInfo} current" handler', () => {
      beforeEach(() => {
        handler = events['{viewModel.pageInfo} current']
          .bind({viewModel});
        spyOn(viewModel, 'fetchItems');
      });

      it('calls fetchItems of viewModel', () => {
        handler();

        expect(viewModel.fetchItems).toHaveBeenCalled();
      });
    });

    describe('"{viewModel.pageInfo} pageSize" handler', () => {
      beforeEach(() => {
        handler = events['{viewModel.pageInfo} pageSize']
          .bind({viewModel});
        spyOn(viewModel, 'fetchItems');
      });

      it('calls fetchItems of viewModel', () => {
        handler();

        expect(viewModel.fetchItems).toHaveBeenCalled();
      });
    });

    describe('removed handler', () => {
      beforeEach(() => {
        handler = events.removed.bind({viewModel});
      });

      it('assigns false to options.showLastReviewUpdates of viewModel', () => {
        viewModel.attr('options', {showLastReviewUpdates: true});
        handler();

        expect(viewModel.attr('options.showLastReviewUpdates'))
          .toBe(false);
      });
    });
  });
});
