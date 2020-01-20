/*
 Copyright (C) 2020 Google Inc., authors, and contributors
 Licensed under http://www.apache.org/licenses/LICENSE-2.0 <see LICENSE file>
 */

import canStache from 'can-stache';
import canMap from 'can-map';
import canComponent from 'can-component';
import Proposal from '../../models/service-models/proposal';
import template from './templates/create-proposal.stache';
import {hasPending as hasPendingUtil} from '../../plugins/ggrc-utils';
import {
  PROPOSAL_CREATED,
  REFRESH_COMMENTS,
} from '../../events/event-types';
import {getRole} from '../../plugins/utils/acl-utils';

export default canComponent.extend({
  tag: 'create-proposal',
  view: canStache(template),
  leakScope: true,
  viewModel: canMap.extend({
    define: {
      isDisabled: {
        type: Boolean,
        get() {
          let hasErrors = this.instance.computed_unsuppressed_errors();
          return hasErrors || !this.hasChanges() || this.attr('loading');
        },
      },
    },
    instance: {},
    proposalAgenda: '',
    loading: false,
    create(element, event) {
      const instance = this.attr('instance');
      const instanceFields = instance.attr();
      const proposalEditorRole = getRole('Proposal', 'ProposalEditor');

      event.preventDefault();
      this.attr('loading', true);

      let proposal = {
        agenda: this.attr('proposalAgenda'),
        access_control_list: [{
          ac_role_id: proposalEditorRole.id,
          person: {type: 'Person', id: GGRC.current_user.id},
        }],
        instance: {
          id: instanceFields.id,
          type: instanceFields.type,
        },
        full_instance_content: instanceFields,
        context: instanceFields.context,
      };

      this.saveProposal(proposal, element);
    },
    saveProposal(proposal, element) {
      const instance = this.attr('instance');

      new Proposal(proposal).save().then(
        (proposal) => {
          this.attr('loading', false);
          instance.restore(true);
          instance.dispatch({
            ...PROPOSAL_CREATED,
            proposal,
          });
          instance.dispatch(REFRESH_COMMENTS);
          this.closeModal(element);
        }, (error) => {
          this.attr('loading', false);
          console.error(error.statusText);
        }
      );
    },
    closeModal(element) {
      // TODO: fix
      $(element).closest('.modal')
        .find('.modal-dismiss')
        .trigger('click');
    },
    hasChanges() {
      const instance = this.attr('instance');
      const hasPending = hasPendingUtil(instance);
      const isDirty = instance.isDirty(true);

      return isDirty || hasPending;
    },
  }),
});
