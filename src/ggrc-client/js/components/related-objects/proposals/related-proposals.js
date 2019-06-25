/*
 Copyright (C) 2019 Google Inc., authors, and contributors
 Licensed under http://www.apache.org/licenses/LICENSE-2.0 <see LICENSE file>
 */

import loFind from 'lodash/find';
import canStache from 'can-stache';
import canMap from 'can-map';
import canComponent from 'can-component';
import template from './templates/related-proposals.stache';
import {
  PROPOSAL_CREATED,
  RELATED_REFRESHED,
  RELATED_ADDED,
  ADD_RELATED,
} from '../../../events/eventTypes';


export default canComponent.extend({
  tag: 'related-proposals',
  view: canStache(template),
  leakScope: true,
  viewModel: canMap.extend({
    baseInstance: {},
    define: {
      predefinedFilter: {
        get() {
          const filter = {
            expression: {
              left: {
                left: 'instance_type',
                op: {name: '='},
                right: this.attr('baseInstance.type'),
              },
              op: {name: 'AND'},
              right: {
                left: 'instance_id',
                op: {name: '='},
                right: this.attr('baseInstance.id'),
              },
            },
          };

          return filter;
        },
      },
    },
    proposals: [],
    checkTabWarning() {
      const proposals = this.attr('proposals');
      let proposed;
      if (!proposals || !proposals.length) {
        return;
      }

      proposed = proposals.filter((item) => {
        return item.instance.status === 'proposed';
      });

      this.dispatch({
        type: 'updateProposalsWarning',
        warning: proposed.length > 0,
      });
    },
  }),
  events: {
    '{viewModel.proposals} change'() {
      this.viewModel.checkTabWarning();
    },
    [`{viewModel.baseInstance} ${PROPOSAL_CREATED.type}`]([scope], event) {
      let vm = this.viewModel;
      let newProposal = event.proposal;
      let proposals = vm.attr('proposals');

      vm.attr('baseInstance').one(RELATED_REFRESHED.type, (event) => {
        if (event.model !== 'Proposal') {
          return;
        }

        // Sometimes BE does not return newly created proposal through Query API
        // because of reindexing job. New proposal is added
        // on FE to the proposals list in this case to not confuse user.
        let proposal = loFind(proposals,
          (proposal) => proposal.instance.id === newProposal.id);

        if (!proposal) {
          proposals.dispatch({
            ...ADD_RELATED,
            object: newProposal,
          });
        }
      });

      proposals.dispatch({
        ...RELATED_ADDED,
        model: 'Proposal',
      });
    },
  },
});
