/*
    Copyright (C) 2019 Google Inc.
    Licensed under http://www.apache.org/licenses/LICENSE-2.0 <see LICENSE file>
*/

import loGet from 'lodash/get';
import makeArray from 'can-util/js/make-array/make-array';
import canList from 'can-list';
import canMap from 'can-map';
import * as LocalStorage from './local-storage-utils';

const localStorageKey = 'display_prefs';
const TREE_VIEW_HEADERS = 'tree_view_headers';
const TREE_VIEW_STATES = 'tree_view_states';
const MODAL_STATE = 'modal_state';
const TREE_VIEW = 'tree_view';
const CHILD_TREE_DISPLAY_LIST = 'child_tree_display_list';
const LHN_SIZE = 'lhn_size';
const LHN_STATE = 'lhn_state';
const pageToken = window.location.pathname.replace(/\./g, '/');
const LHN_STATE_LIST = [
  'open_category', 'panel_scroll', 'category_scroll',
  'search_text', 'my_work', 'filter_params', 'is_open', 'is_pinned',
];

let preferences = null;
/**
 * Creates new preferences object if nothing is saved
 * or reads existing preferences and caches them
 * @return {canMap} user display preferences
 */
function getPreferences() {
  if (preferences) {
    return preferences;
  }

  let prefs = LocalStorage.get(localStorageKey);

  if (!prefs.length) {
    preferences = new canMap(LocalStorage.create(localStorageKey, {}));
  } else {
    preferences = new canMap(prefs[0]);
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
  let args = makeArray(arguments);

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
 * @param {canMap} prefs preferences object
 * @param  {Array} keyArgs key parts
 */
function createNestedProps(prefs, keyArgs) {
  let object = prefs;
  keyArgs.forEach(function (arg) {
    let value = loGet(object, arg);
    if (!value) {
      value = new canMap();
      object.attr(arg, value);
    }
    object = value;
  });
}

/**
 * Gets saved preferences.
 * It accepts any string parameters which are parts of path in preferences object
 * @return {canMap} required preferences
 */
function getObject(...args) {
  let prefs = getPreferences();

  let object = loGet(prefs, args) || {};
  return new canMap(object);
}

/**
 * Gets saved tree view headers preferences depending on current page and selected model
 * @param {String} modelName model name
 * @return {Array} list of saved headers
 */
function getTreeViewHeaders(modelName) {
  let value = getObject(pageToken, TREE_VIEW_HEADERS);
  if (!value.attr(modelName)) {
    return new canList();
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

/**
 * Gets saved tree view states preferences per selected model
 * @param {String} modelName model name
 * @return {Array} list of saved states
 */
function getTreeViewStates(modelName) {
  let value = getObject(TREE_VIEW_STATES);
  if (!value.attr(modelName)) {
    return new canList();
  }
  return value.attr(modelName).attr('status_list');
}

/**
 * Saves tree view states per model
 * @param {String} modelName model name
 * @param {Array} states selected statuses
 */
function setTreeViewStates(modelName, states) {
  let value = getObject(TREE_VIEW_STATES);
  value.attr(modelName, {
    status_list: states,
  });
  saveObject(TREE_VIEW_STATES, value);
}

/**
 * Gets saved modal state per modal
 * @param {Staring} modelName modal name
 * @return {Object} modal state
 */
function getModalState(modelName) {
  let value = getObject(MODAL_STATE);
  if (!value.attr(modelName)) {
    return null;
  }
  return value.attr(modelName).attr('display_state');
}

/**
 * Sets modal state per model
 * @param {Staring} modelName model name
 * @param {Object} state modal state
 */
function setModalState(modelName, state) {
  let value = getObject(MODAL_STATE);
  value.attr(modelName, {
    display_state: state,
  });
  saveObject(MODAL_STATE, value);
}

/**
 * Gets objects list for sub tree per model
 * @param {String} modelName model name
 * @return {Array} list of displayed objects
 */
function getChildTreeDisplayList(modelName) {
  let value = getObject(TREE_VIEW, CHILD_TREE_DISPLAY_LIST);
  if (!value.attr(modelName)) {
    return null; // in this case user should use default list an empty list, [], is different  than null
  }
  return value.attr(modelName).attr('display_list');
}

/**
 * Sets displayed in sub-tree objects per model
 * @param {String} modelName model name
 * @param {Array} displayList list of displayed objects
 */
function setChildTreeDisplayList(modelName, displayList) {
  let value = getObject(TREE_VIEW, CHILD_TREE_DISPLAY_LIST);
  value.attr(modelName, {
    display_list: displayList,
  });
  saveObject(TREE_VIEW, CHILD_TREE_DISPLAY_LIST, value);
}

function getLHNavSize() {
  let value = getObject(LHN_SIZE);
  if (!value.attr('lhs')) {
    return null;
  }
  return value.attr('lhs');
}

function setLHNavSize(size) {
  let value = getObject(LHN_SIZE);
  value.attr('lhs', size);
  saveObject(LHN_SIZE, value);
}

function getLHNState() {
  return getObject(LHN_STATE);
}

function setLHNState(state) {
  let value = getObject(LHN_STATE);
  LHN_STATE_LIST.forEach((token) => {
    if (typeof state[token] !== 'undefined') {
      value.attr(token, state[token]);
    }
  });
  saveObject(LHN_STATE, value);
}

export {
  getTreeViewHeaders,
  setTreeViewHeaders,
  getTreeViewStates,
  setTreeViewStates,
  getModalState,
  setModalState,
  getChildTreeDisplayList,
  setChildTreeDisplayList,
  getLHNavSize,
  setLHNavSize,
  getLHNState,
  setLHNState,
  clearPreferences,
  pageToken,
};
