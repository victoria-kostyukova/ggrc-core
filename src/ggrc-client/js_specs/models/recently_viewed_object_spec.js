/*
    Copyright (C) 2018 Google Inc.
    Licensed under http://www.apache.org/licenses/LICENSE-2.0 <see LICENSE file>
*/
/* global RVO */

import RecentlyViewedObject from '../../js/models/local-storage/recently-viewed-object';

describe('RecentlyViewedObject model', () => {
  describe('::newInstance', () => {
    it('creates a new recently viewed object given non-Model instance', () => {
      let obj = RecentlyViewedObject.newInstance({foo: 'bar'});
      expect(obj.foo).toBe('bar');
      expect(obj instanceof RecentlyViewedObject).toBeTruthy();
    });

    it('references original Model type when passed in as argument', () => {
      spyOn(RecentlyViewedObject.prototype, 'init');
      can.Model('RVO');
      let obj = new RVO({
        viewLink: '/',
        title: 'blah',
      });
      let rvo = RecentlyViewedObject.newInstance(obj);
      expect(rvo.type).toBe('RVO');
      expect(rvo.model).toBe(RVO);
      expect(rvo.viewLink).toBe('/');
      expect(rvo.title).toBe('blah');
    });
  });
});
