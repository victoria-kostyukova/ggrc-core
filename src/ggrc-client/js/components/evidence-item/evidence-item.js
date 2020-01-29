/*
    Copyright (C) 2020 Google Inc.
    Licensed under http://www.apache.org/licenses/LICENSE-2.0 <see LICENSE file>
*/

import canStache from 'can-stache';
import canMap from 'can-map';
import canComponent from 'can-component';
import template from './templates/evidence-item.stache';
import {notifier} from '../../plugins/utils/notifiers-utils';
import * as businessModels from '../../models/business-models';

export default canComponent.extend({
  tag: 'evidence-item',
  view: canStache(template),
  viewModel: canMap.extend({
    define: {
      canEdit: {
        get() {
          const isNew = this.attr('evidence').isNew();
          return !this.attr('isEditIconDenied')
            && !this.attr('isLoading')
            && !isNew;
        },
      },
    },
    editMode: false,
    isEditIconDenied: false,
    isLoading: false,
    evidence: {},
    context: {
      notes: null,
    },
    setEditMode() {
      this.attr('editMode', true);
    },
    save() {
      const oldNotes = this.attr('evidence.notes');
      let notes = this.attr('context.notes');

      this.attr('editMode', false);

      if (typeof notes === 'string') {
        notes = notes.trim();
      }

      if (oldNotes === notes) {
        return;
      }

      this.updateItem(notes);
    },
    cancel() {
      const notes = this.attr('evidence.notes');
      this.attr('editMode', false);
      this.attr('context.notes', notes);
    },
    updateContext() {
      const notes = this.attr('evidence.notes');
      this.attr('context.notes', notes);
    },
    notesChanged(args) {
      this.attr('context.notes', args.value);
    },
    remove(evidence) {
      this.dispatch({
        type: 'removeItem',
        payload: evidence,
      });
    },
    async updateItem(notes) {
      const evidence = this.attr('evidence');
      const model = businessModels[evidence.type];
      try {
        this.attr('isLoading', true);
        const evidenceInstance = await model.findOne({id: evidence.id});
        evidenceInstance.attr('notes', notes);
        await evidenceInstance.save();
      } catch {
        notifier('error', 'Unable to update.');
      } finally {
        this.attr('isLoading', false);
      }
    },
  }),
  events: {
    init() {
      this.viewModel.updateContext();
    },
    '{viewModel.evidence} notes'() {
      if (!this.viewModel.attr('editMode')) {
        this.viewModel.updateContext();
      }
    },
  },
});
