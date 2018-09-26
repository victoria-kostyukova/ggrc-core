/*
  Copyright (C) 2018 Google Inc.
  Licensed under http://www.apache.org/licenses/LICENSE-2.0 <see LICENSE file>
*/

import {resolveDeferredBindings} from '../pending-joins';
import {makeFakeModel} from '../../../js_specs/spec_helpers';
import Cacheable from '../cacheable';
import * as mappingModels from '../mapping-models';
import Mappings from '../mappers/mappings';

describe('pending-joins module', () => {
  describe('resolveDeferredBindings() util', function () {
    let DummyModel;

    afterAll(function () {
      mappingModels.DummyJoin = null;
    });

    beforeEach(function () {
      DummyModel = makeFakeModel({model: Cacheable});
      mappingModels.DummyJoin = makeFakeModel({model: Cacheable});
    });

    it('iterates _pending_joins, calling refresh_stubs on each binding',
      function () {
        let instance = {};
        let binding = jasmine.createSpyObj('binding', ['refresh_stubs']);
        instance._pending_joins = [{what: {}, how: 'add', through: 'foo'}];
        spyOn(Mappings, 'get_binding').and.returnValue(binding);
        spyOn($.when, 'apply').and.returnValue(new $.Deferred().reject());

        resolveDeferredBindings(instance);
        expect(binding.refresh_stubs).toHaveBeenCalled();
      });

    describe('add case', function () {
      let instance;
      let binding;
      let dummy;
      beforeEach(function () {
        dummy = new DummyModel({id: 1});
        instance = jasmine.createSpyObj('instance',
          ['isNew', 'refresh', 'attr', 'dispatch']);
        binding = jasmine.createSpyObj('binding', ['refresh_stubs']);
        instance._pending_joins = [{what: dummy, how: 'add', through: 'foo'}];
        instance.isNew.and.returnValue(false);
        spyOn(Mappings, 'get_binding').and.returnValue(binding);
        binding.loader = {model_name: 'DummyJoin'};
        binding.list = [];
        spyOn(mappingModels.DummyJoin, 'newInstance');
        spyOn(mappingModels.DummyJoin.prototype, 'save');
      });

      it('creates a proxy object when it does not exist', function () {
        resolveDeferredBindings(instance);
        expect(mappingModels.DummyJoin.newInstance).toHaveBeenCalled();
        expect(mappingModels.DummyJoin.prototype.save).toHaveBeenCalled();
      });

      it('does not create proxy object when it already exists', function () {
        binding.list.push({instance: dummy});
        resolveDeferredBindings(instance);
        expect(mappingModels.DummyJoin.newInstance).not.toHaveBeenCalled();
        expect(mappingModels.DummyJoin.prototype.save).not.toHaveBeenCalled();
      });
    });

    describe('remove case', function () {
      let instance;
      let binding;
      let dummy;
      let dummyJoin;
      beforeEach(function () {
        dummy = new DummyModel({id: 1});
        dummyJoin = new mappingModels.DummyJoin({id: 1});
        instance = jasmine.createSpyObj('instance',
          ['isNew', 'refresh', 'attr', 'dispatch']);
        binding = jasmine.createSpyObj('binding', ['refresh_stubs']);
        instance._pending_joins = [{
          what: dummy, how: 'remove', through: 'foo'}];
        instance.isNew.and.returnValue(false);
        spyOn(Mappings, 'get_binding').and.returnValue(binding);
        binding.loader = {model_name: 'DummyJoin'};
        binding.list = [];
        spyOn(mappingModels.DummyJoin, 'newInstance');
        spyOn(mappingModels.DummyJoin.prototype, 'save');
      });

      it('removes proxy object if it exists', function () {
        binding.list.push({instance: dummy, get_mappings: function () {
          return [dummyJoin];
        }});
        spyOn(dummyJoin, 'refresh').and.returnValue($.when());
        spyOn(dummyJoin, 'destroy');
        resolveDeferredBindings(instance);
        expect(dummyJoin.destroy).toHaveBeenCalled();
      });
    });
  });
});

