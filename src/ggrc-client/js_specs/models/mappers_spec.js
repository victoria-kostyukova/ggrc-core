/*
  Copyright (C) 2019 Google Inc.
  Licensed under http://www.apache.org/licenses/LICENSE-2.0 <see LICENSE file>
*/

import RefreshQueue from '../../js/models/refresh_queue';
import Cacheable from '../../js/models/cacheable';
import Mappings from '../../js/models/mappers/mappings';

describe('mappers', function () {
  let LL;
  beforeEach(function () {
    LL = GGRC.ListLoaders;
    GGRC.Jasmine = GGRC.Jasmine || {};
    GGRC.Jasmine.MockModel = GGRC.Jasmine.MockModel ||
      Cacheable({}, {});
  });

  describe('ListBinding', function () {
    describe('#init', function () {
      it('sets instance and loader to supplied arguments', function () {
        let lb = new LL.ListBinding(1, 2);
        expect(lb.instance).toBe(1);
        expect(lb.loader).toBe(2);
      });

      it('creates a new observable list', function () {
        expect(new LL.ListBinding().list).toEqual(jasmine.any(can.List));
      });
    });

    describe('#refresh_stubs', function () {
      it('calls refresh_stubs on its loader', function () {
        let loader = jasmine.createSpyObj('loader', ['refresh_stubs']);
        let binding = new LL.ListBinding({}, loader);
        binding.refresh_stubs();
        expect(loader.refresh_stubs).toHaveBeenCalledWith(binding);
      });
    });

    describe('#refresh_instances', function () {
      it('calls refresh_instances on its loader', function () {
        let loader = jasmine.createSpyObj('loader', ['refresh_instances']);
        let binding = new LL.ListBinding({}, loader);
        binding.refresh_instances();
        expect(loader.refresh_instances)
          .toHaveBeenCalledWith(binding, undefined);
      });
    });

    describe('#refresh_count', function () {
      let binding;
      beforeEach(function () {
        binding = new LL.ListBinding({}, {});
      });

      it('calls refresh_stubs on itself', function () {
        spyOn(binding, 'refresh_stubs').and.returnValue($.when());
        binding.refresh_count();
        expect(binding.refresh_stubs).toHaveBeenCalledWith();
      });

      it('returns a deferred that resolves to a compute', function (done) {
        let deferred;
        spyOn(binding, 'refresh_stubs').and.returnValue($.when());
        deferred = binding.refresh_count();
        expect(typeof deferred.then).toBe('function');
        deferred.then(function (value) {
          expect(value.isComputed).toBeTruthy();
          done();
        }, function () {
          fail('Deferred returned from refresh_count was rejected');
        });
      });

      it('...and the compute returns the list length', function (done) {
        let deferred;
        binding.list.push(1, 2, 3);
        spyOn(binding, 'refresh_stubs').and.returnValue($.when());
        deferred = binding.refresh_count();
        deferred.then(function (value) {
          expect(value()).toBe(3);
          done();
        }, function () {
          fail('Deferred returned from refresh_count was rejected');
        });
      });
    });

    describe('#refresh_list', function () {
      let binding;
      let loader;
      let otherBinding;
      beforeEach(function () {
        otherBinding = jasmine.createSpyObj(
          'other_binding', ['refresh_instances']);
        otherBinding.refresh_instances.and.returnValue($.when());
        loader = jasmine.createSpyObj(
          'loader', ['attach', 'refresh_instances']);
        loader.refresh_instances.and.returnValue($.when());
        loader.attach.and.returnValue(otherBinding);
        spyOn(LL.ReifyingListLoader, 'newInstance').and.returnValue(loader);
        binding = new LL.ListBinding({}, {});
        spyOn(binding, 'refresh_instances').and.returnValue($.when());
      });

      it('attaches its instance to a new ReifyingListLoader', function () {
        binding.refresh_list();
        expect(LL.ReifyingListLoader.newInstance).toHaveBeenCalledWith(binding);
        expect(loader.attach).toHaveBeenCalledWith(binding.instance);
      });

      it('sets the name of the ReifyingListLoader\'s ListBinding to ' +
         'its own name plus "_instances"', function () {
        binding.name = 'foo';
        binding.refresh_list();
        expect(otherBinding.name).toBe('foo_instances');
      });

      it('refreshes instances on the new binding', function () {
        binding.refresh_list();
        expect(otherBinding.refresh_instances).toHaveBeenCalledWith(binding);
      });

      it('refreshes its own instances after refreshing the new binding\'s ' +
         'instances', function (done) {
        let dfd = binding.refresh_list();
        dfd.then(function () {
          expect(binding.refresh_instances).toHaveBeenCalledWith();
          done();
        }, function () {
          fail('deferred was rejected in refresh_instances');
        });
      });
    });

    describe('#refresh_instance', function () {
      it('enqueues the instance in a triggered RefreshQueue', function () {
        spyOn(RefreshQueue.prototype, 'enqueue');
        spyOn(RefreshQueue.prototype, 'trigger');
        new LL.ListBinding(1, {}).refresh_instance();
        expect(RefreshQueue.prototype.enqueue).toHaveBeenCalledWith(1);
        expect(RefreshQueue.prototype.trigger).toHaveBeenCalledWith();
      });

      it('returns the deferred from the refresh queue', function () {
        let dfd = $.when();
        spyOn(RefreshQueue.prototype, 'enqueue');
        spyOn(RefreshQueue.prototype, 'trigger').and.returnValue(dfd);
        expect(new LL.ListBinding(1, {}).refresh_instance()).toBe(dfd);
      });
    });
  });

  describe('MappingResult', function () {
    describe('#init', function () {
      it('sets the named properties to the positional parameters', function () {
        let mr;
        spyOn(LL.MappingResult.prototype, '_make_mappings').and.callFake(
          function (mappingName) {
            expect(mappingName).toBe('mappings');
            return '_mapping';
          });
        let instance = {};
        mr = new LL.MappingResult(instance, 'mappings', 'binding');

        expect(mr.instance).toBe(instance);
        expect(mr.binding).toBe('binding');
        expect(mr.mappings).toBe('_mapping');
        expect(LL.MappingResult.prototype._make_mappings)
          .toHaveBeenCalledWith('mappings');
      });

      it('sets the named properties to the object properties if called ' +
         'with an object', function () {
        let mr;
        spyOn(LL.MappingResult.prototype, '_make_mappings').and.callFake(
          function (mappingName) {
            expect(mappingName).toBe('mappings');
            return '_mapping';
          });
        mr = new LL.MappingResult(
          {instance: 'instance', mappings: 'mappings', binding: 'binding'});

        expect(mr.instance).toBe('instance');
        expect(mr.binding).toBe('binding');
        expect(mr.mappings).toBe('_mapping');
        expect(LL.MappingResult.prototype._make_mappings)
          .toHaveBeenCalledWith('mappings');
      });
    });

    describe('#_make_mappings', function () {
      it('converts all elements of the supplied array to mapping results',
        function () {
          let mr = new LL.MappingResult({}, [{}], 'baz');
          expect(mr._make_mappings([{}, {}, mr]))
            .toEqual([
              jasmine.any(LL.MappingResult),
              jasmine.any(LL.MappingResult),
              mr,
            ]);
        });
    });

    describe('#get_bindings', function () {
      it('finds all depth-1 bindings touched by walk_instances', function () {
        let mr = new LL.MappingResult({}, [{}], 'baz');
        let phonyBinding = {};
        let phonyResult = {binding: phonyBinding};
        spyOn(mr, 'walk_instances').and.callFake(function (fn) {
          fn({}, phonyResult, 1);
          fn({}, {binding: {}}, 2);
        });
        expect(mr.get_bindings()).toEqual([phonyBinding]);
      });
    });

    describe('#bindings_compute', function () {
      let mr;
      beforeEach(function () {
        mr = new LL.MappingResult({}, [{}], 'baz');
      });

      it('returns the saved compute if it exists.', function () {
        let compute = can.compute();
        mr._bindings_compute = compute;
        expect(mr.bindings_compute()).toBe(compute);
      });

      it('calls get_bindings_compute if no saved compute exists.', function () {
        spyOn(mr, 'get_bindings_compute');
        mr.bindings_compute();
        expect(mr.get_bindings_compute).toHaveBeenCalled();
      });
    });

    describe('#get_bindings_compute', function () {
      let mr;
      beforeEach(function () {
        mr = new LL.MappingResult({}, [{}], 'baz');
      });

      it('returns a can.compute', function () {
        let result = mr.get_bindings_compute();
        expect(typeof result).toBe('function');
        expect(result.isComputed).toBe(true);
      });

      describe('returned compute', function () {
        it('returns the bindings', function () {
          let result;
          let phonyBinding = {};
          spyOn(mr, 'get_bindings').and.returnValue([phonyBinding]);
          result = (mr.get_bindings_compute())();
          expect(result).toEqual([phonyBinding]);
        });

        it('watches the observe trigger', function () {
          spyOn(mr, 'watch_observe_trigger');
          (mr.get_bindings_compute())();
          expect(mr.watch_observe_trigger).toHaveBeenCalled();
        });
      });
    });

    describe('#get_mappings', function () {
      it('calls walk_instances', function () {
        let mr = new LL.MappingResult({}, [{}], 'baz');
        spyOn(mr, 'walk_instances');
        mr.get_mappings();
        expect(mr.walk_instances).toHaveBeenCalled();
      });

      it('gets all instances where depth is 1', function () {
        let mr = new LL.MappingResult({}, [{}], 'baz');
        spyOn(mr, 'walk_instances').and.callFake(function (fn) {
          fn('foo', {}, 1);
          fn('bar', {}, 2);
        });
        expect(mr.get_mappings()).toEqual(['foo']);
      });

      it('adds self for depth=1 and instance=true', function () {
        let instance = {};
        let mr = new LL.MappingResult(instance, [{}], 'baz');
        spyOn(mr, 'walk_instances').and.callFake(function (fn) {
          fn(true, {}, 1);
        });
        expect(mr.get_mappings().length).toBe(1);
        expect(mr.get_mappings()[0]).toBe(instance);
      });
    });

    describe('#mappings_compute', function () {
      let mr;
      beforeEach(function () {
        mr = new LL.MappingResult({}, [{}], 'baz');
      });

      it('returns the saved compute if it exists.', function () {
        let compute = can.compute();
        mr._mappings_compute = compute;
        expect(mr.mappings_compute()).toBe(compute);
      });

      it('calls get_mappings_compute if no saved compute exists.', function () {
        spyOn(mr, 'get_mappings_compute');
        mr.mappings_compute();
        expect(mr.get_mappings_compute).toHaveBeenCalled();
      });
    });

    describe('#get_mappings_compute', function () {
      let mr;
      beforeEach(function () {
        mr = new LL.MappingResult({}, [{}], 'baz');
      });

      it('returns a can.compute', function () {
        let result = mr.get_mappings_compute();
        expect(typeof result).toBe('function');
        expect(result.isComputed).toBe(true);
      });

      describe('returned compute', function () {
        it('returns the mappings', function () {
          let result;
          let phonyBinding = {};
          spyOn(mr, 'get_mappings').and.returnValue([phonyBinding]);
          result = (mr.get_mappings_compute())();
          expect(result).toEqual([phonyBinding]);
        });

        it('watches the observe trigger', function () {
          spyOn(mr, 'watch_observe_trigger');
          (mr.get_mappings_compute())();
          expect(mr.watch_observe_trigger).toHaveBeenCalled();
        });
      });
    });

    describe('#walk_instances', function () {
      describe('when last_instance is not this MappingResult\'s ' +
               'instance', function () {
        it('calls the function on itself', function () {
          let instance = {};
          let mr = new LL.MappingResult(instance, [], 'bar');
          let spy = jasmine.createSpy('spy');
          mr.walk_instances(spy, 'bar', 0);

          expect(spy).toHaveBeenCalledWith(instance, jasmine.any(Object), 0);
        });

        describe('when mappings length is greater than zero', function () {
          it('calls walk_instances on each mapping with depth incremented',
            function () {
              let fakeResult = jasmine.createSpyObj(
                'fake_result', ['walk_instances']);
              spyOn(LL.MappingResult.prototype, '_make_mappings').and
                .returnValue([fakeResult]);
              let instance = {};
              let mr = new LL.MappingResult(instance, [], 'bar');
              let func = function () {};
              mr.walk_instances(func, 'bar', 0);
              expect(fakeResult.walk_instances)
                .toHaveBeenCalledWith(func, instance, 1);
            });
        });
      });

      describe('when last_instance is the same as this MappingResult\'s ' +
               'instance', function () {
        describe('when mappings length is greater than zero', function () {
          it('calls walk_instances on each mapping without incrementing depth',
            function () {
              let fakeResult = jasmine.createSpyObj(
                'fake_result', ['walk_instances']);
              spyOn(LL.MappingResult.prototype, '_make_mappings').and
                .returnValue([fakeResult]);
              let instance = {};
              let mr = new LL.MappingResult(instance, [], 'bar');
              let func = function () {};
              mr.walk_instances(func, instance, 0);
              expect(fakeResult.walk_instances)
                .toHaveBeenCalledWith(func, instance, 0);
            });
        });

        it('no action is taken', function () {
          let instance = {};
          let mr = new LL.MappingResult(instance, [], 'bar');
          mr.walk_instances(function (walkInstance, _result, depth) {
            fail('fn was called');
          }, instance, 0);
        });
      });
    });
  });

  describe('GGRC.ListLoaders.BaseListLoader', function () {
    let ll;
    beforeEach(function () {
      ll = new GGRC.ListLoaders.BaseListLoader();
      // init_listeners is abstract -- called by base init but not implemented in base.
      ll.init_listeners = jasmine.createSpy();
    });

    describe('#attach', function () {
      it('calls the binding factory for the type', function () {
        spyOn(GGRC.ListLoaders.BaseListLoader, 'binding_factory');

        ll.attach('instance');
        expect(GGRC.ListLoaders.BaseListLoader.binding_factory)
          .toHaveBeenCalledWith('instance', ll);
      });

      it('inits the listeners', function () {
        let fakeBinding = {};
        spyOn(GGRC.ListLoaders.BaseListLoader, 'binding_factory').and
          .returnValue(fakeBinding);

        ll.attach('instance');
        expect(ll.init_listeners).toHaveBeenCalledWith(fakeBinding);
      });
    });

    describe('#find_result_by_instance', function () {
      let notFound;
      let found;
      let list;
      beforeEach(function () {
        notFound = new GGRC.Jasmine.MockModel({id: 1});
        found = new GGRC.Jasmine.MockModel({id: 2});
        list = [{instance: found}];
      });

      it('returns null if no result', function () {
        expect(ll.find_result_by_instance({instance: notFound}, list))
          .toBe(null);
      });

      it('returns the result if found', function () {
        expect(ll.find_result_by_instance({instance: found}, list))
          .toBe(list[0]);
      });
    });

    describe('#is_duplicate_result', function () {
      it('returns false if instances do not match', function () {
        expect(ll.is_duplicate_result({instance: 1}, {instance: 2}))
          .toBe(false);
      });

      it('returns true if instances AND mappings match', function () {
        expect(ll.is_duplicate_result(
          {instance: 1, mappings: 'a'},
          {instance: 1, mappings: 'a'})).toBe(true);
      });

      it('returns false if either result has empty mappings', function () {
        expect(ll.is_duplicate_result(
          {instance: 1, mappings: null},
          {instance: 1, mappings: []})).toBe(false);
        expect(ll.is_duplicate_result(
          {instance: 1, mappings: []},
          {instance: 1, mappings: null})).toBe(false);
        expect(ll.is_duplicate_result(
          {instance: 1, mappings: []},
          {instance: 1, mappings: []})).toBe(false);
        // expect(ll.is_duplicate_result({instance : 1, mappings : 'a'}, {instance : 1, mappings : [] })).toBe(false);
      });

      it('returns false if either result has multiple mappings', function () {
        expect(ll.is_duplicate_result(
          {instance: 1, mappings: ['a', 'b']},
          {instance: 1, mappings: ['a']})).toBe(false);
        expect(ll.is_duplicate_result(
          {instance: 1, mappings: ['a']},
          {instance: 1, mappings: ['a', 'b']})).toBe(false);
        expect(ll.is_duplicate_result(
          {instance: 1, mappings: ['a', 'b']},
          {instance: 1, mappings: ['a', 'b']})).toBe(false);
        // expect(ll.is_duplicate_result({instance : 1, mappings : 'a'}, {instance : 1, mappings : [] })).toBe(false);
      });

      it('returns true if boths results have null mappings', function () {
        expect(ll.is_duplicate_result(
          {instance: 1, mappings: null},
          {instance: 1, mappings: null})).toBe(true);
      });

      it('returns true if both results have one non-matching mapping with no' +
         ' dependent mapping (instance === true)', function () {
        expect(ll.is_duplicate_result(
          {instance: 1, mappings: [
            {instance: true, mappings: [], binding: 2}], binding: 1},
          {instance: 1, mappings: [
            {instance: true, mappings: [], binding: 2}], binding: 1}
        )).toBe(true);
      });
    });

    describe('#insert_results', function () {
      let binding;
      let fakeFindResult;
      beforeEach(function () {
        fakeFindResult = {mappings: []};
        spyOn(ll, 'find_result_by_instance');
        spyOn(ll, 'is_duplicate_result');
        spyOn(ll, 'make_result').and.returnValue(fakeFindResult);
        binding = {list: []};
      });

      it('returns an empty list, and pushes nothing to binding, ' +
         'if no results', function () {
        let ret = ll.insert_results(binding, []);
        expect(ret).toEqual([]);
        expect(binding.list).toEqual([]);
      });


      it('returns a list with inserted bindings, if results', function () {
        let ret = ll.insert_results(binding, ['a']);
        expect(ret).toEqual([fakeFindResult]);
        expect(binding.list).toEqual([fakeFindResult]);
      });

      it('returns an empty list, and pushes nothing to binding, ' +
         'if results are duplicates', function () {
        let ret;
        ll.find_result_by_instance.and.returnValue(fakeFindResult);
        ll.is_duplicate_result.and.returnValue(true);
        ret = ll.insert_results(binding, ['a']);
        expect(ret).toEqual([]);
        expect(binding.list).toEqual([]);
      });
    });

    describe('#remove_instances', function () {
      let Dummy;
      beforeAll(function () {
        Dummy = can.Map.extend();
        Dummy.model_singular = 'Dummy';
      });

      it('removes no instance when nothing is supplied to remove', function () {
        let instance = new Dummy({id: 3});
        let binding = {list: [{instance: instance, mappings: []}]};
        ll.remove_instance(binding, {}, 'b');
        expect(binding.list).toEqual([{instance: instance, mappings: []}]);
      });

      it("removes no instance when instance doesn't match type", function () {
        let instance = new Dummy({id: 3});
        let WrongClass = can.Map.extend();
        WrongClass.model_singular = 'Wrong';
        let wrongInstance = new WrongClass({id: 3});
        let binding = {list: [{instance: instance, mappings: []}]};
        ll.remove_instance(binding, wrongInstance, 'b');
        expect(binding.list).toEqual([{instance: instance, mappings: []}]);
      });

      it('removes the instance from mappings when matching', function () {
        let instance = new Dummy({id: 3});
        let binding = {list: [{instance: instance, mappings: []}]};
        ll.remove_instance(binding, instance, 'b');
        expect(binding.list).toEqual([]);
      });

      it('removes the instance from mappings on just type and ID match', () => {
        let instance = new Dummy({id: 3});
        let matchingInstance = new Dummy({id: 3});
        let binding = {list: [{instance: instance, mappings: []}]};
        expect(matchingInstance).not.toBe(instance);
        ll.remove_instance(binding, matchingInstance, 'b');
        expect(binding.list).toEqual([]);
      });

      describe('with mappings defined', function () {
        it('deletes only if all mappings are accounted for in instance', () => {
          let instance = new Dummy({id: 3});
          let binding = {
            list: [{
              instance: instance,
              mappings: ['a', 'b'],
              remove_mapping: function (mapping) {
                const idx = this.mappings.indexOf(mapping);
                if (idx !== -1) {
                  this.mappings.splice(idx, 1);
                  return true;
                }
              },
            }],
          };
          ll.remove_instance(binding, instance, ['a', 'b']);
          expect(binding.list).toEqual([]);
        });

        it('does not delete if not all mappings are accounted for', () => {
          let instance = new Dummy({id: 3});
          let binding = {
            list: [{
              instance: instance,
              mappings: ['a', 'b'],
              remove_mapping: function (mapping) {
                let idx = this.mappings.indexOf(mapping);
                if (idx !== -1) {
                  this.mappings.splice(idx, 1);
                  return true;
                }
              },
            }],
          };
          ll.remove_instance(binding, instance, ['a']); // only one of the mappings
          expect(binding.list).toEqual([{
            instance: instance,
            mappings: ['b'],
            remove_mapping: jasmine.any(Function),
          },
          ]);
        });
      });
    });

    describe('#refresh_stubs', function () {
      it('returns promise based on existing deferred, ' +
         'returning binding list, if it exists', function (done) {
        let binding = {list: []};
        let sourceDfd = binding._refresh_stubs_deferred = new $.Deferred();
        let ret = ll.refresh_stubs(binding);
        sourceDfd.resolve();
        ret.done(function (data) {
          expect(data).toBe(binding.list);
          done();
        });
      });

      it('makes new refresh stubs deferred, returning binding list, ' +
         'if it does not already exist', function (done) {
        let ret;
        let binding = {list: []};
        ll._refresh_stubs = jasmine.createSpy().and.returnValue($.when());
        ret = ll.refresh_stubs(binding);
        ret.done(function (data) {
          expect(data).toBe(binding.list);
          done();
        });
        expect(ll._refresh_stubs).toHaveBeenCalled();
      });
    });

    describe('#refresh_instances', function () {
      it('returns promise based on existing deferred, ' +
         'returning binding list, if it exists', function (done) {
        let binding = {list: []};
        let sourceDfd = binding._refresh_instances_deferred = new $.Deferred();
        let ret = ll.refresh_instances(binding);
        sourceDfd.resolve();
        ret.done(function (data) {
          expect(data).toBe(binding.list);
          done();
        });
      });

      it('makes new refresh instances deferred, returning binding list, ' +
         'if it does not already exist', function (done) {
        let ret;
        let binding = {list: []};
        ll._refresh_instances = jasmine.createSpy().and.returnValue($.when());
        ret = ll.refresh_instances(binding);
        ret.done(function (data) {
          expect(data).toBe(binding.list);
          done();
        });
      });
    });

    describe('#_refresh_instances', function () {
      it('returns promise based on binding list', function (done) {
        let ret;
        let binding = {list: [{instance: 'a'}]};
        spyOn(ll, 'refresh_stubs').and.returnValue($.when());
        spyOn(RefreshQueue.prototype, 'trigger').and.callFake(function () {
          return $.when(this.objects);
        });

        ret = ll._refresh_instances(binding);
        ret.done(function (data) {
          expect(data).toEqual(['a']);
          done();
        });
      });
    });
  });

  describe('GGRC.ListLoaders.ReifyingListLoader', function () {
    describe('#init', function () {
      beforeEach(function () {
        spyOn(LL.BaseListLoader.prototype, 'init');
      });

      it('sets source_binding property if binding is a ListBinding', () => {
        let binding = new LL.ListBinding();
        let rll = new LL.ReifyingListLoader(binding);
        expect(rll.source_binding).toBe(binding);
        expect(rll.binding).not.toBeDefined();
      });

      it('sets source property if binding is not a ListBinding', function () {
        let binding = {};
        let rll = new LL.ReifyingListLoader(binding);
        expect(rll.source).toBe(binding);
        expect(rll.source_binding).not.toBeDefined();
      });
    });

    describe('#insert_from_source_binding', function () {
      beforeEach(function () {
        spyOn(RefreshQueue.prototype, 'trigger').and.callFake(function () {
          return $.when(this.objects);
        });
      });

      it('makes a new binding referencing the instance and ' +
         'old mappings', (done) => {
        let rll = new LL.ReifyingListLoader();
        let binding = {};
        let result = rll.make_result({testField: 1}, []);
        spyOn(rll, 'insert_results');

        rll.insert_from_source_binding(binding, [result]).then(() => {
          expect(rll.insert_results).toHaveBeenCalled();
          expect(rll.insert_results.calls.argsFor(0)[1][0])
            .toEqual(jasmine.objectContaining({testField: 1}));
          expect(rll.insert_results.calls.argsFor(1)).toEqual([]);
          done();
        });
      });
    });

    describe('#init_listeners', function () {
      let rll;
      let binding;
      let sourceBinding;

      beforeEach(function () {
        sourceBinding = new LL.ListBinding();
        binding = new LL.ListBinding();
      });
      it('sets up source_binding on the binding from the ' +
         'ReifyingListLoader\'s source_binding, if it exists', function () {
        rll = new LL.ReifyingListLoader(sourceBinding);
        spyOn(rll, 'insert_from_source_binding');
        rll.init_listeners(binding);
        expect(binding.source_binding).toBe(sourceBinding);
        expect(rll.insert_from_source_binding)
          .toHaveBeenCalledWith(binding, sourceBinding.list, 0);
      });

      it('sets up source_binding from the binding via getBinding, ' +
         'if the source_binding property does not exist', function () {
        rll = new LL.ReifyingListLoader('dummy_binding');
        spyOn(rll, 'insert_from_source_binding');
        binding = {};
        spyOn(Mappings, 'getBinding').and.returnValue(sourceBinding);
        rll.init_listeners(binding);
        expect(binding.source_binding).toBe(sourceBinding);
        expect(rll.insert_from_source_binding)
          .toHaveBeenCalledWith(binding, sourceBinding.list, 0);
      });
    });

    describe('listeners', function () {
      let rll;
      let binding;
      let sourceBinding;
      beforeEach(function () {
        sourceBinding = new LL.ListBinding();
        binding = new LL.ListBinding();
        rll = new LL.ReifyingListLoader(sourceBinding);
      });

      describe('source_binding.list add', function () {
        it('calls insert_from_source_binding on the list loader', function () {
          let newResult = new LL.MappingResult({id: 1}, []);
          spyOn(rll, 'insert_from_source_binding');
          rll.init_listeners(binding);
          sourceBinding.list.push(newResult);
          expect(rll.insert_from_source_binding)
            .toHaveBeenCalledWith(binding, [newResult], 0);
        });
      });

      describe('source_binding.list remove', function () {
        it('calls remove_instance on the list loader for each item', () => {
          let newResult = new LL.MappingResult({id: 1}, []);
          spyOn(RefreshQueue.prototype, 'trigger').and.returnValue($.when()); // Avoid AJAX
          spyOn(rll, 'remove_instance');
          binding.list.push(newResult);
          sourceBinding.list.push(newResult);
          rll.init_listeners(binding);
          sourceBinding.list.shift();
          expect(rll.remove_instance)
            .toHaveBeenCalledWith(binding, newResult.instance, newResult);
        });
      });
    });
  });
});
