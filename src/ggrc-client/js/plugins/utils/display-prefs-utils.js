/*
    Copyright (C) 2018 Google Inc.
    Licensed under http://www.apache.org/licenses/LICENSE-2.0 <see LICENSE file>
*/

import * as LocalStorage from './local-storage-utils';

const localStorageKey = 'display_prefs';
const TREE_VIEW_HEADERS = 'tree_view_headers';
const pageToken = window.location.pathname.replace(/\./g, '/');

let preferences = null;
/**
 * Creates new preferences object if nothing is saved
 * or reads existing preferences and caches them
 * @return {can.Map} user display preferences
 */
function getPreferences() {
  if (preferences) {
    return preferences;
  }

  let prefs = LocalStorage.get(localStorageKey);

  if (!prefs.length) {
    preferences = new can.Map(LocalStorage.create(localStorageKey, {}));
  } else {
    preferences = new can.Map(prefs[0]);
  }

  return preferences;
}

/**
 * Removes preferences from local storage and creates cache
 */
function clearPreferences() {
  LocalStorage.clear(localStorageKey);
  preferences = null;
}

/**
 * Updates preferences in local storage
 * It accepts any parameters. The last one should be an object for saving.
 * The other should be parts of path in preferences object
 */
function saveObject() {
  let args = can.makeArray(arguments);

  let keyArgs = args.slice(0, args.length - 1);
  let value = args[args.length - 1];
  if (typeof value !== 'object') {
    return;
  }

  let prefs = getPreferences();
  createNestedProps(prefs, keyArgs);

  prefs.attr(keyArgs.join('.'), value);

  LocalStorage.update(localStorageKey, prefs.serialize());
}

/**
 * Creates nesting objects when there are several key args
 * @param {can.Map} prefs preferences object
 * @param  {Array} keyArgs key parts
 */
function createNestedProps(prefs, keyArgs) {
  let object = prefs;
  can.each(keyArgs, function (arg) {
    let value = can.getObject(arg, object);
    if (!value) {
      value = new can.Map();
      object.attr(arg, value);
    }
    object = value;
  });
}

/**
 * Gets saved preferences.
 * It accepts any string parameters which are parts of path in preferences object
 * @return {can.Map} required preferences
 */
function getObject(...args) {
  let prefs = getPreferences();

  let object = can.getObject(args.join('.'), prefs) || {};
  return new can.Map(object);
}

/**
 * Gets saved tree view headers preferences depending on current page and selected model
 * @param {String} modelName model name
 * @return {Array} list of saved headers
 */
function getTreeViewHeaders(modelName) {
  let value = getObject(pageToken, TREE_VIEW_HEADERS);
  if (!value.attr(modelName)) {
    return new can.List();
  }
  return value.attr(modelName).attr('display_list');
}

/**
 * Saves tree view headers per current page and selected model
 * @param {*} modelName model name
 * @param {*} headers selected headers list
 */
function setTreeViewHeaders(modelName, headers) {
  let value = getObject(pageToken, TREE_VIEW_HEADERS);
  value.attr(modelName, {
    display_list: headers,
  });
  saveObject(pageToken, TREE_VIEW_HEADERS, value);
}

export {
  getTreeViewHeaders,
  setTreeViewHeaders,
  clearPreferences,
  pageToken,
};
