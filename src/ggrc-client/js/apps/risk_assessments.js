/*
 * Copyright (C) 2018 Google Inc.
 * Licensed under http://www.apache.org/licenses/LICENSE-2.0 <see LICENSE file>
 */

import {getPageInstance} from '../plugins/utils/current-page-utils';
import RiskAssessment from '../models/business-models/risk-assessment';
import Program from '../models/business-models/program';
import Stub from '../models/stub';

let RiskAssessmentsExtension = {};
let allowedObjectTypes = ['Program'];
GGRC.extensions.push(RiskAssessmentsExtension);

RiskAssessmentsExtension.name = 'risk_assessments';

// Register RA models for use with `inferObjectType`
RiskAssessmentsExtension.object_type_decision_tree = function () {
  return {
    risk_assessment: RiskAssessment,
  };
};

Program.attributes.risk_assessments = Stub.List;

// Override GGRC.extra_widget_descriptors and GGRC.extra_default_widgets
// Initialize widgets for risk assessment page
RiskAssessmentsExtension.init_widgets = function () {
  let descriptor = {};
  let pageInstance = getPageInstance();
  let treeWidgets = GGRC.tree_view.base_widgets_by_type;

  _.forEach(allowedObjectTypes, function (type) {
    if (!type || !treeWidgets[type]) {
      return;
    }
    treeWidgets[type] = treeWidgets[type].concat(['RiskAssessment']);
  });
  if (pageInstance
    && ~can.inArray(pageInstance.constructor.shortName, allowedObjectTypes)) {
    descriptor[pageInstance.constructor.shortName] = {
      RiskAssessment: {
        widget_id: 'risk_assessments',
        widget_name: 'Risk Assessments',
        widgetType: 'treeview',
        treeViewDepth: 0,
        content_controller_options: {
          add_item_view: GGRC.mustache_path +
            '/risk_assessments/tree_add_item.mustache',
          parent_instance: pageInstance,
          model: RiskAssessment,
          draw_children: true,
          allow_mapping: false,
        },
      },
    };
  }
  new GGRC.WidgetList('ggrc_risk_assessments', descriptor);
};
