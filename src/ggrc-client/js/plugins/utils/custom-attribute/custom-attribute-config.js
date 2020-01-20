/*
 Copyright (C) 2020 Google Inc.
 Licensed under http://www.apache.org/licenses/LICENSE-2.0 <see LICENSE file>
*/

/**
 * Enum for custom attriubte types.
 * @readonly
 * @enum {Symbol}
 */
export const CUSTOM_ATTRIBUTE_TYPE = Object.freeze({
  LOCAL: Symbol('LOCAL'),
  GLOBAL: Symbol('GLOBAL'),
});

/**
 * Has names of the back-end custom attribute control types.
 */
export const caDefTypeName = {
  Text: 'Text',
  RichText: 'Rich Text',
  MapPerson: 'Map:Person',
  Date: 'Date',
  Input: 'Input',
  Checkbox: 'Checkbox',
  Multiselect: 'Multiselect',
  Dropdown: 'Dropdown',
};
