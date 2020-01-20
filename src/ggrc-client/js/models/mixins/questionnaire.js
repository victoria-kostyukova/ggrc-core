/*
    Copyright (C) 2020 Google Inc.
    Licensed under http://www.apache.org/licenses/LICENSE-2.0 <see LICENSE file>
*/

import Mixin from './mixin';

export default class Questionnaire extends Mixin {
  static 'after:init'() {
    if (GGRC.GGRC_Q_INTEGRATION_URL) {
      const attrTitle = 'Questionnaire';
      const attrList = this.tree_view_options.attr_list;
      let isContainsAttr = !!attrList
        .filter((attr) => attr.attr_title === attrTitle)
        .length;

      if (isContainsAttr) {
        return;
      }

      this.tree_view_options.attr_list.push({
        attr_title: 'Questionnaire',
        attr_name: 'questionnaire',
        disable_sorting: true,
      });
      this.isQuestionnaireable = true;
    }
  }
}
