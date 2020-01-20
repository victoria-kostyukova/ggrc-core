/*
    Copyright (C) 2020 Google Inc.
    Licensed under http://www.apache.org/licenses/LICENSE-2.0 <see LICENSE file>
*/

import {
  getPageInstance,
  isObjectContextPage,
} from './current-page-utils';
import * as LocalStorage from './local-storage-utils';

const localStorageKey = 'recently_viewed_object';
const maxHistory = 3;

/*
 * Saves current page object to recently viewed objects collection
 * except Person object from Dashboard page
 */
function saveRecentlyViewedObject() {
  if (!isObjectContextPage()) {
    return;
  }

  let history = LocalStorage.get(localStorageKey);

  let pageInstance = getPageInstance();
  let viewedObject =
    {
      type: pageInstance.type,
      viewLink: pageInstance.viewLink,
      title: pageInstance.title || pageInstance.name || pageInstance.email,
    };
  LocalStorage.create(localStorageKey, viewedObject);

  let existingObject = history
    .find((item) => item.viewLink === viewedObject.viewLink);

  if (existingObject) {
    LocalStorage.remove(localStorageKey, existingObject.id);
  } else if (history.length >= maxHistory) {
    // remove first item from collection
    LocalStorage.remove(localStorageKey, history[0].id);
  }
}

/*
 * Gets recenrly viewed objects collection
 */
function getRecentlyViewedObjects() {
  let objects = LocalStorage.get(localStorageKey);
  if (objects.length) {
    objects = objects.slice(-maxHistory);
  }
  return objects;
}

export {
  saveRecentlyViewedObject,
  getRecentlyViewedObjects,
};
