/*
 Copyright (C) 2018 Google Inc.
 Licensed under http://www.apache.org/licenses/LICENSE-2.0 <see LICENSE file>
 */

import {
  getWidgetList,
  getDefaultWidgets,
  getWidgetModels,
  getPageType,
  initCounts,
  initWidgets,
  isMyAssessments,
  isMyWork,
  getPageInstance,
} from '../../plugins/utils/current-page-utils';
import {RouterConfig} from '../../router';
import routes from './routes';
import '../../plugins/utils/it-enable/issue-tracker-enable';
import {gapiClient} from '../../plugins/ggrc-gapi-client';
import {saveRecentlyViewedObject} from '../../plugins/utils/recently-viewed-utils';

const $area = $('.area').first();
const instance = getPageInstance();
const location = window.location.pathname;
const isAssessmentsView = isMyAssessments();
const modelName = instance.constructor.shortName;
let defaults;
let extraPageOptions;
let widgetList;
let widgetModels;

RouterConfig.setupRoutes(routes);
gapiClient.loadGapiClient();

extraPageOptions = {
  Program: {
    page_title: function (controller) {
      return 'GRC Program: ' + controller.options.instance.title;
    },
  },
  Person: {
    page_title: function (controller) {
      const instance = controller.options.instance;
      return isMyWork() ?
        'GRC: My Work' :
        'GRC Profile: ' +
        (instance.name && instance.name.trim()) ||
        (instance.email && instance.email.trim());
    },
  },
};

initWidgets();

widgetList = getWidgetList(modelName, location);
defaults = getDefaultWidgets(widgetList, location);
widgetModels = getWidgetModels(modelName, location);

if (!isAssessmentsView && getPageType() !== 'Workflow') {
  initCounts(widgetModels, instance.type, instance.id);
}

$area.cms_controllers_page_object(can.extend({
  widget_descriptors: widgetList,
  default_widgets: defaults || [],
  instance: getPageInstance(),
  header_view: GGRC.mustache_path + '/base_objects/page_header.mustache',
  GGRC: GGRC, // make the global object available in Mustache templates
  page_title: function (controller) {
    return controller.options.instance.title;
  },
  current_user: GGRC.current_user,
}, extraPageOptions[modelName]));

saveRecentlyViewedObject();
