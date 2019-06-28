/*
    Copyright (C) 2019 Google Inc.
    Licensed under http://www.apache.org/licenses/LICENSE-2.0 <see LICENSE file>
*/

import loIsNumber from 'lodash/isNumber';
import {ggrcAjax, ggrcGet} from '../plugins/ajax_extensions';
import canStache from 'can-stache';
import canMap from 'can-map';
import canControl from 'can-control';
import '../components/add-object-button/add-object-button';
import '../components/assessment/assessment-generator-button';
import {
  getPageModel,
  getPageInstance,
} from '../plugins/utils/current-page-utils';
import {getCounts} from '../plugins/utils/widgets-utils';
import router from '../router';
import {
  getDefaultStatesForModel,
} from '../plugins/utils/state-utils';
import {loadScript} from '../plugins/ggrc_utils';
import Relationship from '../models/service-models/relationship';
import Assessment from '../models/business-models/assessment';

export default canControl.extend({
  defaults: {
    Assessment,
    Relationship,
    model: getPageModel(),
    instance: getPageInstance(),
    widget_view: GGRC.templates_path + '/base_objects/summary.stache',
    isLoading: true,
    isShown: false,
    forceRefresh: false,
    colorsMap: {
      'Completed and Verified': '#009925',
      'Completed (no verification)': '#405f77',
      Deprecated: '#704c70',
      'In Progress': '#3369e8',
      'Not Started': '#9e9e9e',
      'In Review': '#f57c00',
      'Rework Needed': '#d50f25',
    },
    chartOptions: {
      pieSliceText: 'value-and-percentage',
      chartArea: {
        width: '100%',
        height: '90%',
      },
      height: 300,
      legend: {
        position: 'none',
      },
    },
  },
}, {
  init: function () {
    if (this.element.data('widget-view')) {
      this.options.widget_view = GGRC.templates_path +
        this.element.data('widget-view');
    }
    this.element.closest('.widget')
      .on('widget_shown', this.widget_shown.bind(this));
    this.element.closest('.widget')
      .on('widget_hidden', this.widget_hidden.bind(this));
    this.options.context = new canMap({
      model: this.options.model,
      instance: this.options.instance,
      error_msg: '',
      error: true,
      charts: {
        Assessment: {
          legend: [],
        },
      },
    });

    ggrcAjax({
      url: this.get_widget_view(this.element),
      dataType: 'text',
    }).then((view) => {
      let frag = canStache(view)(this.options.context);
      this.element.html(frag);
      this.widget_shown();
    });
    return 0;
  },
  onRelationshipChange: function (model, ev, instance) {
    if (instance instanceof Relationship &&
    instance.attr('destination.type') === 'Evidence' &&
    instance.attr('source.type') === 'Assessment') {
      this.options.forceRefresh = true;
    }
  },
  '{Relationship} destroyed': 'onRelationshipChange',
  '{Relationship} created': 'onRelationshipChange',
  '{Assessment} updated': function (model, ev, instance) {
    if (instance instanceof Assessment) {
      this.options.forceRefresh = true;
    }
  },
  get_widget_view: function (el) {
    let widgetView = $(el)
      .closest('[data-widget-view]')
      .attr('data-widget-view');
    return (widgetView && widgetView.length > 0) ?
      GGRC.templates_path + widgetView :
      this.options.widget_view;
  },
  widget_shown: function (event) {
    this.options.isShown = true;
    setTimeout(this.reloadSummary.bind(this), 0);

    $(window).trigger('resize');
    return false;
  },
  widget_hidden: function (event) {
    this.options.isShown = false;
    return false;
  },
  reloadSummary: function () {
    let that = this;
    this.loadChartLibrary(function () {
      that.reloadChart('Assessment', 'piechart_audit_assessments_chart');
    });
  },
  reloadChart: function (type, elementId) {
    let that = this;
    let chartOptions = this.options.context.charts[type];
    // Note that chart will be refreshed only if counts were changed.
    // State changes are not checked.
    let countsChanged =
      getCounts().attr(type) !== chartOptions.attr('total.assessments');

    if (chartOptions.attr('isInitialized') && !countsChanged &&
    !this.options.forceRefresh) {
      return;
    }
    this.options.forceRefresh = false;
    chartOptions.attr('isInitialized', true);

    that.setState(type, {total: 0, statuses: { }}, true);
    return that.getStatuses(that.options.instance.id).then(function (raw) {
      let data = that.parseStatuses(type, raw);
      let chart = that.drawChart(elementId, data);

      that.prepareLegend(type, chart, data);
      that.setState(type, data, false);
    });
  },
  drawChart: function (elementId, raw) {
    let chart;
    let options = this.getChartOptions(raw);
    let data = new google.visualization.DataTable();
    let statuses = raw.statuses.map(function (state) {
      return [state.name, state.assessments];
    });
    this.options.chartOptions = options;
    this.options.data = data;

    data.addColumn('string', 'Status');
    data.addColumn('number', 'Count');
    data.addRows(statuses);

    chart = new google.visualization.PieChart(
      document.getElementById(elementId));
    this.options.chart = chart;

    google.visualization.events.addListener(chart, 'select', () => {
      let selectedItem = chart.getSelection()[0];
      if (selectedItem) {
        let topping = data.getValue(selectedItem.row, 0);
        router.attr({
          widget: 'assessment',
          state: [topping],
        });
      }
    });

    chart.draw(data, options);
    setTimeout(function () {
      $(window).trigger('resize');
    }, 0);

    return chart;
  },
  prepareLegend: function (type, chart, data) {
    let legendData = [];
    let chartOptions = this.options.context.charts[type];
    let colorsMap = this.options.colorsMap;

    data.statuses.forEach(function (status, rowIndex) {
      legendData.push({
        title: status.name,
        count: status.assessments,
        percent: (status.assessments / data.total.assessments * 100).toFixed(1),
        evidence: status.evidence,
        rowIndex: rowIndex,
        color: colorsMap[status.name],
      });
    });

    chartOptions.attr('legend', legendData);

    this.element.find('#piechart_audit_assessments_chart-legend tbody')
      .off('mouseenter', 'tr')
      .on('mouseenter', 'tr', function () {
        let $el = $(this);
        let rowIndex = $el.data('row-index');

        if (loIsNumber(rowIndex)) {
          chart.setSelection([{row: rowIndex, column: null}]);
        }
      })
      .on('mouseleave', 'tr', function () {
        chart.setSelection(null);
      });
  },
  getChartOptions: function (raw) {
    let options = Object.assign({}, this.options.chartOptions);
    let colorMaps = this.options.colorsMap;
    options.colors = raw.statuses.map(function (e) {
      return colorMaps[e.name];
    });

    return options;
  },
  '{window} resize': function (ev) {
    let chart = this.options.chart;
    let data = this.options.data;
    let options = this.options.chartOptions;
    let isSummaryWidgetShown = this.options.isShown;

    if (isSummaryWidgetShown && chart && options && data) {
      chart.draw(data, options);
    }
  },
  setState: function (type, data, isLoading) {
    let chartOptions = this.options.context.charts[type];
    chartOptions.attr('total', data.total.assessments);
    chartOptions.attr('totalEvidence', data.total.evidence);
    chartOptions.attr('any', data.total.assessments > 0);
    chartOptions.attr('none', isLoading || data.total.assessments === 0);
    chartOptions.attr('isLoading', isLoading);
    chartOptions.attr('isLoaded', !isLoading);
    if (isLoading) {
      chartOptions.attr('legend', []);
    }
  },
  parseStatuses: function (type, raw) {
    let statuses = getDefaultStatesForModel(type).map((status) => {
      return {
        name: status,
        assessments: 0,
        evidence: 0,
      };
    });

    raw.statuses.forEach((item) => {
      let statusName;
      let statusObj;

      if (item.name === 'Completed') {
        statusName = item.verified ?
          'Completed and Verified' : 'Completed (no verification)';
      } else {
        statusName = item.name;
      }

      statusObj = statuses.find((el) => {
        return el.name === statusName;
      });
      statusObj.assessments += item.assessments;
      statusObj.evidence += item.evidence;
    });

    return {
      statuses: statuses,
      total: raw.total,
    };
  },
  /**
   * Get count of Assessments and mapped evidence with breakdown by status
   * @param {Number} auditId
   * @return {Promise<Array>}
   * @example
   * Example of response:
   * {
   *  statuses: [
   *    {
   *      "name": "Not Started",
   *      "verified": 0,
   *      "assessments": X,
   *      "evidence": Y
   *    },
   *    {"name": "In Progress", ...},
   *    {"name": "In Review", ...},
   *    {
   *      "name": "Completed",
   *      "verified": 1,
   *      ...
   *    },
   *    {
   *      "name": "Completed",
   *      "verified": 0,
   *      ...
   *    },
   *    {"name": "Deprecated", ...},
   *    {"name": "Rework Needed", ...}
   *  ],
   *  total: {
   *    assessments: N,
   *    evidence: L
   *  }
   * }
   * X - number of assessments with this status;
   * Y - number of evidence attached to assessments with this status;
   * N, L - total count of assessments, evidence accordingly in this audit.
   */
  getStatuses: function (auditId) {
    return ggrcGet('/api/audits/'+ auditId + '/summary');
  },
  loadChartLibrary: function (callback) {
    if (typeof google !== 'undefined' &&
        typeof google.charts !== 'undefined') {
      callback();
      return;
    }
    loadScript('https://www.gstatic.com/charts/loader.js', function () {
      google.charts.load('45', {packages: ['corechart']});
      google.charts.setOnLoadCallback(callback);
    });
  },
});
