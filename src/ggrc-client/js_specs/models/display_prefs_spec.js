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

  let displayPrefs;
  beforeAll(function () {
    displayPrefs = makeFakeInstance({model: DisplayPrefs})();
  });

  afterEach(function () {
    displayPrefs.removeAttr(window.location.pathname);
    displayPrefs.isNew() || displayPrefs.destroy();
  });

  describe('#init', function () {
    it('sets autoupdate to true by default', function () {
      expect(displayPrefs.autoupdate).toBe(true);
    });

  });

  describe('low level accessors', function () {
    beforeEach(function () {
      displayPrefs.attr('foo', 'bar');
    });

    afterEach(function () {
      displayPrefs.removeAttr('foo');
      displayPrefs.removeAttr('baz');
    });

    describe('#makeObject', function () {

      it('returns the model itself with no args', function () {
        expect(displayPrefs.makeObject()).toBe(displayPrefs);
      });

      it('returns an empty can.Observe when the key does not resolve ' +
         'to an Observable', function () {
        expect(displayPrefs.makeObject('foo')).not.toBe('bar');
        let newVal = displayPrefs.makeObject('baz');
        expect(newVal instanceof can.Observe).toBeTruthy();
        expect(newVal.serialize()).toEqual({});
      });

      it('makes a nested path of can.Observes when the key has ' +
         'multiple levels', function () {
        displayPrefs.makeObject('baz', 'quux');
        expect(displayPrefs.baz.quux instanceof can.Observe).toBeTruthy();
      });

    });

    describe('#getObject', function () {
      it('returns a set value whether or not the value is an ' +
         'Observe', function () {
        expect(displayPrefs.getObject('foo')).toBe('bar');
        displayPrefs.makeObject('baz', 'quux');
        expect(displayPrefs.getObject('baz').serialize()).toEqual({quux: {}});
      });

      it('returns undefined when the key is not found', function () {
        expect(displayPrefs.getObject('xyzzy')).not.toBeDefined();
      });
    });
  });

  describe('#setCollapsed', function () {
    afterEach(function () {
      displayPrefs.removeAttr(exp.COLLAPSE);
      displayPrefs.removeAttr(exp.path);
    });

    it('sets the collapse value for a widget', function () {
      displayPrefs.setCollapsed('this arg is ignored', 'foo', true);
      expect(displayPrefs.attr(`${exp.path}.${exp.COLLAPSE}.foo`)).toBe(true);
    });
  });

  function getSpecs(func, token, fooValue, barValue) {
    let fooMatcher = typeof fooValue === 'object' ? 'toEqual' : 'toBe';
    let barMatcher = typeof barValue === 'object' ? 'toEqual' : 'toBe';

    return function () {
      function getTest() {
        let fooActual = displayPrefs[func]('unit_test', 'foo');
        let barActual = displayPrefs[func]('unit_test', 'bar');

        expect(fooActual.serialize ? fooActual.serialize() :
          fooActual)[fooMatcher](fooValue);
        expect(barActual.serialize ? barActual.serialize() :
          barActual)[barMatcher](barValue);
      }

      let expToken;
      beforeEach(function () {
        expToken = exp[token]; // late binding b/c not available when describe block is created
      });

      // TODO: figure out why these fail, error is "can.Map: Object does not exist thrown"
      describe('when set for a page', function () {
        beforeEach(function () {
          displayPrefs.makeObject(exp.path, expToken).attr('foo', fooValue);
          displayPrefs.makeObject(exp.path, expToken).attr('bar', barValue);
        });
        afterEach(function () {
          displayPrefs.removeAttr(exp.path);
        });

        it('returns the value set for the page', getTest);
      });

      describe('when not set for a page', function () {
        beforeEach(function () {
          displayPrefs.makeObject(expToken, 'unit_test')
            .attr('foo', fooValue);
          displayPrefs.makeObject(expToken, 'unit_test')
            .attr('bar', barValue);
        });
        afterEach(function () {
          displayPrefs.removeAttr(exp.path);
          displayPrefs.removeAttr(expToken);
        });

        it('returns the value set for the page type default', getTest);

        it('sets the default value as the page value', function () {
          displayPrefs[func]('unit_test', 'foo');
          let fooActual = displayPrefs.attr(`${exp.path}.${expToken}.foo`);
          expect(fooActual.serialize ? fooActual.serialize() :
            fooActual)[fooMatcher](fooValue);
        });
      });
    };
  }

  describe('#getCollapsed', getSpecs('getCollapsed', 'COLLAPSE', true, false));

  describe('#getSorts', getSpecs(
    'getSorts', 'SORTS', ['baz, quux'], ['thud', 'jeek']));


  function setSpecs(func, token, fooValue, barValue) {
    return function () {
      let expToken;
      beforeEach(function () {
        expToken = exp[token];
      });
      afterEach(function () {
        displayPrefs.removeAttr(expToken);
        displayPrefs.removeAttr(exp.path);
      });


      it('sets the value for a widget', function () {
        displayPrefs[func]('this arg is ignored', 'foo', fooValue);
        let fooActual = displayPrefs.attr(`${exp.path}.${expToken}.foo`);
        expect(fooActual.serialize ? fooActual.serialize() :
          fooActual).toEqual(fooValue);
      });

      it('sets all values as a collection', function () {
        displayPrefs[func]('this arg is ignored',
          {foo: fooValue, bar: barValue});
        let fooActual = displayPrefs.attr(`${exp.path}.${expToken}.foo`);
        let barActual = displayPrefs.attr(`${exp.path}.${expToken}.bar`);
        expect(fooActual.serialize ? fooActual.serialize() :
          fooActual).toEqual(fooValue);
        expect(barActual.serialize ? barActual.serialize() :
          barActual).toEqual(barValue);
      });
    };
  }

  describe('#setSorts', setSpecs(
    'setSorts', 'SORTS', ['bar', 'baz'], ['thud', 'jeek']));

  describe('Set/Reset functions', function () {

    describe('#resetPagePrefs', function () {

      beforeEach(function () {
        can.each([exp.SORTS, exp.COLLAPSE], function (expToken) {
          displayPrefs.makeObject(expToken, 'unit_test').attr('foo', 'bar'); // page type defaults
          displayPrefs.makeObject(exp.path, expToken).attr('foo', 'baz'); // page custom settings
        });
      });
      afterEach(function () {
        displayPrefs.removeAttr(exp.path);
        can.each([exp.SORTS, exp.COLLAPSE], function (expToken) {
          displayPrefs.removeAttr(expToken);
        });
      });

      it('sets the page layout to the default for the page type', function () {
        displayPrefs.resetPagePrefs();
        can.each(['getSorts', 'getCollapsed'], function (func) {
          expect(displayPrefs[func]('unit_test', 'foo')).toBe('bar');
        });
      });

    });

    describe('#setPageAsDefault', function () {
      beforeEach(function () {
        can.each([exp.SORTS, exp.COLLAPSE], function (expToken) {
          displayPrefs.makeObject(expToken, 'unit_test').attr('foo', 'bar'); // page type defaults
          displayPrefs.makeObject(exp.path, expToken).attr('foo', 'baz'); // page custom settings
        });
      });
      afterEach(function () {
        displayPrefs.removeAttr(exp.path);
        can.each([exp.SORTS, exp.COLLAPSE], function (expToken) {
          displayPrefs.removeAttr(expToken);
        });
      });

      it('sets the page layout to the default for the page type', function () {
        displayPrefs.setPageAsDefault('unit_test');
        can.each([exp.SORTS, exp.COLLAPSE], function (expToken) {
          expect(displayPrefs.attr(`${expToken}.unit_test.foo`)).toBe('baz');
        });
      });

      it('keeps the page and the defaults separated', function () {
        displayPrefs.setPageAsDefault('unit_test');
        can.each(['setCollapsed', 'setSorts'], function (func) {
          displayPrefs[func]('unit_test', 'foo', 'quux');
        });
        can.each([exp.SORTS, exp.COLLAPSE], function (expToken) {
          expect(displayPrefs.attr(`${expToken}.unit_test.foo`)).toBe('baz');
        });
      });

    });

  });

  describe('#findAll', function () {
    let dpNoVersion;
    let dpOutdated;
    let dpCurrent;
    beforeEach(function () {
      const instanceCreator = makeFakeInstance({
        model: DisplayPrefs,
      });
      dpNoVersion = instanceCreator();
      dpOutdated = instanceCreator({version: 1});
      dpCurrent = instanceCreator({version: DisplayPrefs.version});

      spyOn(LocalStorage, 'findAll').and.returnValue(
        new $.Deferred().resolve([dpNoVersion, dpOutdated, dpCurrent]));
      spyOn(dpNoVersion, 'destroy');
      spyOn(dpOutdated, 'destroy');
      spyOn(dpCurrent, 'destroy');
    });
    it('deletes any prefs that do not have a version set', function (done) {
      let dfd = DisplayPrefs.findAll().done(function (dps) {
        expect(dps).not.toContain(dpNoVersion);
        expect(dpNoVersion.destroy).toHaveBeenCalled();
      });

      waitsFor(function () { // sanity check --ensure deferred resolves/rejects
        return dfd.state() !== 'pending';
      }, done);
    });
    it('deletes any prefs that have an out of date version', function () {
      DisplayPrefs.findAll().done(function (dps) {
        expect(dps).not.toContain(dpOutdated);
        expect(dpOutdated.destroy).toHaveBeenCalled();
      });
    });
    it('retains any prefs that do not have a version set', function () {
      DisplayPrefs.findAll().done(function (dps) {
        expect(dps).toContain(dpCurrent);
        expect(dpCurrent.destroy).not.toHaveBeenCalled();
      });
    });
  });

  describe('#findOne', function () {
    let dpNoVersion;
    let dpOutdated;
    let dpCurrent;
    beforeEach(function () {
      dpNoVersion = new DisplayPrefs({});
      dpOutdated = new DisplayPrefs({version: 1});
      dpCurrent = new DisplayPrefs({version: DisplayPrefs.version});
    });
    it('404s if the display pref does not have a version set', function (done) {
      spyOn(LocalStorage, 'findOne').and.returnValue(
        new $.Deferred().resolve(dpNoVersion));
      spyOn(dpNoVersion, 'destroy');
      let dfd = DisplayPrefs.findOne().done(function (dps) {
        fail('Should not have resolved findOne for the unversioned ' +
             'display pref');
      }).fail(function (pseudoxhr) {
        expect(pseudoxhr.status).toBe(404);
        expect(dpNoVersion.destroy).toHaveBeenCalled();
      });
      waitsFor(function () { // sanity check --ensure deferred resolves/rejects
        return dfd.state() !== 'pending';
      }, done);
    });
    it('404s if the display pref has an out of date version', function () {
      spyOn(LocalStorage, 'findOne').and.returnValue(
        new $.Deferred().resolve(dpOutdated));
      spyOn(dpOutdated, 'destroy');
      DisplayPrefs.findOne().done(function (dps) {
        fail('Should not have resolved findOne for the outdated display pref');
      }).fail(function (pseudoxhr) {
        expect(pseudoxhr.status).toBe(404);
        expect(dpOutdated.destroy).toHaveBeenCalled();
      });
    });
    it('retains any prefs that do not have a version set', function () {
      spyOn(LocalStorage, 'findOne').and.returnValue(
        new $.Deferred().resolve(dpCurrent));
      spyOn(dpCurrent, 'destroy');
      DisplayPrefs.findOne().done(function (dps) {
        expect(dpCurrent.destroy).not.toHaveBeenCalled();
      }).fail(function () {
        fail('Should have resolved on findOne for the current display pref');
      });
    });
  });

});
