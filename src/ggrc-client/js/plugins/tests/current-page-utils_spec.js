/*
 Copyright (C) 2020 Google Inc.
 Licensed under http://www.apache.org/licenses/LICENSE-2.0 <see LICENSE file>
 */

import * as CurrentPageUtils from '../utils/current-page-utils';

describe('GGRC Utils CurrentPage', function () {
  let pageType;
  let pageObject;

  beforeAll(() => {
    pageObject = GGRC.page_object;
    pageType = GGRC.pageType;
  });

  afterAll(function () {
    GGRC.pageType = pageType;
    GGRC.page_object = pageObject;
  });

  beforeEach(function () {
    GGRC.pageType = undefined;
    GGRC.page_object = {
      audit: {
        id: 1,
        type: 'Audit',
      },
    };
  });
  describe('getPageType() method', function () {
    let method;

    beforeEach(function () {
      method = CurrentPageUtils.getPageType;
    });

    it('returns pageType value if it defined', function () {
      GGRC.pageType = 'MOCK_PAGE';
      expect(method()).toEqual('MOCK_PAGE');
    });

    it('returns page instance type if pageType not defined', function () {
      expect(method()).toEqual('Audit');
    });
  });

  describe('isMyAssessments() method', function () {
    let method;

    beforeEach(function () {
      method = CurrentPageUtils.isMyAssessments;
    });

    it('returns True for GGRC.pageType = MY_ASSESSMENTS', function () {
      GGRC.pageType = 'MY_ASSESSMENTS';
      expect(method()).toBeTruthy();
    });

    it('returns False if pageType not defined', function () {
      expect(method()).toBeFalsy();
    });

    it('returns False if GGRC.pageType not equal MY_ASSESSMENTS', function () {
      GGRC.pageType = 'FOO_BAR';
      expect(method()).toBeFalsy();
    });
  });

  describe('isMyWork() method', function () {
    let method;

    beforeEach(function () {
      method = CurrentPageUtils.isMyWork;
    });

    it('returns True for GGRC.pageType = MY_WORK', function () {
      GGRC.pageType = 'MY_WORK';
      expect(method()).toBeTruthy();
    });

    it('returns False if pageType not defined', function () {
      expect(method()).toBeFalsy();
    });

    it('returns False if GGRC.pageType not equal MY_WORK', function () {
      GGRC.pageType = 'FOO_BAR_BAR';
      expect(method()).toBeFalsy();
    });
  });

  describe('isAdmin() method', function () {
    let method;

    beforeEach(function () {
      method = CurrentPageUtils.isAdmin;
    });

    it('returns True for GGRC.pageType = ADMIN', function () {
      GGRC.pageType = 'ADMIN';
      expect(method()).toBeTruthy();
    });

    it('returns False if pageType not defined', function () {
      expect(method()).toBeFalsy();
    });

    it('returns False if GGRC.pageType not equal ADMIN', function () {
      GGRC.pageType = 'FOO_BAR_BAZ';
      expect(method()).toBeFalsy();
    });
  });

  describe('isObjectContextPage() method', function () {
    let method;

    beforeEach(function () {
      method = CurrentPageUtils.isObjectContextPage;
    });

    it('returns True if pageType not defined', function () {
      expect(method()).toBeTruthy();
    });

    it('returns False if pageType defined', function () {
      GGRC.pageType = 'ADMIN';
      expect(method()).toBeFalsy();
    });
  });
});
