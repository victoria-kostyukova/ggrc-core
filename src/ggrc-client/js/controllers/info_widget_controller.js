/*
    Copyright (C) 2018 Google Inc.
    Licensed under http://www.apache.org/licenses/LICENSE-2.0 <see LICENSE file>
*/

import '../components/comment/comment-data-provider';
import '../components/comment/comment-add-form';
import '../components/comment/mapped-comments';
import '../components/proposal/create-proposal-button';
import '../components/related-objects/proposals/related-proposals';
import '../components/related-objects/proposals/related-proposals-item';
import '../components/related-objects/revisions/related-revisions';
import '../components/revision-history/restore-revision';
import {
  getPageInstance,
  getPageModel,
} from '../plugins/utils/current-page-utils';
import * as businessModels from '../models/business-models';

export default can.Control({
  pluginName: 'ggrc_controllers_info_widget',
  defaults: {
    model: getPageModel(),
    instance: getPageInstance(),
    widget_view: GGRC.mustache_path + '/base_objects/info.mustache',
  },
}, {
  init: function () {
    this.init_menu();

    if (this.element.data('widget-view')) {
      this.options.widget_view = GGRC.mustache_path +
        this.element.data('widget-view');
    }
    if (this.options.instance.info_pane_preload) {
      this.options.instance.info_pane_preload();
    }
    this.options.context = new can.Observe({
      model: this.options.model,
      instance: this.options.instance,
      start_menu: this.options.start_menu,
      object_menu: this.options.object_menu,
      error_msg: '',
      error: true,
      is_info_widget: true,
    });
    import(/* webpackChunkName: "modalsCtrls" */'./modals')
      .then(() => {
        can.view(this.get_widget_view(this.element),
          this.options.context, function (frag) {
            this.element.html(frag);
          }.bind(this));
      });
  },

  get_widget_view: function (el) {
    let widgetView = $(el)
      .closest('[data-widget-view]').attr('data-widget-view');
    if (widgetView && widgetView.length > 0) {
      return GGRC.mustache_path + widgetView;
    }
    return this.options.widget_view;
  },

  generate_menu_items: function (itemNames, displayPrefix) {
    displayPrefix = displayPrefix || '';
    return _.filter(_.map(itemNames, function (name) {
      if (name in businessModels) {
        return {
          model_name: businessModels[name].model_singular,
          model_lowercase: businessModels[name].table_singular,
          model_plural: businessModels[name].table_plural,
          display_name: displayPrefix + businessModels[name].title_singular,
        };
      }
    }));
  },

  init_menu: function () {
    let names;
    if (!this.options.start_menu) {
      names = [
        'Program',
        'Audit',
        'Workflow',
      ];
      this.options.start_menu = this.generate_menu_items(names, 'Start new ');
    }
    if (!this.options.object_menu) {
      names = [
        'AccessGroup',
        'Contract',
        'Control',
        'DataAsset',
        'Facility',
        'Issue',
        'Market',
        'Metric',
        'Objective',
        'OrgGroup',
        'Person',
        'Policy',
        'Process',
        'Product',
        'ProductGroup',
        'Project',
        'Regulation',
        'Requirement',
        'Risk',
        'Standard',
        'System',
        'TechnologyEnvironment',
        'Threat',
        'Vendor',
      ];
      this.options.object_menu = this.generate_menu_items(names);
    }
  },
});
