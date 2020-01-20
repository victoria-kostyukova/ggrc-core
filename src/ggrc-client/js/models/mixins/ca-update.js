/*
    Copyright (C) 2020 Google Inc.
    Licensed under http://www.apache.org/licenses/LICENSE-2.0 <see LICENSE file>
*/

import Mixin from './mixin';

export default class CaUpdate extends Mixin {
  afterSave() {
    this.dispatch('readyForRender');
  }

  infoPanePreload() {
    this.refresh();
  }
}
