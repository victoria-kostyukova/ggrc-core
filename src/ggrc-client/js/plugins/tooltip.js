/*
    Copyright (C) 2020 Google Inc.
    Licensed under http://www.apache.org/licenses/LICENSE-2.0 <see LICENSE file>
*/

let delegate = '[data-toggle="tooltip"], [rel=tooltip]';
let tooltipPrototype = $.fn.tooltip.Constructor.prototype;
let bootstrapTooltipShow = tooltipPrototype.show;
let bootstrapTooltipHide = tooltipPrototype.hide;
let actions = {};


/**
 * Checks if element is a child of another element
 * @param  {Element}  el               element
 * @param  {Element}  possibleParentEl possible parent element
 * @return {Boolean}                  is element is a child of possibleParentEl
 */
function isChildOf(el, possibleParentEl) {
  let parent = el.parentElement;
  while (parent) {
    if ( parent === possibleParentEl ) {
      return true;
    }
    parent = parent.parentElement;
  }
  return false;
}

/**
 * Checks if element is overlaped by other element
 * @param  {Element}  el DOM element
 * @return {Boolean}  is element visible
 */
function isElementVisible(el) {
  const bRect = el.getBoundingClientRect();
  const preparedCoords = {
    x: bRect.left + bRect.width/2,
    y: bRect.top + bRect.height/2,
  };
  const topEl = document.elementFromPoint(preparedCoords.x, preparedCoords.y);
  // Due to various reasons of how browser determines layering of elements on
  // the page, topEl returned from elementFromPoint can either be element or
  // its inner child
  return topEl && (
    el === topEl ||
    isChildOf(topEl, el) ||
    isChildOf(el, topEl)
  );
}

/**
 * This class watches the tooltip associated
 * with the element and removes it if the elements is
 * removed from the DOM
 */
class TooltipWatcher {
  constructor(el, tooltipEl) {
    let $el = $(el);
    let $tooltipEl = $(tooltipEl);
    this.iv = setInterval(() => {
      // if removed from the DOM
      if (!$el.closest('html').length || !isElementVisible($el[0]) ) {
        $tooltipEl.remove();
        this.stopWatch();
      }
    }, 50);
  }

  stopWatch() {
    clearInterval(this.iv);
  }
}

tooltipPrototype.show = function () {
  if (!this.hasContent() || !this.enabled
    || !this.$element[0].matches(delegate)) {
    return;
  }

  bootstrapTooltipShow.apply(this);
  if ( !this.tooltipWatcher ) {
    this.tooltipWatcher = new TooltipWatcher(this.$element, this.$tip);
  }

  actions.isShown = true;
};

tooltipPrototype.hide = function () {
  bootstrapTooltipHide.apply(this);
  if ( this.tooltipWatcher ) {
    this.tooltipWatcher.stopWatch();
    this.tooltipWatcher = null;
  }
  actions.isShown = false;
};

function monitorTooltip(monitorPeriod) {
  /**
   * There is a situation when an user can click a control for which there is
   * two event handlers - click and mouseenter handlers.
   * Click handler is defined by developer, but mouseenter handler is set by Bootstrap
   * 2.3.0.
   *
   * What will happen?
   * 1) User mouse pointer enters within the button ->
   *    Actions:
   *      Bootstrap waits for
   *      defined DELAY after which will should show tooltip.
   * 2) User clicks the button ->
   *    Actions:
   *      Click handler switches template to new button(maximize/minimize, for example).
   *      P.S. Old button is destroyed.
   * 3) After DELAY in (1) Bootstrap uses data for the tooltip which was destroyed in (2).
   */
  let intervalId = setInterval(function () {
    if (actions.isShown && actions.isClicked) {
      clearAllShowedTooltips();
      actions.isClicked = false;
      window.clearInterval(intervalId);
    }
  }, monitorPeriod);
}

function tooltipInit(e) {
  let $currentTarget = $(e.currentTarget);
  let delay = {
    show: 500,
    hide: 0,
  };

  actions = {
    isShown: false,
    isClicked: false,
  };

  $currentTarget
    .tooltip({delay: delay})
    .triggerHandler(e);

  monitorTooltip(delay.show);
  $currentTarget.off('click', delegate, tooltipClick);
}

function tooltipClick(e) {
  let $currentTarget = $(e.currentTarget);
  actions.isClicked = true;
  if ($currentTarget.data('tooltip')) {
    $currentTarget.tooltip('hide');
  }
}

function clearAllShowedTooltips() {
  $('.tooltip').remove();
}

$('body').on('mouseenter', delegate, tooltipInit);
$('body').on('click', delegate, tooltipClick);
$('body').on('shown', '.modal', clearAllShowedTooltips);

