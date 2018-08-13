/*
  Copyright (C) 2018 Google Inc.
  Licensed under http://www.apache.org/licenses/LICENSE-2.0 <see LICENSE file>
*/

const MAX_COLUMNS_COUNT = 1000;

export default can.Map({
  define: {
    isValidConfiguration: {
      get() {
        let isSelected = (item) => item.attr('isSelected');

        let selectedAttributesCount =
          this.attr('attributes').filter(isSelected).length +
          this.attr('localAttributes').filter(isSelected).length +
          this.attr('mappings').filter(isSelected).length;

        return selectedAttributesCount <= this.attr('maxAttributesCount');
      },
    },
  },
  type: 'Program',
  filter: '',
  maxAttributesCount: MAX_COLUMNS_COUNT,
  relevant: can.compute(function () {
    return new can.List();
  }),
  attributes: new can.List(),
  localAttributes: new can.List(),
  mappings: new can.List(),
});
