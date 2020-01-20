/*
 Copyright (C) 2020 Google Inc.
 Licensed under http://www.apache.org/licenses/LICENSE-2.0 <see LICENSE file>
 */

import {
  getPageType,
  isMyAssessments,
  getPageInstance,
} from '../../plugins/utils/current-page-utils';
import {
  getWidgetList,
  getDefaultWidgets,
  getWidgetModels,
  initCounts,
  initWidgets,
} from '../../plugins/utils/widgets-utils';
import {RouterConfig} from '../../router';
import routes from './routes';
import '../../plugins/utils/it-enable/issue-tracker-enable';
import {gapiClient} from '../../plugins/ggrc-gapi-client';
import {saveRecentlyViewedObject} from '../../plugins/utils/recently-viewed-utils';
import {PageObjectControl} from '../../controllers/dashboard-controller';

const instance = getPageInstance();
const location = window.location.pathname;
const isAssessmentsView = isMyAssessments();
const modelName = instance.constructor.model_singular;
let defaults;
let widgetList;
let widgetModels;

RouterConfig.setupRoutes(routes);
gapiClient.loadGapiClient();

initWidgets();

widgetList = getWidgetList(modelName, location);
defaults = getDefaultWidgets(widgetList, location);
widgetModels = getWidgetModels(modelName, location);

if (!isAssessmentsView && getPageType() !== 'Workflow') {
  initCounts(widgetModels, instance.type, instance.id);
}

new PageObjectControl('#pageContent', {
  widget_descriptors: widgetList,
  default_widgets: defaults || [],
  instance: getPageInstance(),
  header_view: '/base_objects/page-header.stache',
  innernav_view: '/base_objects/inner-nav.stache',
  page_title: function (controller) {
    return controller.options.instance.title;
  },
  current_user: GGRC.current_user,
});

saveRecentlyViewedObject();
