/*
  Copyright (C) 2020 Google Inc.
  Licensed under http://www.apache.org/licenses/LICENSE-2.0 <see LICENSE file>
*/

import canList from 'can-list';
import canMap from 'can-map';
import * as caUtils from '../../../plugins/utils/ca-utils';
import Component from '../revisions-comparer';
import Revision from '../../../models/service-models/revision';
import {getComponentVM} from '../../../../js_specs/spec-helpers';
import Control from '../../../models/business-models/control';

describe('revisions-comparer component', function () {
  let viewModel;

  beforeEach(function () {
    viewModel = getComponentVM(Component);
  });

  describe('prepareInstances() method', function () {
    let fakeData;
    let method; // the method under test

    beforeEach(function () {
      method = viewModel.prepareInstances.bind(viewModel);
      fakeData = [
        {
          id: 1,
          content: new canMap({id: 1}),
          resource_type: 'Control',
        }, {
          id: 2,
          content: new canMap({id: 1}),
          resource_type: 'Control',
        },
      ];
    });

    it('returns instances of necessary type and with isRevision', function () {
      let result = method(fakeData);
      result.forEach(function (item) {
        expect(item.instance instanceof Control).toBeTruthy();
        expect(item.instance.type).toBe('Control');
        expect(item.instance.isRevision).toBe(true);
      });
    });

    it('returns the same length of instances as passed', function () {
      let result = method(fakeData);
      expect(result.length).toBe(fakeData.length);
    });

    it('returns the same data as passed with extra properties', function () {
      let result = method(fakeData);
      let data = fakeData;
      result.forEach(function (item, index) {
        expect(item.instance.id).toEqual(data[index].content.id);
      });
    });

    it('adds person stubs to access control list items', function () {
      let result;

      fakeData.forEach(function (item, i) {
        let acl = new canList([
          {ac_role_id: i * 10, person_id: i * 10},
          {ac_role_id: i * 10, person_id: i * 10},
        ]);
        item.content.attr('access_control_list', acl);
      });

      result = method(fakeData);

      function checkAclItem(item) {
        expect(item.person).toBeDefined();
        expect(item.person.type).toEqual('Person');
        expect(item.person.id).toEqual(item.person_id);
      }

      result.forEach(function (item) {
        item.instance.access_control_list.forEach(checkAclItem);
      });
    });
  });

  describe('getRevisions() method', function () {
    let method;

    beforeEach(function () {
      method = viewModel.getRevisions;
    });

    it('when cache is empty doing ajax call for all revisions',
      function (done) {
        spyOn(Revision, 'findInCacheById').and.returnValue(undefined);

        spyOn(Revision, 'findAll').and.returnValue(
          $.Deferred().resolve([{id: 42}, {id: 11}])
        );

        spyOn(Revision, 'findOne').and.returnValue(
          $.Deferred().resolve({id: 42})
        );

        method(42, 11).then(function (result) {
          expect(result.length).toEqual(2);

          expect(Revision.findAll).toHaveBeenCalledWith({
            id__in: '42,11',
          });

          expect(Revision.findOne).not.toHaveBeenCalled();

          done();
        });
      });

    it('when in cache only one object doing findOne call',
      function (done) {
        spyOn(Revision, 'findInCacheById').and
          .returnValues({id: 42}, undefined);

        spyOn(Revision, 'findAll').and.returnValue(
          $.Deferred().resolve([{id: 42}, {id: 11}])
        );

        spyOn(Revision, 'findOne').and.returnValue(
          $.Deferred().resolve({id: 42})
        );

        method(42, 11).then(function (result) {
          expect(result.length).toEqual(2);

          expect(Revision.findAll).not.toHaveBeenCalled();

          expect(Revision.findOne).toHaveBeenCalledWith({id: 11});

          done();
        });
      });

    it('when cache contains all objects are not doing ajax call',
      function (done) {
        spyOn(Revision, 'findInCacheById').and.returnValues({id: 42}, {id: 11});

        spyOn(Revision, 'findAll').and.returnValue(
          $.Deferred().resolve([{id: 42}, {id: 11}])
        );

        spyOn(Revision, 'findOne').and.returnValue(
          $.Deferred().resolve({id: 42})
        );

        method(42, 11).then(function (result) {
          expect(result.length).toEqual(2);

          expect(Revision.findAll).not.toHaveBeenCalled();

          expect(Revision.findOne).not.toHaveBeenCalled();

          done();
        });
      });
  });

  describe('"highlightAttachments" method', () => {
    const highlighted = '.diff-highlighted';

    const prepareComparerModal = () => {
      return $(
        `<div>
          <section class="info">
            <div class="tier-content">
              <div class="related-urls__list"></div>
              <folder-attachments-list>
                <div class="mapped-folder"></div>
                <object-list></object-list>
              </folder-attachments-list>
            </div>
          </section>
          <section class="info">
            <div class="tier-content">
              <div class="related-urls__list"></div>
              <folder-attachments-list>
                <div class="mapped-folder"></div>
                <object-list></object-list>
              </folder-attachments-list>
            </div>
          </section>
        </div>`
      );
    };

    it('highlights "folder" value', () => {
      const revisionsList = [
        [
          {instance: {folder: 'old_value'}},
          {instance: {folder: 'new_value'}},
        ],
        [
          {instance: {folder: undefined}},
          {instance: {folder: 'some_value'}},
        ],
        [
          {instance: {folder: ''}},
          {instance: {folder: 'some_value'}},
        ],
      ];

      revisionsList.forEach((revisions) => {
        let $target = prepareComparerModal();
        viewModel.highlightAttachments($target, revisions);
        const selector = 'folder-attachments-list .mapped-folder';

        expect($target.find(`${selector}${highlighted}`).length).toEqual(2);
      });
    });

    it('highlights "documents_file" value', () => {
      const revisionsList = [
        [
          {instance: {documents_file: new canMap({value: 'doc1'})}},
          {instance: {documents_file: new canMap({value: 'doc2'})}},
        ],
        [
          {instance: {documents_file: undefined}},
          {instance: {documents_file: new canMap({value: 'doc3'})}},
        ],
      ];

      revisionsList.forEach((revisions) => {
        let $target = prepareComparerModal();
        viewModel.highlightAttachments($target, revisions);
        const selector = 'folder-attachments-list object-list';

        expect($target.find(`${selector}${highlighted}`).length).toEqual(2);
      });
    });

    it('highlights "documents_reference_url" value', () => {
      const revisionsList = [
        [
          {instance: {documents_reference_url: new canMap({value: 'url1'})}},
          {instance: {documents_reference_url: new canMap({value: 'url2'})}},
        ],
        [
          {instance: {documents_reference_url: undefined}},
          {instance: {documents_reference_url: new canMap({value: 'url3'})}},
        ],
      ];

      revisionsList.forEach((revisions) => {
        let $target = prepareComparerModal();
        viewModel.highlightAttachments($target, revisions);
        const selector = '.related-urls__list';

        expect($target.find(`${selector}${highlighted}`).length).toEqual(2);
      });
    });
  });

  describe('"highlightCustomAttributes" method', () => {
    const titleSelector = '.info-pane__section-title';
    const valueSelector = 'readonly-inline-content';
    const highlightSelector = '.diff-highlighted';
    const attributeSelector = '.ggrc-form-item';

    let method;
    let revisions;

    beforeEach(() => {
      method = viewModel.highlightCustomAttributes.bind(viewModel);
      spyOn(viewModel, 'equalizeHeights');
    });

    it('prepares custom attributes', () => {
      revisions = [
        {
          instance: new canMap(),
        }, {
          instance: new canMap(),
        },
      ];
      let $target = $('<div/>');

      spyOn(caUtils, 'prepareCustomAttributes').and.returnValue([]);

      method($target, revisions);
      expect(caUtils.prepareCustomAttributes.calls.count()).toEqual(2);
    });

    describe('when attribute was updated', () => {
      let $target;

      beforeEach(() => {
        let ca0s = [{
          custom_attribute_id: 1,
          def: {
            title: 'title',
          },
          attribute_value: 'value',
        }, {
          custom_attribute_id: 2,
          def: {
            title: 'person attr',
          },
          attribute_value: 'Person',
        }];

        let ca1s = [{
          custom_attribute_id: 1,
          def: {
            title: 'changed title',
          },
          attribute_value: 'changed value',
        }, {
          custom_attribute_id: 2,
          def: {
            title: 'person attr',
          },
          attribute_value: 'changed Person',
        }];

        let index = 0;
        spyOn(caUtils, 'prepareCustomAttributes').and
          .callFake((defs, values) => {
            if (index === 0) {
              index++;
              return ca0s;
            }
            return ca1s;
          });

        $target = $(`<div>
                    <section class="info">
                      <global-custom-attributes>
                        <div class="ggrc-form-item">
                          <div class="info-pane__section-title"></div>
                          <readonly-inline-content></readonly-inline-content>
                        </div>
                        <div class="ggrc-form-item">
                          <div class="info-pane__section-title"></div>
                          <readonly-inline-content></readonly-inline-content>
                        </div>
                      </global-custom-attributes>
                    </section>
                    <section class="info">
                      <global-custom-attributes>
                        <div class="ggrc-form-item">
                          <div class="info-pane__section-title"></div>
                          <readonly-inline-content></readonly-inline-content>
                        </div>
                        <div class="ggrc-form-item">
                          <div class="info-pane__section-title"></div>
                          <readonly-inline-content></readonly-inline-content>
                        </div>
                      </global-custom-attributes>
                    </section>
                  </div>`);
      });

      it('highlights changed titles', () => {
        method($target, revisions);

        expect($target.find(`${titleSelector}${highlightSelector}`).length)
          .toEqual(2);
      });

      it('highlights changed values', () => {
        method($target, revisions);

        expect($target.find(`${valueSelector}${highlightSelector}`).length)
          .toEqual(4);
      });

      it('equlizes blocks heights', () => {
        method($target, revisions);
        expect(viewModel.equalizeHeights.calls.count()).toEqual(2);
      });
    });

    describe('when attribute was removed', () => {
      let $target;

      beforeEach(() => {
        let ca0s = [{
          custom_attribute_id: 1,
          def: {
            title: 'title',
          },
          attribute_value: 'value',
        }, {
          custom_attribute_id: 2,
          def: {
            title: 'ca2 title',
          },
          attribute_value: 'ca2 value',
        }];

        let ca1s = [{
          custom_attribute_id: 2,
          def: {
            title: 'ca2 title',
          },
          attribute_value: 'ca2 value',
        }];

        let index = 0;
        spyOn(caUtils, 'prepareCustomAttributes').and
          .callFake((defs, values) => {
            if (index === 0) {
              index++;
              return ca0s;
            }
            return ca1s;
          });

        $target = $(
          `<div>
            <section class="info">
              <global-custom-attributes>
                <div class="ggrc-form-item">
                  <div class="info-pane__section-title">title</div>
                  <readonly-inline-content>value</readonly-inline-content>
                </div>
                <div class="ggrc-form-item">
                  <div class="info-pane__section-title">ca2 title</div>
                  <readonly-inline-content>ca2 value</readonly-inline-content>
                </div>
              </global-custom-attributes>
            </section>

            <section class="info">
              <global-custom-attributes>
                <div class="ggrc-form-item">
                  <div class="info-pane__section-title">ca2 title</div>
                  <readonly-inline-content>ca2 value</readonly-inline-content>
                </div>
              </global-custom-attributes>
            </section>
          </div>`
        );
      });

      it('adds empty html block to the right panel', () => {
        let emptyBlockSelector =
          `global-custom-attributes:last ${attributeSelector}:first:empty`;
        method($target, revisions);
        expect($target.find(emptyBlockSelector).length).toEqual(1);
      });

      it('highlights removed attribute title', () => {
        method($target, revisions);
        expect($target.find(`${titleSelector}${highlightSelector}`).length)
          .toEqual(1);
      });

      it('highlights removed attribute value', () => {
        method($target, revisions);
        expect($target.find(`${valueSelector}${highlightSelector}`).length)
          .toEqual(1);
      });

      it('equlizes blocks heights', () => {
        method($target, revisions);
        expect(viewModel.equalizeHeights.calls.count()).toEqual(2);
      });
    });

    describe('when all attributes were removed', () => {
      let $target;

      beforeEach(() => {
        let ca0s = [{
          custom_attribute_id: 1,
          def: {
            title: 'ca1 title',
          },
          attribute_value: 'ca1 value',
        }, {
          custom_attribute_id: 2,
          def: {
            title: 'ca2 title',
          },
          attribute_value: 'ca2 value',
        }];

        let ca1s = [];

        let index = 0;
        spyOn(caUtils, 'prepareCustomAttributes').and
          .callFake((defs, values) => {
            if (index === 0) {
              index++;
              return ca0s;
            }
            return ca1s;
          });

        $target = $(
          `<div>
            <section class="info">
              <global-custom-attributes>
                <div class="ggrc-form-item">
                  <div class="info-pane__section-title">title</div>
                  <readonly-inline-content>value</readonly-inline-content>
                </div>
                <div class="ggrc-form-item">
                  <div class="info-pane__section-title">ca2 title</div>
                  <readonly-inline-content>ca2 value</readonly-inline-content>
                </div>
              </global-custom-attributes>
            </section>

            <section class="info">
              <global-custom-attributes>
              </global-custom-attributes>
            </section>
          </div>`
        );
      });

      it('adds empty html blocks to the right panel', () => {
        let emptyBlockSelector =
          `global-custom-attributes:last ${attributeSelector}:empty`;
        method($target, revisions);
        expect($target.find(emptyBlockSelector).length).toEqual(0);
      });

      it('highlights removed attributes title', () => {
        method($target, revisions);
        expect($target.find(`${titleSelector}${highlightSelector}`).length)
          .toEqual(2);
      });

      it('highlights removed attributes value', () => {
        method($target, revisions);
        expect($target.find(`${valueSelector}${highlightSelector}`).length)
          .toEqual(2);
      });

      it('equlizes blocks heights', () => {
        method($target, revisions);
        expect(viewModel.equalizeHeights.calls.count()).toEqual(2);
      });
    });

    describe('when attribute was added', () => {
      let $target;

      beforeEach(() => {
        let ca0s = [{
          custom_attribute_id: 2,
          def: {
            title: 'title',
          },
          attribute_value: 'value',
        }];

        let ca1s = [{
          custom_attribute_id: 1,
          def: {
            title: 'new attribute title',
          },
          attribute_value: 'new attribute value',
        }, {
          custom_attribute_id: 2,
          def: {
            title: 'title',
          },
          attribute_value: 'value',
        }];

        let index = 0;
        spyOn(caUtils, 'prepareCustomAttributes').and
          .callFake((defs, values) => {
            if (index === 0) {
              index++;
              return ca0s;
            }
            return ca1s;
          });

        $target = $(`<div>
                    <section class="info">
                      <global-custom-attributes>
                        <div class="ggrc-form-item">
                          <div class="info-pane__section-title">title</div>
                          <readonly-inline-content></readonly-inline-content>
                        </div>
                      </global-custom-attributes>
                    </section>
                    <section class="info">
                      <global-custom-attributes>
                        <div class="ggrc-form-item">
                          <div class="info-pane__section-title">new title</div>
                          <readonly-inline-content></readonly-inline-content>
                        </div>
                        <div class="ggrc-form-item">
                          <div class="info-pane__section-title">title</div>
                          <readonly-inline-content></readonly-inline-content>
                        </div>
                      </global-custom-attributes>
                    </section>
                  </div>`);
      });

      it('adds empty html block to the left panel', () => {
        let emptyBlockSelector =
          `global-custom-attributes:first ${attributeSelector}:first:empty`;
        method($target, revisions);
        expect($target.find(emptyBlockSelector).length).toEqual(1);
      });

      it('highlights new attribute title', () => {
        method($target, revisions);
        expect($target.find(`${titleSelector}${highlightSelector}`).length)
          .toEqual(1);
      });

      it('highlights new attribute value', () => {
        method($target, revisions);
        expect($target.find(`${valueSelector}${highlightSelector}`).length)
          .toEqual(1);
      });

      it('equlizes blocks heights', () => {
        method($target, revisions);
        expect(viewModel.equalizeHeights.calls.count()).toEqual(2);
      });
    });
  });

  describe('"highlightCustomRoles" method', () => {
    const highlightSelector = '.diff-highlighted';
    const blockSelector = 'object-list';

    describe('compareRoleBlocks() method', () => {
      let $blockEmpty;
      let $blockNotEmpty;
      let $target;
      let $rolesPanes;

      beforeEach(() => {
        $blockEmpty = $(`<div>
                          <related-people-access-control-group>
                              <object-list>
                                <div class="object-list__item-empty">
                                  None
                                </div>
                              </object-list>
                          </related-people-access-control-group>
                        </div>`);
        $blockNotEmpty = $(`<div>
                              <related-people-access-control-group>
                                <object-list>
                                  <div class="object-list__items">
                                    <person-data>
                                      person1@example.com
                                    </person-data>
                                  </div>
                                </object-list>
                              </related-people-access-control-group>
                            </div>`);
        $target = {find: () => {}};
      });

      it(`do not highlights blocks of grants if list of people was empty
        in the old revision`, () => {
        $rolesPanes = $blockEmpty.add($blockNotEmpty);
        spyOn($target, 'find').and.returnValue($rolesPanes);

        viewModel.highlightCustomRoles($target);

        expect($rolesPanes.find(`${blockSelector}${highlightSelector}`)
          .length).toEqual(1);
      });

      it(`do not highlights blocks of grants if list of people is empty
        in the new revision`, () => {
        $rolesPanes = $blockNotEmpty.add($blockEmpty);
        spyOn($target, 'find').and.returnValue($rolesPanes);

        viewModel.highlightCustomRoles($target);

        expect($rolesPanes.find(`${blockSelector}${highlightSelector}`)
          .length).toEqual(1);
      });
    });
  });
});
