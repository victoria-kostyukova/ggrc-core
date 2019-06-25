/*
 Copyright (C) 2019 Google Inc.
 Licensed under http://www.apache.org/licenses/LICENSE-2.0 <see LICENSE file>
 */

import loIsObject from 'lodash/isObject';
import loMap from 'lodash/map';
import loFilter from 'lodash/filter';
const getAttrErrors = (attrErrors, propertyName) => {
  return loFilter(attrErrors, (fieldError) =>
    loIsObject(fieldError) && fieldError[propertyName]);
};

const isComplexAttr = (attribute) => {
  return (attribute && attribute.includes && attribute.includes('.'));
};

const splitComplextAttr = (attribute) => {
  return {
    attrName: attribute.split('.')[0],
    propertyName: attribute.split('.')[1],
  };
};

const getPropertyErrors = (instance, attribute) => {
  if (!instance.attr('errors')) {
    return;
  }

  if (!isComplexAttr(attribute)) {
    // check error of simple attr
    if (!instance.attr('errors')[attribute]) {
      return;
    }

    return instance.attr('errors')[attribute].join('; ');
  }

  const complextAttr = splitComplextAttr(attribute);
  const attrErrors = instance.attr('errors')[complextAttr.attrName];

  if (!attrErrors) {
    return;
  }

  const propertyErrors = getAttrErrors(attrErrors, complextAttr.propertyName);

  return loMap(propertyErrors, (propertyError) => {
    return propertyError[complextAttr.propertyName];
  }).join('; ');
};

/**
 * Get validation state of instance's attribute.
 * Attribute can be "complex".
 * For example: "issue_tracker.title" ({ issue_tracker: {title: 'wrong title' }})
 * Also, attribute can be "simple".
 * For example: "title" ({ title: 'my title' })
 * @param {*} instance - object of Cacheable
 * @param {*} attribute - attribute name ('issue_tracker.title' or 'title)
 * @return {boolean} - validation state
 */
const isValidAttr = (instance, attribute) => {
  const propertyErrors = getPropertyErrors(instance, attribute);
  return !propertyErrors || !propertyErrors.length;
};

/**
 * Get validation message of attribute if it invalid.
 * Attribute can be "complex".
 * For example: "issue_tracker.title" ({ issue_tracker: {title: 'wrong title' }})
 * Also, attribute can be "simple".
 * For example: "title" ({ title: 'my title' })
 * @param {*} instance - object of Cacheable
 * @param {*} attribute - attribute name ('issue_tracker.title' or 'title)
 * @return {string} - error message
 */
const validateAttr = (instance, attribute) => {
  const propertyErrors = getPropertyErrors(instance, attribute);
  return propertyErrors;
};

export {
  isValidAttr,
  validateAttr,
};
