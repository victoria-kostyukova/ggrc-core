/*
    Copyright (C) 2020 Google Inc.
    Licensed under http://www.apache.org/licenses/LICENSE-2.0 <see LICENSE file>
*/

import * as RecentlyViewedUtils from '../../utils/recently-viewed-utils';
import * as CurrentPageUtils from '../../utils/current-page-utils';
import * as LocalStorage from '../../utils/local-storage-utils';

describe('recently-viewed-utils', () => {
  describe('saveRecentlyViewedObject() method', () => {
    beforeEach(() => {
      spyOn(LocalStorage, 'create');
      spyOn(LocalStorage, 'remove');
    });

    it('should not save objects from Dashboard pages', () => {
      spyOn(CurrentPageUtils, 'isObjectContextPage').and.returnValue(false);

      RecentlyViewedUtils.saveRecentlyViewedObject();

      expect(LocalStorage.create).not.toHaveBeenCalled();
    });

    it('should save recently viewed object to local storage', () => {
      let pageInstance = {
        type: 'type',
        viewLink: 'viewLink',
        title: 'title',
        id: 111,
      };
      spyOn(CurrentPageUtils, 'isObjectContextPage').and.returnValue(true);
      spyOn(CurrentPageUtils, 'getPageInstance').and.returnValue(pageInstance);

      RecentlyViewedUtils.saveRecentlyViewedObject();

      expect(LocalStorage.create).toHaveBeenCalledWith(jasmine.any(String), {
        title: pageInstance.title,
        viewLink: pageInstance.viewLink,
        type: pageInstance.type,
      });
    });

    it('should remove object from local storage history if it already exists',
      () => {
        let pageInstance = {
          type: 'type2',
          viewLink: 'viewLink_2',
          title: 'title2',
          id: 111,
        };
        spyOn(CurrentPageUtils, 'isObjectContextPage').and.returnValue(true);
        spyOn(CurrentPageUtils, 'getPageInstance')
          .and.returnValue(pageInstance);

        spyOn(LocalStorage, 'get').and.returnValue([
          {id: 1, type: 'type1', viewLink: 'viewLink_1', title: 'title1'},
          {id: 2, type: 'type2', viewLink: 'viewLink_2', title: 'title2'},
        ]);

        RecentlyViewedUtils.saveRecentlyViewedObject();

        expect(LocalStorage.remove)
          .toHaveBeenCalledWith(jasmine.any(String), 2);
      });

    it('should remove the oldest object if history limit exceeded', () => {
      let pageInstance = {
        type: 'any type',
        viewLink: 'any viewLink',
        title: 'any title',
        id: 111,
      };
      spyOn(CurrentPageUtils, 'isObjectContextPage').and.returnValue(true);
      spyOn(CurrentPageUtils, 'getPageInstance')
        .and.returnValue(pageInstance);

      spyOn(LocalStorage, 'get').and.returnValue([
        {id: 1, type: 'type1', viewLink: 'viewLink_1', title: 'title1'},
        {id: 2, type: 'type2', viewLink: 'viewLink_2', title: 'title2'},
        {id: 3, type: 'type3', viewLink: 'viewLink_3', title: 'title3'},
        {id: 4, type: 'type4', viewLink: 'viewLink_4', title: 'title4'},
      ]);

      RecentlyViewedUtils.saveRecentlyViewedObject();

      expect(LocalStorage.remove)
        .toHaveBeenCalledWith(jasmine.any(String), 1);
    });
  });

  describe('getRecentlyViewedObjects() method', () => {
    it('should return empty array if there is no saved objects', () => {
      spyOn(LocalStorage, 'get').and.returnValue([]);

      let result = RecentlyViewedUtils.getRecentlyViewedObjects();

      expect(result).toEqual([]);
    });

    it('should return whole list of recently reviewed objects if items count ' +
      'is less or equal history limit', () => {
      let obj1 = {id: 1, type: 'type1', viewLink: 'viewLink1', title: 'title1'};
      let obj2 = {id: 2, type: 'type2', viewLink: 'viewLink2', title: 'title2'};
      spyOn(LocalStorage, 'get').and.returnValue([obj1, obj2]);

      let result = RecentlyViewedUtils.getRecentlyViewedObjects();

      expect(result.length).toEqual(2);
      expect(result[0]).toBe(obj1);
      expect(result[1]).toBe(obj2);
    });

    it('should return limited list of recently reviewed objects if items ' +
      'count is more than history limit', () => {
      let obj1 = {id: 1, type: 'type1', viewLink: 'viewLink1', title: 'title1'};
      let obj2 = {id: 2, type: 'type2', viewLink: 'viewLink2', title: 'title2'};
      let obj3 = {id: 3, type: 'type3', viewLink: 'viewLink3', title: 'title3'};
      let obj4 = {id: 4, type: 'type4', viewLink: 'viewLink4', title: 'title4'};
      spyOn(LocalStorage, 'get').and.returnValue([obj1, obj2, obj3, obj4]);

      let result = RecentlyViewedUtils.getRecentlyViewedObjects();

      expect(result.length).toEqual(3);
      expect(result[0]).toBe(obj2);
      expect(result[1]).toBe(obj3);
      expect(result[2]).toBe(obj4);
    });
  });
});
