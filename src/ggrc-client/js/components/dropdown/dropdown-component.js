/*
    Copyright (C) 2020 Google Inc.
    Licensed under http://www.apache.org/licenses/LICENSE-2.0 <see LICENSE file>
*/

import {filteredMap} from '../../plugins/ggrc-utils';
import loIsString from 'lodash/isString';
import canStache from 'can-stache';
import canDefineMap from 'can-define/map/map';
import canComponent from 'can-component';
import template from './templates/dropdown-component.stache';

const ViewModel = canDefineMap.extend({
  options: {
    get() {
      let isGroupedDropdown = this.isGroupedDropdown;
      let optionsGroups = this.optionsGroups;
      let noneValue = this.noValueLabel || '--';
      let none = isGroupedDropdown ?
        [{
          group: noneValue,
          subitems: [{title: noneValue, value: ''}],
        }] :
        [{
          title: noneValue,
          value: '',
        }];
      let list = [];
      if (!isGroupedDropdown) {
        list = filteredMap(
          this.optionsList || [], (option) => {
            if (loIsString(option)) {
              return {
                value: option,
                title: option,
              };
            }
            return option;
          }
        );
      } else {
        list = Object.keys(optionsGroups).map((key) => {
          let group = optionsGroups.get(key);
          return {
            group: group.name,
            subitems: group.items.map((item) => {
              return {
                value: item.value,
                title: item.name,
              };
            }),
          };
        });
      }
      if (this.noValue) {
        return none.concat(list);
      }
      return list;
    },
  },
  name: {
    value: '',
  },
  className: {
    value: '',
  },
  onChange: {
    value: () => $.noop,
  },
  noValue: {
    value: '',
  },
  noValueLabel: {
    value: '',
  },
  controlId: {
    value: '',
  },
  isGroupedDropdown: {
    value: false,
  },
  tabIndex: {
    value: 0,
  },
  /*
    Options list should be an `array` of object containing `title` and `value`
    [{
      title: `title`
      value: `value`
    }]
    */
  optionsList: {
    value: () => [],
  },
  optionsGroups: {
    value: () => ({}),
  },
  isDisabled: {
    value: false,
  },
});

/*
  Component abstracts <select> dropdown in HTML.

  It receives `name` of the attribute that should be set and `optionsList`
  with titles and values
*/
export default canComponent.extend({
  tag: 'dropdown-component',
  view: canStache(template),
  leakScope: true,
  ViewModel,
  init(element) {
    let $el = $(element);
    let attrVal = $el.attr('is-disabled');
    let disable;
    let viewModel = this.viewModel;

    // By default CanJS evaluates the component element's attribute values in
    // the current context, but we want to support passing in literal values
    // as well. We thus inspect some of the directly and override what CanJS
    // initializes in viewModel.
    if (attrVal === '' || attrVal === 'false') {
      disable = false;
    } else if (attrVal === 'true') {
      disable = true;
    } else {
      disable = Boolean(viewModel.isDisabled);
    }

    viewModel.isDisabled = disable;
  },
});
