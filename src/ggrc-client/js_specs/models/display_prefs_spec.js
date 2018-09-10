/*
    Copyright (C) 2018 Google Inc.
    Licensed under http://www.apache.org/licenses/LICENSE-2.0 <see LICENSE file>
*/

import {
  waitsFor,
  makeFakeInstance,
} from '../spec_helpers';
import DisplayPrefs, * as exp from '../../js/models/local-storage/display-prefs';
import LocalStorage from '../../js/models/local-storage/local-storage';

describe('display prefs model', function () {

  let display_prefs;
  beforeAll(function () {
    display_prefs = makeFakeInstance({model: DisplayPrefs})();
  });

  afterEach(function () {
    display_prefs.removeAttr(window.location.pathname);
    display_prefs.isNew() || display_prefs.destroy();
  });

  describe('#init', function ( ){
    it('sets autoupdate to true by default', function () {
      expect(display_prefs.autoupdate).toBe(true);
    });

  });

  describe('low level accessors', function () {
    beforeEach(function () {
      display_prefs.attr('foo', 'bar');
    });

    afterEach(function () {
      display_prefs.removeAttr('foo');
      display_prefs.removeAttr('baz');
    });

    describe('#makeObject', function () {

      it('returns the model itself with no args', function () {
        expect(display_prefs.makeObject()).toBe(display_prefs);
      });

      it('returns an empty can.Observe when the key does not resolve to an Observable', function () {
        expect(display_prefs.makeObject('foo')).not.toBe('bar');
        let newval = display_prefs.makeObject('baz');
        expect(newval instanceof can.Observe).toBeTruthy();
        expect(newval.serialize()).toEqual({});
      });

      it('makes a nested path of can.Observes when the key has multiple levels', function () {
        let newval = display_prefs.makeObject('baz', 'quux');
        expect(display_prefs.baz.quux instanceof can.Observe).toBeTruthy();
      });

    });

    describe('#getObject', function () {
      it('returns a set value whether or not the value is an Observe', function () {
        expect(display_prefs.getObject('foo')).toBe('bar');
        display_prefs.makeObject('baz', 'quux');
        expect(display_prefs.getObject('baz').serialize()).toEqual({'quux': {}});
      });

      it('returns undefined when the key is not found', function (){
        expect(display_prefs.getObject('xyzzy')).not.toBeDefined();
      });
    });
  });

  describe('#setCollapsed', function () {
    afterEach(function () {
      display_prefs.removeAttr(exp.COLLAPSE);
      display_prefs.removeAttr(exp.path);
    });

    it('sets the collapse value for a widget', function () {
      display_prefs.setCollapsed('this arg is ignored', 'foo', true);

      expect(display_prefs.attr([exp.path, exp.COLLAPSE, 'foo'].join('.'))).toBe(true);
    });
  });

  function getSpecs(func, token, fooValue, barValue) {
    let fooMatcher = typeof fooValue === 'object' ? 'toEqual' : 'toBe';
    let barMatcher = typeof barValue === 'object' ? 'toEqual' : 'toBe';

    return function () {
      function getTest() {
        let fooActual = display_prefs[func]('unit_test', 'foo');
        let barActual = display_prefs[func]('unit_test', 'bar');

        expect(fooActual.serialize ? fooActual.serialize() : fooActual)[fooMatcher](fooValue);
        expect(barActual.serialize ? barActual.serialize() : barActual)[barMatcher](barValue);
      }

      let exp_token;
      beforeEach(function () {
        exp_token = exp[token]; // late binding b/c not available when describe block is created
      });

      // TODO: figure out why these fail, error is "can.Map: Object does not exist thrown"
      describe('when set for a page', function () {
        beforeEach(function () {
          display_prefs.makeObject(exp.path, exp_token).attr('foo', fooValue);
          display_prefs.makeObject(exp.path, exp_token).attr('bar', barValue);
        });
        afterEach(function () {
          display_prefs.removeAttr(exp.path);
        });

        it('returns the value set for the page', getTest);
      });

      describe('when not set for a page', function () {
        beforeEach(function () {
          display_prefs.makeObject(exp_token, 'unit_test').attr('foo', fooValue);
          display_prefs.makeObject(exp_token, 'unit_test').attr('bar', barValue);
        });
        afterEach(function () {
          display_prefs.removeAttr(exp.path);
          display_prefs.removeAttr(exp_token);
        });

        it('returns the value set for the page type default', getTest);

        it('sets the default value as the page value', function () {
          display_prefs[func]('unit_test', 'foo');
          let fooActual = display_prefs.attr([exp.path, exp_token, 'foo'].join('.'));
          expect(fooActual.serialize ? fooActual.serialize() : fooActual)[fooMatcher](fooValue);
        });
      });
    };
  }

  describe('#getCollapsed', getSpecs('getCollapsed', 'COLLAPSE', true, false));

  describe('#getSorts', getSpecs('getSorts', 'SORTS', ['baz, quux'], ['thud', 'jeek']));


  function setSpecs(func, token, fooValue, barValue) {
    return function () {
      let exp_token;
      beforeEach(function () {
        exp_token = exp[token];
      });
      afterEach(function () {
        display_prefs.removeAttr(exp_token);
        display_prefs.removeAttr(exp.path);
      });


      it('sets the value for a widget', function () {
        display_prefs[func]('this arg is ignored', 'foo', fooValue);
        let fooActual = display_prefs.attr([exp.path, exp_token, 'foo'].join('.'));
        expect(fooActual.serialize ? fooActual.serialize() : fooActual).toEqual(fooValue);
      });

      it('sets all values as a collection', function () {
        display_prefs[func]('this arg is ignored', {'foo': fooValue, 'bar': barValue});
        let fooActual = display_prefs.attr([exp.path, exp_token, 'foo'].join('.'));
        let barActual = display_prefs.attr([exp.path, exp_token, 'bar'].join('.'));
        expect(fooActual.serialize ? fooActual.serialize() : fooActual).toEqual(fooValue);
        expect(barActual.serialize ? barActual.serialize() : barActual).toEqual(barValue);
      });
    };
  }

  describe('#setSorts', setSpecs('setSorts', 'SORTS', ['bar', 'baz'], ['thud', 'jeek']));

  describe('Set/Reset functions', function () {

    describe('#resetPagePrefs', function () {

      beforeEach(function () {
        can.each([exp.SORTS, exp.COLLAPSE], function (exp_token) {
          display_prefs.makeObject(exp_token, 'unit_test').attr('foo', 'bar'); // page type defaults
          display_prefs.makeObject(exp.path, exp_token).attr('foo', 'baz'); // page custom settings
        });
      });
      afterEach(function () {
        display_prefs.removeAttr(exp.path);
        can.each([exp.SORTS, exp.COLLAPSE], function (exp_token) {
          display_prefs.removeAttr(exp_token);
        });
      });

      it('sets the page layout to the default for the page type', function () {
        display_prefs.resetPagePrefs();
        can.each(['getSorts', 'getCollapsed'], function (func) {
          expect(display_prefs[func]('unit_test', 'foo')).toBe('bar');
        });
      });

    });

    describe('#setPageAsDefault', function () {
      beforeEach(function () {
        can.each([exp.SORTS, exp.COLLAPSE], function (exp_token) {
          display_prefs.makeObject(exp_token, 'unit_test').attr('foo', 'bar'); // page type defaults
          display_prefs.makeObject(exp.path, exp_token).attr('foo', 'baz'); // page custom settings
        });
      });
      afterEach(function () {
        display_prefs.removeAttr(exp.path);
        can.each([exp.SORTS, exp.COLLAPSE], function (exp_token) {
          display_prefs.removeAttr(exp_token);
        });
      });

      it('sets the page layout to the default for the page type', function () {
        display_prefs.setPageAsDefault('unit_test');
        can.each([exp.SORTS, exp.COLLAPSE], function (exp_token) {
          expect(display_prefs.attr([exp_token, 'unit_test', 'foo'].join('.'))).toBe('baz');
        });
      });

      it('keeps the page and the defaults separated', function () {
        display_prefs.setPageAsDefault('unit_test');
        can.each(['setCollapsed', 'setSorts'], function (func) {
          display_prefs[func]('unit_test', 'foo', 'quux');
        });
        can.each([exp.SORTS, exp.COLLAPSE], function (exp_token) {
          expect(display_prefs.attr([exp_token, 'unit_test', 'foo'].join('.'))).toBe('baz');
        });
      });

    });

  });

  describe('#findAll', function () {
    let dp_noversion;
    let dp2_outdated;
    let dp3_current;
    beforeEach(function () {
      const instanceCreator = makeFakeInstance({
        model: DisplayPrefs
      });
      dp_noversion = instanceCreator();
      dp2_outdated = instanceCreator({version: 1});
      dp3_current = instanceCreator({version: DisplayPrefs.version});

      spyOn(LocalStorage, 'findAll').and.returnValue(new $.Deferred().resolve([dp_noversion, dp2_outdated, dp3_current]));
      spyOn(dp_noversion, 'destroy');
      spyOn(dp2_outdated, 'destroy');
      spyOn(dp3_current, 'destroy');
    });
    it('deletes any prefs that do not have a version set', function (done) {
      let dfd = DisplayPrefs.findAll().done(function (dps) {
        expect(dps).not.toContain(dp_noversion);
        expect(dp_noversion.destroy).toHaveBeenCalled();
      });

      waitsFor(function () { // sanity check --ensure deferred resolves/rejects
        return dfd.state() !== 'pending';
      }, done);
    });
    it('deletes any prefs that have an out of date version', function () {
      DisplayPrefs.findAll().done(function (dps) {
        expect(dps).not.toContain(dp2_outdated);
        expect(dp2_outdated.destroy).toHaveBeenCalled();
      });
    });
    it('retains any prefs that do not have a version set', function () {
      DisplayPrefs.findAll().done(function (dps) {
        expect(dps).toContain(dp3_current);
        expect(dp3_current.destroy).not.toHaveBeenCalled();
      });
    });
  });

  describe('#findOne', function () {
    let dp_noversion;
    let dp2_outdated;
    let dp3_current;
    beforeEach(function () {
      dp_noversion = new DisplayPrefs({});
      dp2_outdated = new DisplayPrefs({version: 1});
      dp3_current = new DisplayPrefs({version: DisplayPrefs.version});
    });
    it('404s if the display pref does not have a version set', function (done) {
      spyOn(LocalStorage, 'findOne').and.returnValue(new $.Deferred().resolve(dp_noversion));
      spyOn(dp_noversion, 'destroy');
      let dfd = DisplayPrefs.findOne().done(function (dps) {
        fail('Should not have resolved findOne for the unversioned display pref');
      }).fail(function (pseudoxhr) {
        expect(pseudoxhr.status).toBe(404);
        expect(dp_noversion.destroy).toHaveBeenCalled();
      });
      waitsFor(function () { // sanity check --ensure deferred resolves/rejects
        return dfd.state() !== 'pending';
      }, done);
    });
    it('404s if the display pref has an out of date version', function () {
      spyOn(LocalStorage, 'findOne').and.returnValue(new $.Deferred().resolve(dp2_outdated));
      spyOn(dp2_outdated, 'destroy');
      DisplayPrefs.findOne().done(function (dps) {
        fail('Should not have resolved findOne for the outdated display pref');
      }).fail(function (pseudoxhr) {
        expect(pseudoxhr.status).toBe(404);
        expect(dp2_outdated.destroy).toHaveBeenCalled();
      });
    });
    it('retains any prefs that do not have a version set', function () {
      spyOn(LocalStorage, 'findOne').and.returnValue(new $.Deferred().resolve(dp3_current));
      spyOn(dp3_current, 'destroy');
      DisplayPrefs.findOne().done(function (dps) {
        expect(dp3_current.destroy).not.toHaveBeenCalled();
      }).fail(function () {
        fail('Should have resolved on findOne for the current display pref');
      });
    });
  });

});
