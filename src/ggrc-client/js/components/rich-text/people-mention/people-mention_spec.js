/*
  Copyright (C) 2020 Google Inc.
  Licensed under http://www.apache.org/licenses/LICENSE-2.0 <see LICENSE file>
*/

import canMap from 'can-map';
import component from './people-mention';
import {getComponentVM} from '../../../../js_specs/spec-helpers';
import {KEY_MAP} from '../../custom-autocomplete/autocomplete-input';

describe('people-mention component', () => {
  let vm;
  let editor;

  beforeEach(() => {
    vm = getComponentVM(component);
    editor = new canMap({
      keyboard: {
        addBinding: jasmine.createSpy('editor.keyboard.addBinding')
          .and.callFake((options, handler) => handler()),
        bindings: {
          [KEY_MAP.ENTER]: [1, 2, 3],
        },
      },
    });
    spyOn(editor, 'on');
  });

  describe('editor set', () => {
    it('does not throw error if passed value is null', () => {
      expect(() => vm.attr('editor', null)).not.toThrowError();
    });

    it('sets editor with new value', () => {
      vm.attr('editor', null);

      expect(vm.attr('editor')).toBeNull();
    });

    describe('if new editor is defined', () => {
      beforeEach(() => {
        spyOn(vm, 'onChange');
        spyOn(vm, 'onActionKey');
        spyOn(vm, 'onEscapeKey');
      });

      it('subscribes editor on "text-change" event ' +
      'with onChange handler', () => {
        vm.attr('editor', editor);

        expect(editor.on)
          .toHaveBeenCalledWith('text-change', jasmine.any(Function));
        editor.on.calls.first().args[1]();
        expect(vm.onChange).toHaveBeenCalled();
      });

      it('adds binding to editor.keyboard on escape key ' +
      'with onEscapeKey handler', () => {
        vm.attr('editor', editor);

        expect(editor.keyboard.addBinding)
          .toHaveBeenCalledWith({key: KEY_MAP.ESCAPE}, jasmine.any(Function));
        expect(vm.onEscapeKey).toHaveBeenCalled();
      });

      it('adds binding to editor.keyboard on arrow down key ' +
      'with onActionKey handler', () => {
        vm.attr('editor', editor);

        expect(editor.keyboard.addBinding).toHaveBeenCalledWith(
          {key: KEY_MAP.ARROW_DOWN}, jasmine.any(Function));
        expect(vm.onActionKey).toHaveBeenCalledWith(KEY_MAP.ARROW_DOWN);
      });

      it('adds binding to editor.keyboard on arrow up key ' +
      'with onActionKey handler', () => {
        vm.attr('editor', editor);

        expect(editor.keyboard.addBinding).toHaveBeenCalledWith(
          {key: KEY_MAP.ARROW_UP}, jasmine.any(Function));
        expect(vm.onActionKey).toHaveBeenCalledWith(KEY_MAP.ARROW_UP);
      });

      it('adds binding to editor.keyboard for enter key ' +
      'with onActionKey handler', () => {
        vm.attr('editor', editor);

        expect(editor.keyboard.bindings[KEY_MAP.ENTER][0].serialize()).toEqual({
          key: KEY_MAP.ENTER,
          handler: jasmine.any(Function),
        });
        editor.keyboard.bindings[KEY_MAP.ENTER][0].handler();
        expect(vm.onActionKey).toHaveBeenCalledWith(KEY_MAP.ENTER);
      });

      it('sets editor with new value', () => {
        vm.attr('editor', editor);

        expect(vm.attr('editor')).toEqual(editor);
      });
    });
  });

  describe('clearMention() method', () => {
    it('assigns null to mentionBeforeSelection attribute', () => {
      vm.attr('mentionBeforeSelection', 'ara');

      vm.clearMention();

      expect(vm.attr('mentionBeforeSelection')).toBeNull();
    });

    it('assigns null to mentionIndex attribute', () => {
      vm.attr('mentionIndex', 711);

      vm.clearMention();

      expect(vm.attr('mentionIndex')).toBeNull();
    });
  });

  describe('onActionKey(keyCode) method', () => {
    let extendedVm;
    let actionKeySpy;

    beforeEach(() => {
      actionKeySpy = jasmine.createSpy('actionKeySpy');

      let originalViewModel = canMap.extend(
        component.prototype.viewModel.prototype
      );
      extendedVm = originalViewModel.extend({
        define: {
          actionKey: {
            set(value) {
              actionKeySpy(value);
              return value;
            },
          },
        },
      })();
    });

    it('returns true if showResults is false', () => {
      extendedVm.attr('showResults', false);

      expect(extendedVm.onActionKey(123)).toBe(true);
    });

    describe('if showResults is true', () => {
      beforeEach(() => {
        extendedVm.attr('showResults', true);
      });

      it('calls setter of actionKey attribute with passed keyCode', () => {
        extendedVm.onActionKey(711);

        // call of actionKeySpy with index "0" was on initializing of viewModel
        expect(actionKeySpy.calls.all()[1].args[0]).toBe(711);
      });

      it('calls setter of actionKey second time with null', () => {
        extendedVm.onActionKey(711);

        expect(actionKeySpy.calls.all()[2].args[0]).toBeNull();
      });

      it('returns false', () => {
        expect(extendedVm.onActionKey(711)).toBe(false);
      });
    });
  });

  describe('onEscapeKey() method', () => {
    beforeEach(() => {
      spyOn(vm, 'clearMention');
    });

    it('returns true if showResults is false', () => {
      vm.attr('showResults', false);

      expect(vm.onEscapeKey()).toBe(true);
    });

    it('calls clearMention method ' +
    'if showResults attribute is true', () => {
      vm.attr('showResults', true);

      vm.onEscapeKey();

      expect(vm.clearMention).toHaveBeenCalled();
    });

    it('returns false if showResults attribute is true', () => {
      vm.attr('showResults', true);

      expect(vm.onEscapeKey()).toBe(false);
    });
  });

  describe('onChange() method', () => {
    beforeEach(() => {
      editor.attr({
        getSelection: jasmine.createSpy('editor.getSelection'),
        getText: jasmine.createSpy('editor.getText'),
      });
      vm.attr('editor', editor);
      spyOn(vm, 'clearMention');
    });

    it('works correctly if editor has no focus', () => {
      editor.getSelection.and.returnValue(null);

      expect(vm.onChange.bind(vm)).not.toThrowError();
    });

    describe('if editorText is parsed according to mention regex', () => {
      const validValues = ['+a@example.com', ' \n\n \n @a@a.com',
        '+a@a.com \n @b@user.dom ', ' +@google.com',
      ];
      const expectedMentions = ['a', 'a@a.com', 'b', ''];
      const expectedDomains = ['@example.com', '', '@user.dom ', '@google.com'];
      const expectedMentionIndexes = [0, 6, 11, 1];
      const selectionIndexes = [
        {index: 2}, {index: 14}, {index: 13}, {index: 2},
      ];

      it('assigns parsed value to "mentionBeforeSelection" attribute', () => {
        editor.getSelection.and.returnValues(...selectionIndexes);
        editor.getText.and.returnValues(...validValues);

        expectedMentions.forEach((expected) => {
          vm.onChange();

          expect(vm.attr('mentionBeforeSelection')).toBe(expected);
        });
      });

      it('assigns parsed value to "mentionAfterSelection" attribute', () => {
        editor.getSelection.and.returnValues(...selectionIndexes);
        editor.getText.and.returnValues(...validValues);

        expectedDomains.forEach((expected) => {
          vm.onChange();

          expect(vm.attr('mentionAfterSelection')).toBe(expected);
        });
      });

      it('assigns index where mention is begun ' +
      'to "mentionIndex" attribute', () => {
        editor.getSelection.and.returnValues(...selectionIndexes);
        editor.getText.and.returnValues(...validValues);

        expectedMentionIndexes.forEach((expected) => {
          vm.onChange();

          expect(vm.attr('mentionIndex')).toBe(expected);
        });
      });
    });

    it('calls clearMention if editorText cannot be parsed ' +
    'according to regex', () => {
      const invalidValues = ['@a ', '@a a', 'com@', '@\n'];
      const selectionIndexes = invalidValues.map((value) => value.length);
      editor.getSelection.and.returnValues(...selectionIndexes);
      editor.getText.and.returnValues(...invalidValues);

      invalidValues.forEach(() => vm.onChange());

      expect(vm.clearMention.calls.all().length).toEqual(invalidValues.length);
    });
  });

  describe('personSelected({person}) method', () => {
    let person;

    beforeEach(() => {
      person = {email: 'ara@example.com'};
      editor.attr({
        updateContents: jasmine.createSpy('editor.updateContents'),
        setSelection: jasmine.createSpy('editor.setSelection'),
      });
      vm.attr('editor', editor);
      vm.attr('mentionBeforeSelection', 'a');
      vm.attr('mentionAfterSelection', '');
      spyOn(vm, 'clearMention');
    });

    describe('calls updateContents with specified operations', () => {
      it('with "retain" operation if mentionIndex > 0', () => {
        vm.attr('mentionIndex', 3);

        vm.personSelected({person});

        expect(editor.updateContents).toHaveBeenCalledWith({
          ops: jasmine.arrayContaining([{retain: 3}]),
        });
      });

      it('without "retain" operation if mentionIndex is 0', () => {
        vm.attr('mentionIndex', 0);

        vm.personSelected({person});

        const ops = editor.updateContents.calls.first().args[0].ops;
        expect(ops).not.toEqual(jasmine.arrayContaining(
          [{retain: jasmine.anything()}]));
      });

      it('with "delete" operation', () => {
        vm.personSelected({person});

        const ops = editor.updateContents.calls.first().args[0].ops;
        expect(ops).toEqual(jasmine.arrayContaining(
          [{'delete': vm.attr('mentionBeforeSelection').length + 1}]));
      });

      it('with "insert" operation for link', () => {
        vm.personSelected({person});

        const ops = editor.updateContents.calls.first().args[0].ops;
        expect(ops).toEqual(jasmine.arrayContaining([{
          insert: `+${person.email}`,
          attributes: {link: `mailto:${person.email}`},
        }]));
      });

      it('with "insert" for space', () => {
        vm.personSelected({person});

        const ops = editor.updateContents.calls.first().args[0].ops;
        expect(ops).toEqual(jasmine.arrayContaining(
          [{insert: ' '}]));
      });
    });

    it('calls setSelection of editor with index after inserted mention', () => {
      vm.personSelected({person});

      expect(editor.setSelection).toHaveBeenCalledWith(
        vm.attr('mentionIndex') + // retain length
        1 + // mention sign length
        person.email.length +
        1 // space length
      );
    });

    it('clears mention', () => {
      vm.personSelected({person});

      expect(vm.clearMention).toHaveBeenCalled();
    });
  });

  describe('"{window} click" event handler', () => {
    let handler;

    beforeEach(() => {
      handler = component.prototype.events['{window} click']
        .bind({viewModel: vm});
      spyOn(vm, 'clearMention');
    });

    it('calls clearMention', () => {
      handler();

      expect(vm.clearMention).toHaveBeenCalled();
    });
  });
});
