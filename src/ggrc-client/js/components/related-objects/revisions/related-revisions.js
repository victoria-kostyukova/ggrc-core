/*
 Copyright (C) 2020 Google Inc., authors, and contributors
 Licensed under http://www.apache.org/licenses/LICENSE-2.0 <see LICENSE file>
 */

import canStache from 'can-stache';
import canMap from 'can-map';
import canComponent from 'can-component';
import Pagination from '../../base-objects/pagination';
import template from './templates/related-revisions.stache';
import './related-revisions-item';
import Revision from '../../../models/service-models/revision.js';
import {
  buildParam,
  batchRequests,
} from '../../../plugins/utils/query-api-utils';
import QueryParser from '../../../generated/ggrc-filter-query-parser';

export default canComponent.extend({
  tag: 'related-revisions',
  view: canStache(template),
  leakScope: true,
  viewModel: canMap.extend({
    define: {
      paging: {
        value: function () {
          return new Pagination({pageSizeSelect: [5, 10, 15]});
        },
      },
    },
    instance: null,
    lastRevision: {},
    revisions: [],
    loading: false,
    async loadRevisions() {
      if (!this.attr('instance')) {
        return;
      }

      this.attr('loading', true);

      const paging = this.attr('paging');
      let first = 0;
      let last = 0;
      if (paging.current && paging.pageSize) {
        // start from the second revision because the first is loaded by loadLastRevision()
        first = (paging.current - 1) * paging.pageSize + 1;
        last = paging.current * paging.pageSize + 1;
      }
      let response = await this.getRevisions(first, last);
      this.attr('loading', false);
      if (!response) {
        return;
      }
      let {revisions, total} = response;

      // exclude last revision
      total = total ? total - 1 : 0;
      this.attr('revisions', revisions);
      this.attr('paging.total', total);
    },

    async loadLastRevision() {
      if (!this.attr('instance')) {
        return;
      }
      // [0,1] is limit to get the first revision
      let response = await this.getRevisions(0, 1);
      if (!response) {
        return;
      }
      this.attr('lastRevision', response.revisions[0]);
    },
    async getRevisions(first, last) {
      const page = {
        sort: [{
          direction: 'desc',
          key: 'updated_at',
        }],
        first,
        last,
      };
      let params = buildParam(
        'Revision',
        page,
        null,
        null,
        this.getQueryFilter()
      );
      let data = await batchRequests(params);
      data = data.Revision;
      if (!data || !data.values) {
        return Promise.resolve();
      }

      let revisions = data.values;
      revisions = revisions.map(
        (source) => Revision.model(source, 'Revision'));

      return {revisions, total: data.total};
    },

    getQueryFilter() {
      const instance = this.attr('instance');
      return QueryParser.parse(
        `${instance.type} not_empty_revisions_for ${instance.id}`);
    },
  }),
  events: {
    inserted() {
      this.viewModel.loadLastRevision();
      this.viewModel.loadRevisions();
    },
    '{viewModel.paging} current'() {
      this.viewModel.loadRevisions();
    },
    '{viewModel.paging} pageSize'() {
      this.viewModel.loadRevisions();
    },
    '{viewModel.instance} modelAfterSave'() {
      this.viewModel.loadRevisions();
    },
  },
});
