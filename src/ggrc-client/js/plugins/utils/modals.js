/*
 Copyright (C) 2019 Google Inc.
 Licensed under http://www.apache.org/licenses/LICENSE-2.0 <see LICENSE file>
 */

import ModalsController from '../../controllers/modals/modals_controller';

/**
 * Utils methods for showing standart modals
 */

const path = GGRC.templates_path || '/static/templates';
const BUTTON_VIEW_DONE = `${path}/modals/done_buttons.stache`;
const BUTTON_VIEW_CLOSE = `${path}/modals/close_buttons.stache`;
const BUTTON_VIEW_SAVE_CANCEL = `${path}/modals/save_cancel_buttons.stache`;
const BUTTON_VIEW_SAVE_CANCEL_DELETE = // eslint-disable-line
  `${path}/modals/save_cancel_delete_buttons.stache`;
const BUTTON_VIEW_CONFIRM_CANCEL = // eslint-disable-line
  `${path}/modals/confirm_cancel_buttons.stache`;
const CONTENT_VIEW_WARNING =
  `${path}/base_objects/confirm_warning.stache`;
const BUTTON_VIEW_CONFIRM = `${path}/modals/confirm_button.stache`;
const CONTENT_VIEW_CONFIRM = `${path}/modals/confirm.stache`;
const BUTTON_CREATE_PROPOSAL = `${path}/modals/create_proposal.stache`;

/**
 * Shows a warning popup within given options. If a user confirms
 * warning popup, then are called a success callback else - a fail callback.
 *
 * For showing the popup, by default, are used a
 * confirm method which controls user actions.
 *
 * Also the user can set own controller by setting controller field in
 * extra param.
 * Warning! Controller should have attached context!
 *
 * Note! It's not recommended to override content_view in the options param,
 * because popup is configured for the default template. If you want to use own
 * logic for confirmation you should explore _setupWarning method and use
 * own templates appropriate to its logic.
 * Be careful with confirmOperationName field - remember that standart
 * confirm uses confirmOperationName='confirm'
 * If you sets another value (for example, 'delete'), confirm button will
 * not be able to call success callback. If you want to set it then change
 * a controller with help extra param
 * which will process events for tags with data-{{your confirmOperationName}}
 *
 * @param {Object} options - Sets options for popup. See warning.settings
 *                           with default options.
 * @param {Function} success - Called if a user confirms the warning
 * @param {Function} fail - Called if a user dismiss the warning
 * @param {Object} [extra] - Extra options for warning. See warning.extraSettings
 *                           with default options.
 * @param {Function} extra.controller - Controller with attached context
 * @return {Object} - confirm window
 *
 * @example <caption>Default usage</caption>
 * let options = {
 *  skip_refresh: false,               // refreshes information about instance
 *  modal_title: 'Delete operation',   // title for popup
 *  objectShortInfo: 'Object #21',     // short title for object, for which confirmation is required
 *  modal_description: 'Operation is irreversible', // description for operation
 *  confirmTextForTyping: 'I confirm deletion', // text for confirm input
 *  buttonExtraClasses: 'disabled'     // initially confirm button is disabled
 * };
 *
 * warning(
 *  options,
 *  function () {
 *    console.warn('Success!');
 *  },
 *  function () {
 *    console.warn('Fail:(');
 *  }
 * )
 */
function warning(options, success, fail, extra) {
  let confirmOptions = Object.assign({}, warning.settings, options);
  let confirmResult;

  extra = extra || {};

  if (extra.controller) {
    new extra.controller(extra.target, confirmOptions, success, fail);
    confirmResult = extra.target;
  } else {
    confirmResult = confirm(confirmOptions, success, fail);
  }

  _setupWarning(confirmResult, confirmOptions);
  return confirmResult;
}

function _onDismissHandler($target, dismiss) {
  $target.modal('hide').remove();
  if (dismiss) {
    dismiss();
  }
}

