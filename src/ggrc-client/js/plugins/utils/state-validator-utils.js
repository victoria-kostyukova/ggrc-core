/*
 Copyright (C) 2020 Google Inc.
 Licensed under http://www.apache.org/licenses/LICENSE-2.0 <see LICENSE file>
*/

/**
 * A validation state is a plain object which contains fields set
 * with help a pushed by client the validation actions.
 * @typedef {Object} ValidationState
 *
 * A validation action is a function which should return a new object with the
 * changes for validation state.
 * @typedef {function} ValidationAction
 *
 * An injection is a plain object which contains data necessary for
 * validation actions.
 * @typedef {Object} Injection
 */

/**
 * @class
 * @classdesc
 * Provides ability to generate state dependig on validation actions and
 * injected data.
 *
 * @see {@link ValidationState}
 * @example <caption>Example of state object</caption>
 * {
 *    isEmpty: true,
 *    isValid: false,
 *    hasMissingData: true,
 *    isString: false,
 * }
 *
 * @see {@link ValidationAction}
 * @example <caption>Example of simple validation action</caption>
 * // Old state
 * // {
 * //    isEmpty: true
 * // }
 * const text = 'Opa opa opa-pa!';
 * // Generate state updates
 * const action = () => {
 *  const isEmpty = text.length === 0;
 *  const isString = typeof text === 'string';
 *
 *  return {isEmpty, isString}
 * };
 * validator.validate();
 * // After validation a new state has form:
 * // {
 * //   isEmpty: false,
 * //   isString: true,
 * // }
 *
 * @see {@link Injection}
 * @example <caption>Example of injection</caption>
 * const injection = {
 *    email: 'hello@google.com',
 * };
 * // The injection is passed in each validation action
 * const hasEmptyEmail = ({email}) => ({
 *    hasEmptyEmail: email.length > 6,
 * });
 * const hasEmptyDescription = ({description}) => ({
 *    hasEmptyDescription: description.length !== 0,
 * });
 * const logValidation = (inj) => {
 *  console.log(inj.email);
 * }
 */
export default class StateValidator {
  /**
   * Creates instance of state validator.
   * @param {Injection} [initInjection={}] - Initial injection object.
   * @param {ValidationState} [initState={}] - Initial state.
   */
  constructor(initInjection = {}, initState = {}) {
    this._validationState = initState;
    this._injected = initInjection;
    this._validationActions = [];
  }

  /**
   * Adds [validation actions]{@link ValidationAction} to validator.
   * @param {...ValidationAction} actions - A set of {@link ValidationAction}.
   * @example
   * // validation actions
   * const action1 = () => ({a: 1});
   * // adds actions to validator
   * validator.addValidationActions(action1);
   */
  addValidationActions(...actions) {
    this._validationActions.push(...actions);
  }

  /**
   * Updates current validator [injection]{@link Injection} with new data.
   * Note: If is updated some field which is Object then it will be overwritten.
   * @param {Injection} injection - A new [injection object]{@link Injection}.
   */
  updateInjection(injection) {
    let injected = this._injected;
    Object.assign(injected, injection);
  }

  /**
   * Calls all validation [actions]{@link ValidationAction} with passed
   * [injections]{@link Injection} for updating inner validation state.
   */
  validate() {
    const validateActions = this._validationActions;
    const injected = this._injected;
    const newState = validateActions
      .reduce((state, action) => {
        const actionState = action(injected);
        return Object.assign(state, actionState);
      }, {});

    Object.assign(
      this._validationState,
      newState
    );
  }

  /**
   * Returns current validation state.
   * @return {ValidationState} - Current validation state.
   */
  get validationState() {
    return this._validationState;
  }
}
