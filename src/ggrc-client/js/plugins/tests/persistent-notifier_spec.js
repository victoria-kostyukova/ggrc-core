/*
    Copyright (C) 2020 Google Inc.
    Licensed under http://www.apache.org/licenses/LICENSE-2.0 <see LICENSE file>
*/

import PersistentNotifier from '../persistent-notifier';

describe('PersistentNotifier class', () => {
  describe('constructor', () => {
    it('defines empty array "dfds"', () => {
      let pn = new PersistentNotifier();

      expect(pn.dfds).toEqual([]);
    });

    it('defines empty array "onEmptyCallbacksList"', () => {
      let pn = new PersistentNotifier();

      expect(pn.onEmptyCallbacksList).toEqual([]);
    });

    it('assigns additional options passed as param ' +
    'and overrides the same fields', () => {
      let options = {
        option1: 'option1',
        dfds: [1, 2, 3],
      };
      let pn = new PersistentNotifier(options);

      expect(pn).toEqual(jasmine.objectContaining(Object.assign({
        dfds: [],
        onEmptyCallbacksList: [],
      }, options)));
    });
  });

  describe('methods', () => {
    let pn;
    let hasElementsSpy;
    let whenEmptiesSpy;
    let callbackSpy;

    beforeEach(() => {
      hasElementsSpy = jasmine.createSpy('whileQueueHasElements');
      whenEmptiesSpy = jasmine.createSpy('whenQueueEmpties');
      callbackSpy = jasmine.createSpy('callbackSpy');
      pn = new PersistentNotifier({
        whileQueueHasElements: hasElementsSpy,
        whenQueueEmpties: whenEmptiesSpy,
      });
    });

    describe('queue(dfd) method', () => {
      it('throws error if dfd is not passed', () => {
        expect(() => {
          pn.queue();
        }).toThrow(new Error('Attempted to queue something other than a ' +
          'Deferred'));
      });

      it('throws error if dfd is not Deferred', () => {
        expect(() => {
          pn.queue({});
        }).toThrow(new Error('Attempted to queue something other than a ' +
          'Deferred'));
      });

      it('pushes "dfd" into "dfds"', () => {
        let dfd = $.Deferred();
        pn.queue(dfd);

        expect(pn.dfds).toEqual([dfd]);
      });

      it('does not push "dfd" if it is already in "dfds"', () => {
        let dfd = $.Deferred();
        pn.queue(dfd);
        pn.queue(dfd);

        expect(pn.dfds).toEqual([dfd]);
      });

      it('calls whileQueueHasElements()', () => {
        pn.queue($.Deferred());

        expect(hasElementsSpy).toHaveBeenCalled();
      });

      it('does not call whileQueueHasElements() ' +
      'if there is pending onEmpty callbacks', () => {
        pn.queue($.Deferred());
        pn.onEmpty(callbackSpy);
        pn.queue($.Deferred());

        expect(hasElementsSpy.calls.count()).toEqual(1);
      });

      it('does not call whileQueueHasElements() ' +
      'if pushed dfd was originally resolved', () => {
        pn.queue($.Deferred().resolve());
        pn.onEmpty(callbackSpy);

        expect(hasElementsSpy).not.toHaveBeenCalled();
      });

      it('calls _whenDeferredResolved(dfd) when dfd was resolved', () => {
        spyOn(pn, '_whenDeferredResolved');

        let dfd = $.Deferred();
        pn.queue(dfd);

        dfd.resolve();
        dfd.always(() => {
          expect(pn._whenDeferredResolved).toHaveBeenCalledWith(dfd);
        });
      });

      it('calls _whenDeferredResolved(dfd) when dfd was rejected', () => {
        spyOn(pn, '_whenDeferredResolved');

        let dfd = $.Deferred();
        pn.queue(dfd);

        dfd.reject();
        dfd.always(() => {
          expect(pn._whenDeferredResolved).toHaveBeenCalledWith(dfd);
        });
      });
    });

    describe('_whenDeferredResolved(dfd) method', () => {
      it('removes "dfd" from "dfds"', () => {
        let dfd = $.Deferred();
        pn.dfds.push($.Deferred(), dfd);

        pn._whenDeferredResolved(dfd);

        expect(pn.dfds).not.toEqual(jasmine.arrayContaining([dfd]));
        expect(pn.dfds.length).toBe(1);
      });

      describe('if "dfds" is empty after removal of dfd', () => {
        it('calls each function in onEmptyCallbacksList', () => {
          let dfd = $.Deferred();
          pn.dfds.push(dfd);
          let spyList = [jasmine.createSpy(), jasmine.createSpy()];
          pn.onEmptyCallbacksList = spyList;

          pn._whenDeferredResolved.bind(pn, dfd)();

          spyList.forEach((spy) => {
            expect(spy).toHaveBeenCalled();
          });
        });

        it('assigns empty array to onEmptyCallbacksList', () => {
          let dfd = $.Deferred();
          pn.dfds.push(dfd);
          let spyList = [jasmine.createSpy(), jasmine.createSpy()];
          pn.onEmptyCallbacksList = spyList;

          pn._whenDeferredResolved(dfd);

          expect(pn.onEmptyCallbacksList).toEqual([]);
        });

        it('calls whenQueueEmpties()', () => {
          let dfd = $.Deferred();
          pn.dfds.push(dfd);

          pn._whenDeferredResolved(dfd);

          expect(pn.whenQueueEmpties).toHaveBeenCalled();
        });
      });

      it('does not call whenQueueEmpties() if "dfds" is not empty ' +
      'after removal of "dfd"', () => {
        let dfd = $.Deferred();
        pn.dfds.push($.Deferred(), dfd);

        pn._whenDeferredResolved(dfd);

        expect(pn.whenQueueEmpties).not.toHaveBeenCalled();
      });
    });

    describe('onEmpty(fn) method', () => {
      let fn;

      beforeEach(() => {
        fn = jasmine.createSpy('fn');
      });

      it('calls fn if "dfds" is empty', () => {
        pn.dfds = [];

        pn.onEmpty(fn);

        expect(fn).toHaveBeenCalled();
      });

      describe('if "dfds" is not empty', () => {
        beforeEach(() => {
          pn.dfds = [$.Deferred()];
        });

        it('does not calls fn', () => {
          pn.onEmpty(fn);

          expect(fn).not.toHaveBeenCalled();
        });

        it('pushes "fn" into "onEmptyCallbacksList"', () => {
          pn.onEmpty(fn);

          expect(pn.onEmptyCallbacksList).toEqual([fn]);
        });

        it('does not push "fn" into "onEmptyCallbacksList"' +
        'if list already has "fn"', () => {
          pn.onEmpty(fn);
          pn.onEmpty(fn);

          expect(pn.onEmptyCallbacksList).toEqual([fn]);
        });
      });
    });
  });
});
