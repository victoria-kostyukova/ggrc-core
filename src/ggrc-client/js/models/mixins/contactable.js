/*
    Copyright (C) 2020 Google Inc.
    Licensed under http://www.apache.org/licenses/LICENSE-2.0 <see LICENSE file>
*/

import Mixin from './mixin';
import Stub from '../stub';

export default class Contactable extends Mixin {
  beforeCreate() {
    let person = {
      id: GGRC.current_user.id,
      type: 'Person',
    };
    if (!this.contact) {
      this.attr('contact', person);
    }
  }

  formPreload(newObjectForm) {
    let person = {
      id: GGRC.current_user.id,
      type: 'Person',
    };
    if (newObjectForm && !this.contact) {
      this.attr('contact', person);
      this.attr('_transient.contact', person);
    } else if (this.contact) {
      this.attr('_transient.contact', this.contact);
    }
  }
}

// NB : Because the attributes object
//  isn't automatically cloned into subclasses by CanJS (this is an intentional
//  exception), when subclassing a class that uses this mixin, be sure to pull in the
//  parent class's attributes using `Object.assign(this.attributes, <parent_class>.attributes);`
//  in the child class's static init function.
Contactable['extend:attributes'] = {
  contact: Stub,
  secondary_contact: Stub,
};
