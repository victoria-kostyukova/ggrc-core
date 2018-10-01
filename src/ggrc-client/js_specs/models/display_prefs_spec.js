/*
    Copyright (C) 2018 Google Inc.
    Licensed under http://www.apache.org/licenses/LICENSE-2.0 <see LICENSE file>
*/

import {
  waitsFor,
  makeFakeInstance,
} from '../spec_helpers';
import DisplayPrefs from '../../js/models/local-storage/display-prefs';
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
