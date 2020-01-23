/*
  Copyright (C) 2020 Google Inc.
  Licensed under http://www.apache.org/licenses/LICENSE-2.0 <see LICENSE file>
*/

import canMap from 'can-map';
import ModalsController from '../modals/modals-controller';
import * as NotifiersUtils from '../../plugins/utils/notifiers-utils';
import Person from '../../models/business-models/person';
import * as ModalsUtils from '../../../js/plugins/utils/modals';
import * as ModelsUtils from '../../../js/plugins/utils/models-utils';
import * as currentPageUtils from '../../plugins/utils/current-page-utils';

describe('ModalsController', function () {
  let Ctrl; // the controller under test
  let cacheBackup;

  beforeAll(function () {
    Ctrl = ModalsController;
    cacheBackup = Person.cache;
    Person.cache = {};
  });

  afterAll(function () {
    Person.cache = cacheBackup;
  });

  describe('init() method', () => {
    let ctrlInst;
    let init;

    beforeEach(() => {
      let html = [
        '<div>',
        '  <div class="modal-body"></div>',
        '</div>',
      ].join('');

      let $el = $(html);

      ctrlInst = {
        options: new canMap({}),
        element: $el,
        after_preload: jasmine.createSpy(),
      };

      init = Ctrl.prototype.init.bind(ctrlInst);
    });

    it('calls after_preload when promise from fetchCurrentUser has resolved',
      (done) => {
        let dfdFetchUser = new $.Deferred().resolve();
        ctrlInst.fetchCurrentUser =
          jasmine.createSpy()
            .and.returnValue(dfdFetchUser);

        init();

        expect(ctrlInst.fetchCurrentUser).toHaveBeenCalled();
        dfdFetchUser.then(() => {
          expect(ctrlInst.after_preload).toHaveBeenCalled();
          done();
        });
      }
    );
  });

  describe('fetchCurrentUser() method', () => {
    let fetchCurrentUser;
    let origCurrentUser;
    let cachedUser;

    beforeAll(() => {
      origCurrentUser = GGRC.current_user;

      cachedUser = {
        id: 33345,
        data: 'asdasd',
        email: 'john@doe.com',
      };
    });

    beforeEach(() => {
      fetchCurrentUser = Ctrl.prototype.fetchCurrentUser;
      GGRC.current_user = {
        id: 12345,
      };

      spyOn(Person, 'findOne').and.returnValue(
        $.Deferred().resolve(cachedUser)
      );
    });

    afterAll(() => {
      GGRC.current_user = origCurrentUser;
    });

    it('fetchs current user if he doesn\'t is yet in cache', (done) => {
      fetchCurrentUser(null)
        .then((response) => {
          expect(response).toEqual({
            id: 33345,
            data: 'asdasd',
            email: 'john@doe.com',
          });
          expect(Person.findOne)
            .toHaveBeenCalledWith({id: GGRC.current_user.id});
          done();
        });
    });

    it('fetchs current user if he is only partially in cache', (done) => {
      const currentUser = {
        id: GGRC.current_user.id,
        email: '',
        refresh: jasmine.createSpy().and.returnValue(
          $.Deferred().resolve(cachedUser)
        ),
      };

      fetchCurrentUser(currentUser)
        .then((response) => {
          expect(response).toEqual({
            id: 33345,
            data: 'asdasd',
            email: 'john@doe.com',
          });
          expect(currentUser.refresh).toHaveBeenCalled();
          done();
        });
    });

    it('does not wait for fetching the current user if already in cache',
      (done) => {
        const currentUser = {...cachedUser, refresh: jasmine.createSpy()};

        fetchCurrentUser(currentUser)
          .then((response) => {
            expect(response).toEqual(currentUser);
            expect(currentUser.refresh).not.toHaveBeenCalled();
            expect(Person.findOne).not.toHaveBeenCalled();
            done();
          });
      });
  });

  describe('save_error method', function () {
    let method;
    let foo;
    let ctrlInst;

    beforeEach(function () {
      ctrlInst = jasmine.createSpyObj(['disableEnableContentUI']);
      foo = jasmine.createSpy();
      spyOn(NotifiersUtils, 'notifier');
      spyOn(NotifiersUtils, 'notifierXHR')
        .and.returnValue(foo);
      spyOn(window, 'clearTimeout');
      method = Ctrl.prototype.save_error.bind(ctrlInst);
    });
    it('calls notifierXHR with response' +
    ' if error status is not 409', function () {
      const response = {status: 400, responseText: 'mockText'};
      method({}, response);
      expect(NotifiersUtils.notifierXHR)
        .toHaveBeenCalledWith('error', response);
    });
    it('clears timeout of error warning if error status is 409', function () {
      method({}, {status: 409, warningId: 999});
      expect(clearTimeout).toHaveBeenCalledWith(999);
    });
    it('calls notifierXHR with response' +
    ' if error status is 409', function () {
      let error = {status: 409};
      method({}, error);
      expect(NotifiersUtils.notifierXHR)
        .toHaveBeenCalledWith('warning', error);
    });

    it('calls "disableEnableContentUI" method', () => {
      method();
      expect(ctrlInst.disableEnableContentUI).toHaveBeenCalledWith(false);
    });
  });

  describe('reset_form() method', () => {
    let ctrlInst;
    let method;
    let instance;
    let setFieldsCb;

    beforeEach(function () {
      instance = new canMap();
      ctrlInst = {
        wasDestroyed: jasmine.createSpy('wasDestroyed'),
        element: {
          trigger: jasmine.createSpy('trigger'),
        },
        options: {
          new_object_form: 'mock1',
          object_params: 'mock2',
        },
      };
      method = Ctrl.prototype.reset_form.bind(ctrlInst);
    });

    describe('if modal was not destroyed', () => {
      beforeEach(() => {
        ctrlInst.wasDestroyed.and.returnValue(false);
      });

      it('calls setFieldsCb() if it is function', (done) => {
        setFieldsCb = function () {
          done();
        };

        method(instance, setFieldsCb);
      });

      it('triggers loaded event', () => {
        method(instance);

        expect(ctrlInst.element.trigger).toHaveBeenCalledWith('loaded');
      });

      it('calls formPreload of instance if it is defined', () => {
        let pageInstance = {};
        spyOn(currentPageUtils, 'getPageInstance')
          .and.returnValue(pageInstance);
        instance.formPreload = jasmine.createSpy();

        method(instance);

        expect(instance.formPreload).toHaveBeenCalledWith(
          ctrlInst.options.new_object_form,
          ctrlInst.options.object_params,
          pageInstance
        );
      });

      describe('if formPreload returns deferred', () => {
        let formPreloadDfd;

        beforeEach(() => {
          formPreloadDfd = $.Deferred();
          instance.backup = jasmine.createSpy('backup');
          instance.formPreload = jasmine.createSpy('formPreload').and
            .returnValue(formPreloadDfd);
        });

        it('calls instance.backup() when resolved', (done) => {
          let methodChain = method(instance);

          formPreloadDfd.resolve().then(() => {
            methodChain.then(() => {
              expect(instance.backup).toHaveBeenCalled();
              done();
            });
          });
        });

        it('returns formPreloadDfd', () => {
          expect(method(instance)).toBe(formPreloadDfd);
        });
      });

      it('returns resolved deferred if formPreload is not defined', (done) => {
        method(instance).done(() => {
          done();
        });
      });
    });

    it('sets new canMap object into _transient ' +
    'if it is not defined', () => {
      instance.attr('_transient', undefined);

      method(instance);

      expect(instance.attr('_transient') instanceof canMap).toBe(true);
      expect(instance.attr('_transient').serialize()).toEqual({});
    });

    it('does not change _transient if it is  defined', () => {
      let transient = 123;
      instance.attr('_transient', transient);

      method(instance);

      expect(instance.attr('_transient')).toBe(transient);
    });
  });

  describe('new_instance method', () => {
    let ctrlInst;
    let method;
    let newInstance;
    let resetFormDfd;

    beforeEach(function () {
      newInstance = new canMap();
      resetFormDfd = $.Deferred();
      ctrlInst = {
        prepareInstance: jasmine.createSpy('prepareInstance').and
          .returnValue(newInstance),
        reset_form: jasmine.createSpy('reset_form').and
          .returnValue(resetFormDfd),
        afterResetForm: jasmine.createSpy('afterPrepare'),
        apply_object_params: jasmine.createSpy('apply_object_params'),
        serialize_form: jasmine.createSpy('serialize_form'),
        restore_ui_status: jasmine.createSpy('restore_ui_status'),
        options: new canMap(),
      };
      method = Ctrl.prototype.new_instance.bind(ctrlInst);
    });

    it('calls reset_form() with new prepared instance', (done) => {
      resetFormDfd.resolve();

      method();

      expect(ctrlInst.reset_form).toHaveBeenCalledWith(
        newInstance, jasmine.any(Function));
      done();
    });

    it('assigns new instance into controller options', (done) => {
      ctrlInst.options.attr('instance', null);

      method();

      resetFormDfd.done(() => {
        expect(ctrlInst.options.attr('instance')).toBe(newInstance);
        done();
      });

      resetFormDfd.resolve();
    });

    it('calls apply_object_params()', (done) => {
      method();

      resetFormDfd.then(() => {
        expect(ctrlInst.apply_object_params).toHaveBeenCalled();
        done();
      });

      resetFormDfd.resolve();
    });

    it('calls serialize_form()', (done) => {
      method();

      resetFormDfd.then(() => {
        expect(ctrlInst.serialize_form).toHaveBeenCalled();
        done();
      });

      resetFormDfd.resolve();
    });

    it('calls instance.backup()', (done) => {
      method();

      resetFormDfd.done(() => {
        ctrlInst.options.attr('instance').backup = jasmine.createSpy();
      }).then(() => {
        expect(ctrlInst.options.attr('instance').backup).toHaveBeenCalled();
        done();
      });

      resetFormDfd.resolve();
    });
  });

  describe('triggerSave() method', () => {
    let ctrlInst;
    let triggerSave;

    beforeEach(() => {
      ctrlInst = {
        element: {
          find: jasmine.createSpy()
            .withArgs('a.btn[data-toggle=modal-submit]')
            .and.returnValue('saveCloseBtn')
            .withArgs('.modal-dismiss > .fa-times')
            .and.returnValue('modalCloseBtn')
            .withArgs('a.btn[data-toggle=modal-ajax-deleteform]')
            .and.returnValue('deleteBtn')
            .withArgs('a.btn[data-toggle=modal-submit-addmore]')
            .and.returnValue('saveAddmoreBtn'),
          data: jasmine.createSpy()
            .withArgs('modal_form')
            .and.returnValue({
              $backdrop: 'modalBackdrop',
            }),
        },
        options: new canMap({
          instance: 'instance',
          new_object_form: 'new_object_form',
        }),
      };

      triggerSave = Ctrl.prototype.triggerSave.bind(ctrlInst);
    });

    it('calls wasDestroyed() method', () => {
      ctrlInst.wasDestroyed = jasmine.createSpy().and.returnValue(true);

      triggerSave();

      expect(ctrlInst.wasDestroyed).toHaveBeenCalled();
    });

    it('does nothing if wasDestroyed() method returns true', () => {
      ctrlInst.wasDestroyed = jasmine.createSpy().and.returnValue(true);
      ctrlInst.disableEnableContentUI = jasmine.createSpy();

      triggerSave();

      expect(ctrlInst.disableEnableContentUI).not.toHaveBeenCalled();
    });

    describe('if wasDestroyed() method returns false', () => {
      let el;
      let dfdSave;

      beforeEach(() => {
        ctrlInst.wasDestroyed = jasmine.createSpy().and.returnValue(false);
        ctrlInst.disableEnableContentUI = jasmine.createSpy();
        spyOn(ModalsUtils, 'bindXHRToButton');
        spyOn(ModalsUtils, 'bindXHRToDisableElement');
        el = $('<div>');
        dfdSave = $.Deferred();
      });

      it('calls disableEnableContentUI() method', () => {
        el.addClass('disabled');

        triggerSave(el);

        expect(ctrlInst.disableEnableContentUI).toHaveBeenCalledWith(true);
      });

      it('does nothing if element has "disabled" class', () => {
        ctrlInst.save_instance = jasmine.createSpy();
        el.addClass('disabled');

        triggerSave(el);

        expect(ctrlInst.save_instance).not.toHaveBeenCalled();
      });

      it('calls save_instance() method', () => {
        ctrlInst.save_instance =
          jasmine.createSpy().and.returnValue(undefined);

        triggerSave(el);

        expect(ctrlInst.save_instance).toHaveBeenCalled();
      });

      it('does nothing if save_instance() method has returned falsy value',
        () => {
          ctrlInst.save_instance =
            jasmine.createSpy().and.returnValue(undefined);

          triggerSave(el);

          expect(ModalsUtils.bindXHRToButton).not.toHaveBeenCalled();
          expect(ModalsUtils.bindXHRToDisableElement).not.toHaveBeenCalled();
        });

      describe('if save_instance() method returns truthy value', () => {
        beforeEach(() => {
          ctrlInst.save_instance =
            jasmine.createSpy().and.returnValue(dfdSave.promise());
        });

        it('calls element.find() and element.data()', () => {
          triggerSave(el);

          expect(ctrlInst.element.find).toHaveBeenCalledWith(
            'a.btn[data-toggle=modal-submit]');
          expect(ctrlInst.element.find).toHaveBeenCalledWith(
            '.modal-dismiss > .fa-times');
          expect(ctrlInst.element.find).toHaveBeenCalledWith(
            'a.btn[data-toggle=modal-ajax-deleteform]');
          expect(ctrlInst.element.find).toHaveBeenCalledWith(
            'a.btn[data-toggle=modal-submit-addmore]');
          expect(ctrlInst.element.data).toHaveBeenCalledWith(
            'modal_form');
          expect(ctrlInst.element.find).toHaveBeenCalledTimes(4);
        });

        it('sets true to "isSaving" attribute of options', () => {
          ctrlInst.options.attr('isSaving', false);

          triggerSave(el);

          expect(ctrlInst.options.attr('isSaving')).toBe(true);
        });

        it('calls bindXHRToButton() util if options has add_more field', () => {
          ctrlInst.options.add_more = {};

          triggerSave(el);

          expect(ModalsUtils.bindXHRToButton).toHaveBeenCalledWith(
            jasmine.any(Promise), 'saveCloseBtn');
          expect(ModalsUtils.bindXHRToButton).toHaveBeenCalledWith(
            jasmine.any(Promise), 'saveAddmoreBtn', 'Saving, please wait...');
        });

        it('calls bindXHRToButton() util' +
         'if options doesn\'t have add_more field', () => {
          triggerSave(el);

          expect(ModalsUtils.bindXHRToButton).toHaveBeenCalledWith(
            jasmine.any(Promise), 'saveCloseBtn', 'Saving, please wait...');
          expect(ModalsUtils.bindXHRToButton).toHaveBeenCalledWith(
            jasmine.any(Promise), 'saveAddmoreBtn');
        });

        it('calls bindXHRToDisableElement() util', () => {
          triggerSave(el);

          expect(ModalsUtils.bindXHRToDisableElement).toHaveBeenCalledWith(
            jasmine.any(Promise), 'deleteBtn');
          expect(ModalsUtils.bindXHRToDisableElement).toHaveBeenCalledWith(
            jasmine.any(Promise), 'modalBackdrop');
          expect(ModalsUtils.bindXHRToDisableElement).toHaveBeenCalledWith(
            jasmine.any(Promise), 'modalCloseBtn');
        });
      });

      describe('if save_instance() has resolved', () => {
        beforeEach(() => {
          ctrlInst.save_instance =
            jasmine.createSpy().and.returnValue(dfdSave.resolve());
          spyOn(ModelsUtils, 'initAuditTitle');
        });

        it('sets false to "isSaving" attribute of options', async () => {
          ctrlInst.options.attr('isSaving', true);

          await triggerSave(el);

          expect(ctrlInst.options.attr('isSaving')).toBe(false);
        });

        it('calls initAuditTitle() util', async () => {
          await triggerSave(el);

          expect(ModelsUtils.initAuditTitle).toHaveBeenCalledWith(
            'instance', 'new_object_form');
        });
      });

      describe('if save_instance() has rejected', () => {
        beforeEach(() => {
          ctrlInst.save_instance =
            jasmine.createSpy().and.returnValue(dfdSave.reject());
          spyOn(ModelsUtils, 'initAuditTitle');
        });

        it('sets false to "isSaving" attribute of options', async () => {
          ctrlInst.options.attr('isSaving', true);

          await triggerSave(el);

          expect(ctrlInst.options.attr('isSaving')).toBe(false);
        });

        it('calls initAuditTitle() util', async () => {
          await triggerSave(el);

          expect(ModelsUtils.initAuditTitle).toHaveBeenCalledWith(
            'instance', 'new_object_form');
        });
      });
    });
  });
});
