/*
  Copyright (C) 2020 Google Inc.
  Licensed under http://www.apache.org/licenses/LICENSE-2.0 <see LICENSE file>
 */

import canMap from 'can-map';
import Component from '../related-urls';
import {getComponentVM} from '../../../../js_specs/spec-helpers';
import * as Permission from '../../../permission';
import * as NotifiersUtils from '../../../plugins/utils/notifiers-utils';
import * as UrlUtils from '../../../plugins/utils/url-utils';

describe('related-urls component', () => {
  let viewModel;
  let instance;

  beforeEach(() => {
    viewModel = getComponentVM(Component);
    instance = {
      isNew: jasmine.createSpy('isNew'),
    };
    viewModel.instance = instance;
  });

  describe('canAddUrl get() method', () => {
    beforeEach(() => {
      spyOn(Permission, 'isAllowedFor');
    });

    it('returns false if user can not update instance', () => {
      Permission.isAllowedFor.and.returnValue(false);
      viewModel.instance.isNew.and.returnValue(false);

      let result = viewModel.canAddUrl;

      expect(result).toBe(false);
    });

    it(`returns false if user can update instance
        but edit is disabled in the component`, () => {
      Permission.isAllowedFor.and.returnValue(true);
      viewModel.instance.isNew.and.returnValue(false);
      viewModel.isNotEditable = true;

      let result = viewModel.canAddUrl;

      expect(result).toBe(false);
    });

    it('returns true if user can update instance and edit is not denied',
      () => {
        Permission.isAllowedFor.and.returnValue(true);
        viewModel.instance.isNew.and.returnValue(false);
        viewModel.isNotEditable = false;

        let result = viewModel.canAddUrl;

        expect(result).toBe(true);
      });

    it('returns true if user creates new instance', () => {
      Permission.isAllowedFor.and.returnValue(false);
      viewModel.instance.isNew.and.returnValue(true);

      let result = viewModel.canAddUrl;

      expect(result).toBe(true);
    });
  });

  describe('canRemoveUrl get() method', () => {
    beforeEach(() => {
      spyOn(Permission, 'isAllowedFor');
    });

    it('returns false if user can not update instance', () => {
      Permission.isAllowedFor.and.returnValue(false);
      viewModel.instance.isNew.and.returnValue(false);

      let result = viewModel.canRemoveUrl;

      expect(result).toBe(false);
    });

    it(`returns false if user can update instance
        but edit is disabled in the component`, () => {
      Permission.isAllowedFor.and.returnValue(true);
      viewModel.instance.isNew.and.returnValue(false);
      viewModel.isNotEditable = true;

      let result = viewModel.canRemoveUrl;

      expect(result).toBe(false);
    });

    it(`returns false if user can update instance, edit is is not denied,
        but removal is disabled by flag`, () => {
      Permission.isAllowedFor.and.returnValue(true);
      viewModel.instance.isNew.and.returnValue(false);
      viewModel.isNotEditable = false;
      viewModel.allowToRemove = false;

      let result = viewModel.canRemoveUrl;

      expect(result).toBe(false);
    });

    it(`returns true if user can update instance, edit is not denied,
        and removal is not disabled`, () => {
      Permission.isAllowedFor.and.returnValue(true);
      viewModel.instance.isNew.and.returnValue(false);
      viewModel.isNotEditable = false;
      viewModel.allowToRemove = true;

      let result = viewModel.canRemoveUrl;

      expect(result).toBe(true);
    });

    it('returns true if user creates instance', () => {
      Permission.isAllowedFor.and.returnValue(false);
      viewModel.instance.isNew.and.returnValue(true);

      let result = viewModel.canRemoveUrl;

      expect(result).toBe(true);
    });
  });

  describe('createUrl() method', () => {
    let method;
    let url;

    beforeEach(() => {
      method = viewModel.createUrl.bind(viewModel);
      url = 'test.url';
    });

    it('should dispatch createUrl event', () => {
      spyOn(viewModel, 'dispatch');
      method(url);
      expect(viewModel.dispatch)
        .toHaveBeenCalledWith({
          type: 'createUrl',
          payload: url,
        });
    });
  });

  describe('removeUrl() method', () => {
    let method;
    let url;

    beforeEach(() => {
      method = viewModel.removeUrl.bind(viewModel);
      url = 'test.url';
      spyOn(viewModel, 'dispatch');
    });

    it('should dispatch removeUrl event', () => {
      method(url);
      expect(viewModel.dispatch)
        .toHaveBeenCalledWith({
          type: 'removeUrl',
          payload: url,
        });
    });
  });

  describe('toggleFormVisibility() method', () => {
    let method;

    beforeEach(() => {
      method = viewModel.toggleFormVisibility.bind(viewModel);
      spyOn(viewModel, 'moveFocusToInput');
    });

    it('should set new value for form visibility', () => {
      viewModel.isFormVisible = true;
      method(false);
      expect(viewModel.isFormVisible).toEqual(false);
    });

    it('should clear create url form input by default', () => {
      viewModel.value = 'foobar';
      method(true);
      expect(viewModel.value).toEqual('');
    });

    it('does not clear input field value if instructed to do so', () => {
      viewModel.value = 'foobar';
      method(true, true);
      expect(viewModel.value).toEqual('foobar');
    });

    it('should set focus to form input field if visible', () => {
      viewModel.isFormVisible = false;
      method(true);
      expect(viewModel.moveFocusToInput).toHaveBeenCalled();
    });
  });

  describe('submitCreateUrlForm() method', () => {
    let method;

    beforeEach(() => {
      method = viewModel.submitCreateUrlForm.bind(viewModel);
      spyOn(viewModel, 'createUrl');
      spyOn(viewModel, 'toggleFormVisibility');
      spyOn(NotifiersUtils, 'notifier');
    });

    describe('in case of non-empty input', () => {
      let url = 'www.test.url';

      beforeEach(() => {
        viewModel.urls = [];
        spyOn(UrlUtils, 'sanitizer').and.returnValue({
          isValid: true, value: url,
        });
      });

      it('prevents adding duplicate URLs', () => {
        viewModel.urls = [
          new canMap({link: 'www.xyz.com', title: 'www.xyz.com'}),
          new canMap({link: 'www.test.url', title: 'www.test.url'}),
        ];

        method(url);
        expect(viewModel.createUrl).not.toHaveBeenCalled();
      });

      it('issues error notification when adding duplicate URLs', () => {
        viewModel.urls = [
          new canMap({link: 'www.xyz.com', title: 'www.xyz.com'}),
          new canMap({link: 'www.test.url', title: 'www.test.url'}),
        ];

        method(url);
        expect(NotifiersUtils.notifier).toHaveBeenCalledWith(
          'error', 'URL already exists.');
      });

      it('should create url', () => {
        method(url);
        expect(viewModel.createUrl).toHaveBeenCalledWith(url);
      });

      it('should hide create url form', () => {
        method(url);
        expect(viewModel.toggleFormVisibility).toHaveBeenCalledWith(false);
      });
    });

    describe('should not hide create url form', () => {
      it('in case of empty input', () => {
        spyOn(UrlUtils, 'sanitizer').and.returnValue({
          isValid: false, value: '',
        });

        method(' ');
        expect(viewModel.toggleFormVisibility).not.toHaveBeenCalled();
      });

      it('in case of duplicate url', () => {
        let url = 'www.test.url';
        viewModel.urls = [
          new canMap({link: 'www.xyz.com', title: 'www.xyz.com'}),
          new canMap({link: 'www.test.url', title: 'www.test.url'}),
        ];

        spyOn(UrlUtils, 'sanitizer').and.returnValue({
          isValid: false, value: url,
        });

        method(url);
        expect(viewModel.toggleFormVisibility).not.toHaveBeenCalled();
      });
    });
  });
});
