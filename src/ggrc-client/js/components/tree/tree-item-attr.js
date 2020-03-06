/*
 Copyright (C) 2020 Google Inc.
 Licensed under http://www.apache.org/licenses/LICENSE-2.0 <see LICENSE file>
 */

import canStache from 'can-stache';
import canDefineMap from 'can-define/map/map';
import canComponent from 'can-component';
import {formatDate} from '../../plugins/utils/date-utils';
import {
  getUserSystemRoles,
  getUserObjectRoles,
} from '../../plugins/utils/user-utils';
import template from './templates/tree-item-attr.stache';
import {convertMarkdownToHtml} from '../../plugins/utils/markdown-utils';
import {getOnlyAnchorTags} from '../../plugins/ggrc-utils';

// attribute names considered "default" and representing a date
const DATE_ATTRS = new Set([
  'end_date',
  'due_date',
  'finished_date',
  'start_date',
  'created_at',
  'updated_at',
  'verified_date',
  'last_deprecated_date',
  'last_assessment_date',
  'last_submitted_at',
  'last_verified_at',
]);

// attribute names considered "default" and representing rich text fields
const RICH_TEXT_ATTRS = new Set([
  'notes',
  'description',
  'test_plan',
  'risk_type',
  'threat_source',
  'threat_event',
  'vulnerability',
]);

// attribute names considered "default" and representing fields which contain
// at least "email" field
const PERSON_ATTRS = new Set([
  'created_by',
  'last_submitted_by',
  'last_verified_by',
]);

const ViewModel = canDefineMap.extend({
  instance: {
    value: null,
  },
  name: {
    value: '',
  },
  // workaround an issue: "instance.is_mega" is not
  // handled properly in template
  isMega: {
    get() {
      return this.instance.attr('is_mega');
    },
  },
  defaultValue: {
    get() {
      return this.getDefaultValue();
    },
  },
  userSystemRoles: {
    get() {
      return getUserSystemRoles(this.instance).join(', ');
    },
  },
  userObjectRoles: {
    get() {
      return getUserObjectRoles(this.instance).join(', ');
    },
  },
  /**
   * Transforms Rich text attribute value.
   *
   * @param {String} value - Rich text attribute value from DB.
   * @return {String} - the transformed rich text attribute value.
   */
  getConvertedRichTextAttr(value) {
    let result = value;

    if (this.isMarkdown()) {
      result = convertMarkdownToHtml(result);
    }
    return getOnlyAnchorTags(result);
  },
  /**
   * Retrieve the string value of an attribute.
   *
   * The method only supports instance attributes categorized as "default",
   * and does not support (read: not work for) nested object references.
   *
   * If the attribute does not exist or is not considered
   * to be a "default" attribute, an empty string is returned.
   *
   * If the attribute represents a date information, it is returned in the
   * MM/DD/YYYY format.
   *
   * @return {String} - the retrieved attribute's value
   */
  getDefaultValue() {
    let attrName = this.name;
    let instance = this.instance;

    let result = instance.attr(attrName);

    if (result !== undefined && result !== null) {
      if (PERSON_ATTRS.has(attrName)) {
        return result.attr('email');
      }

      if (DATE_ATTRS.has(attrName)) {
        return formatDate(result, true);
      }

      if (RICH_TEXT_ATTRS.has(attrName)) {
        return this.getConvertedRichTextAttr(result);
      }

      if (typeof result === 'boolean') {
        return this.getConvertedBoolean(result);
      }

      return String(result);
    }
    return '';
  },
  isMarkdown() {
    return !!this.instance.constructor.isChangeableExternally;
  },
  getConvertedBoolean(value) {
    if (value) {
      return 'Yes';
    } else {
      return 'No';
    }
  },
});

export default canComponent.extend({
  tag: 'tree-item-attr',
  view: canStache(template),
  leakScope: true,
  ViewModel,
});
