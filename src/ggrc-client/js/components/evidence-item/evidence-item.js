/*
    Copyright (C) 2020 Google Inc.
    Licensed under http://www.apache.org/licenses/LICENSE-2.0 <see LICENSE file>
*/

import canStache from 'can-stache';
import canDefineMap from 'can-define/map/map';
import canComponent from 'can-component';
import template from './templates/evidence-item.stache';
import {notifier} from '../../plugins/utils/notifiers-utils';
import * as businessModels from '../../models/business-models';

const ViewModel = canDefineMap.extend({
  canEdit: {
    get() {
      const isNew = this.evidence.isNew();
      return !this.isEditIconDenied
        && !this.isLoading
        && !this.isArchived
        && !isNew;
    },
  },
  isArchived: {
    value: false,
  },
  editMode: {
    value: false,
  },
  isEditIconDenied: {
    value: false,
  },
  isLoading: {
    value: false,
  },
  evidence: {
    value: () => ({}),
  },
  context: {
    value: () => ({
      notes: null,
    }),
  },
  setEditMode() {
    this.editMode = true;
  },
  save() {
    const oldNotes = this.evidence.attr('notes');
    let notes = this.context.notes;

    this.editMode = false;

    if (typeof notes === 'string') {
      notes = notes.trim();
    }

    if (oldNotes === notes) {
      return;
    }

    this.updateItem(notes);
  },
  cancel() {
    const notes = this.evidence.attr('notes');
    this.editMode = false;
    this.context.notes = notes;
  },
  updateContext() {
    const notes = this.evidence.attr('notes');
    this.context.notes = notes;
  },
  notesChanged(args) {
    this.context.notes = args.value;
  },
  remove(evidence) {
    this.dispatch({
      type: 'removeItem',
      payload: evidence,
    });
  },
  async updateItem(notes) {
    const evidence = this.evidence;
    const model = businessModels[evidence.type];
    try {
      this.isLoading = true;
      const evidenceInstance = await model.findOne({id: evidence.id});
      evidenceInstance.attr('notes', notes);
      await evidenceInstance.save();
    } catch {
      notifier('error', 'Unable to update.');
    } finally {
      this.isLoading = false;
    }
  },
});

export default canComponent.extend({
  tag: 'evidence-item',
  view: canStache(template),
  ViewModel,
  events: {
    init() {
      this.viewModel.updateContext();
    },
    '{viewModel.evidence} notes'() {
      if (!this.viewModel.editMode) {
        this.viewModel.updateContext();
      }
    },
  },
});
