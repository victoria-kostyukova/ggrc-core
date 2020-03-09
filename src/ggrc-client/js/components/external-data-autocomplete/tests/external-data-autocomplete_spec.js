/*
 Copyright (C) 2020 Google Inc.
 Licensed under http://www.apache.org/licenses/LICENSE-2.0 <see LICENSE file>
 */

import canMap from 'can-map';
import {getComponentVM} from '../../../../js_specs/spec-helpers';
import Component from '../external-data-autocomplete';
import * as businessModels from '../../../models/business-models';
import * as ReifyUtils from '../../../plugins/utils/reify-utils';

describe('external-data-autocomplete component', () => {
  let viewModel;
  beforeEach(() => {
    viewModel = getComponentVM(Component);
  });

  describe('viewModel', () => {
    describe('renderResults get()', () => {
      describe('returns true', () => {
        it(`when "showResults" flag is turned on
            and "searchCriteria" length is greather than "minLength"`, () => {
          viewModel.showResults = true;
          viewModel.minLength = 2;
          viewModel.searchCriteria = 'test';

          let result = viewModel.renderResults;

          expect(result).toBe(true);
        });
      });

      describe('returns false', () => {
        it(`when "showResults" flag is turned off
            and "searchCriteria" length is greather than "minLength"`, () => {
          viewModel.showResults = false;
          viewModel.minLength = 2;
          viewModel.searchCriteria = 'test';

          let result = viewModel.renderResults;

          expect(result).toBe(false);
        });

        it(`when "showResults" flag is turned on
            and "searchCriteria" length is less than "minLength"`, () => {
          viewModel.showResults = true;
          viewModel.minLength = 2;
          viewModel.searchCriteria = '';

          let result = viewModel.renderResults;

          expect(result).toBe(false);
        });

        it(`when "showResults" flag is turned off
            and "searchCriteria" length is less than "minLength"`, () => {
          viewModel.showResults = false;
          viewModel.minLength = 2;
          viewModel.searchCriteria = '';

          let result = viewModel.renderResults;

          expect(result).toBe(false);
        });
      });
    });

    describe('openResults() method', () => {
      it('turns on "showResults" flag', () => {
        viewModel.showResults = false;

        viewModel.openResults();

        expect(viewModel.showResults).toBe(true);
      });
    });

    describe('closeResults() method', () => {
      it('turns off "showResults" flag', () => {
        viewModel.showResults = true;

        viewModel.closeResults();

        expect(viewModel.showResults).toBe(false);
      });
    });

    describe('setSearchCriteria() method', () => {
      let element = {
        val: jasmine.createSpy().and.returnValue('criteria'),
      };

      it('updates "searchCriteria" property', (done) => {
        viewModel.searchCriteria = null;

        viewModel.setSearchCriteria(element);

        setTimeout(() => {
          expect(viewModel.searchCriteria).toBe('criteria');
          done();
        }, 600);
      });

      it('dispatches "criteriaChanged" event', (done) => {
        spyOn(viewModel, 'dispatch');

        viewModel.setSearchCriteria(element);

        setTimeout(() => {
          expect(viewModel.dispatch).toHaveBeenCalledWith({
            type: 'criteriaChanged',
            value: 'criteria',
          });
          done();
        }, 600);
      });
    });

    describe('onItemPicked() method', () => {
      let saveDfd;
      let item;

      beforeEach(() => {
        saveDfd = $.Deferred();
        item = {
          test: true,
        };
        spyOn(viewModel, 'createOrGet').and.returnValue(saveDfd);
      });

      it('turns on "saving" flag', () => {
        viewModel.saving = false;

        viewModel.onItemPicked(item);

        expect(viewModel.saving).toBe(true);
      });

      it('call createOrGet() method', () => {
        viewModel.onItemPicked(item);

        expect(viewModel.createOrGet).toHaveBeenCalledWith(item);
      });

      it('dispatches event when instance was saved', (done) => {
        spyOn(viewModel, 'dispatch');

        viewModel.onItemPicked(item);

        saveDfd.resolve(item).then(() => {
          expect(viewModel.dispatch).toHaveBeenCalledWith({
            type: 'itemSelected',
            selectedItem: item,
          });
          done();
        });
      });

      it('turns off "saving" flag', (done) => {
        viewModel.saving = true;

        let onItemPickedChain = viewModel.onItemPicked(item);

        saveDfd.resolve().always(() => {
          onItemPickedChain.then(() => {
            expect(viewModel.saving).toBe(false);
            done();
          });
        });
      });

      it('cleans search criteria if "autoClean" is turned on', (done) => {
        viewModel.searchCriteria = 'someText';
        viewModel.autoClean = true;

        viewModel.onItemPicked(item);

        saveDfd.resolve().then(() => {
          expect(viewModel.searchCriteria).toBe('');
          done();
        });
      });

      it('does not clean search criteria if "autoClean" is turned on',
        (done) => {
          viewModel.searchCriteria = 'someText';
          viewModel.autoClean = false;

          viewModel.onItemPicked(item);

          saveDfd.resolve().then(() => {
            expect(viewModel.searchCriteria).toBe('someText');
            done();
          });
        });
    });

    describe('createOrGet() method', () => {
      let item;
      let model;

      beforeEach(() => {
        item = new canMap({test: true});
        viewModel.type = 'TestType';
        model = {
          id: 'testId',
        };

        let response = [[201,
          {
            test: model,
          },
        ]];
        businessModels.TestType = canMap.extend({
          create: jasmine.createSpy()
            .and.returnValue(Promise.resolve(response)),
          root_object: 'test',
          cache: {},
        }, {});
      });

      afterEach(() => {
        businessModels.TestType = null;
      });

      it('make call to create model', () => {
        viewModel.createOrGet(item);

        expect(businessModels.TestType.create).toHaveBeenCalledWith(item);
      });

      it('creates model with empty context', () => {
        item.context = 'test';
        viewModel.createOrGet(item);

        let model = businessModels.TestType.create.calls.argsFor(0)[0];
        expect(model.context).toBe(null);
      });

      it('creates model with "external" flag', () => {
        item.external = false;
        viewModel.createOrGet(item);

        let model = businessModels.TestType.create.calls.argsFor(0)[0];
        expect(model.external).toBe(true);
      });

      it('returns new model if there is no value in cache', (done) => {
        viewModel.createOrGet(item)
          .then((resultModel) => {
            expect(resultModel.id).toBe('testId');
            expect(resultModel instanceof businessModels.TestType).toBe(true);
            done();
          });
      });

      it('returns cached model if there is value in cache', (done) => {
        businessModels.TestType.cache['testId'] = {cached: true};

        viewModel.createOrGet(item)
          .then((resultModel) => {
            expect(resultModel).toBe(businessModels.TestType.cache['testId']);
            done();
          });
      });

      it('calls model reify', (done) => {
        spyOn(ReifyUtils, 'reify').and.returnValue(model);
        spyOn(ReifyUtils, 'isReifiable').and.returnValue(true);

        viewModel.createOrGet(item)
          .then(() => {
            expect(ReifyUtils.reify).toHaveBeenCalledWith(model);
            done();
          });
      });
    });
  });
});