function confirm(options, success, dismiss) {
  let $target = $('<div class="modal hide ' +
    options.extraCssClass +
    '"></div>');

  import(/* webpackChunkName: "modalsCtrls" */'../../controllers/modals')
    .then(() => {
      $target
        .modal({backdrop: 'static'});

      new ModalsController($target, Object.assign({
        new_object_form: false,
        button_view: BUTTON_VIEW_CONFIRM_CANCEL,
        modal_confirm: 'Confirm',
        modal_description: 'description',
        modal_title: 'Confirm',
        content_view: CONTENT_VIEW_CONFIRM,
      }, options));

      $target.on('click', 'a.btn[data-toggle=confirm]', function (e) {
        let params = $(e.target).closest('.modal').find('form')
          .serializeArray();
        $target.modal('hide').remove();
        if (success) {
          success(params, $(e.target).data('option'));
        }
      })
        .on('click.modal-form.close', '[data-dismiss="modal"]', function () {
          _onDismissHandler($target, dismiss);
        })
        .on('keyup', function (e) {
          const ESCAPE_KEY_CODE = 27;
          const escapeKeyWasPressed = e.keyCode === ESCAPE_KEY_CODE;

          if (escapeKeyWasPressed) {
            _onDismissHandler($target, dismiss);
          }
        });
    });

  return $target;
}

// default static const settings
warning.settings = Object.freeze({
  skip_refresh: true, // do not reload info about instance
  modal_title: 'Warning',
  objectShortInfo: 'Object',
  modal_description: '',
  confirmOperationName: 'confirm',
  confirmTextForTyping: 'I confirm',
  content_view: CONTENT_VIEW_WARNING,
  button_view: BUTTON_VIEW_CONFIRM,
  buttonExtraClasses: 'disabled',
});

function _setupWarning(confirm, settings) {
  let confirmText = settings.confirmTextForTyping.toLowerCase();
  let toggleClasses = settings.buttonExtraClasses;
  let operation = settings.confirmOperationName;
  let buttonSelector = '[data-toggle=' + operation + ']';

  confirm.on('change paste keyup', 'input[data-edit=confirm]',
    function (e) {
      let confirmButton = confirm.find(buttonSelector);
      let text = $(this)
        .val()
        .trim()
        .toLowerCase();

      if (text === confirmText) {
        confirmButton.removeClass(toggleClasses);
      } else {
        confirmButton.addClass(toggleClasses);
      }
    })
    .on('keydown', (e) => {
      // handle pressing enter
      if (e.keyCode === 13) {
        // prevent triggering of form submit event
        e.preventDefault();

        let confirmButton = confirm.find(buttonSelector);
        if (!confirmButton.hasClass('disabled')) {
          confirmButton.trigger('click');
        }
      }
    });
}

// make buttons non-clickable when saving
const bindXHRToButton = (xhr, el, newtext, disable) => {
  // binding of an ajax to a click is something we do manually
  let $el = $(el);
  let oldtext = $el[0] ? $el[0].innerHTML : '';

  if (newtext) {
    $el[0].innerHTML = newtext;
  }
  $el.addClass('disabled');
  if (disable !== false) {
    $el.attr('disabled', true);
  }
  xhr.always(() => {
    // If .text(str) is used instead of innerHTML, the click event may not fire depending on timing
    if ($el.length) {
      $el.removeAttr('disabled')
        .removeClass('disabled')[0].innerHTML = oldtext;
    }
  });
};

export {
  warning,
  confirm,
  bindXHRToButton,
  BUTTON_VIEW_DONE,
  BUTTON_VIEW_CLOSE,
  BUTTON_VIEW_SAVE_CANCEL,
  BUTTON_VIEW_SAVE_CANCEL_DELETE,
  BUTTON_VIEW_CONFIRM_CANCEL,
  BUTTON_CREATE_PROPOSAL,
};
