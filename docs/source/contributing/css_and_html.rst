CSS and HTML
============

Based and borrowed from `CSS Guidelines <http://cssguidelin.es/>`_

Syntax and formatting

-  two space indents, no tabs
-  80 character wide columns
-  multi-line CSS
-  meaningful use of whitespace

CSS
---

Anathomy of a selector
~~~~~~~~~~~~~~~~~~~~~~

Selectors should be written across multiple lines

..  code-block:: html

    [selector] {
        [property]: [value];
        [<--declaration--->]
    }

-  related selectors on the same line
-  unrelated selectors on new lines
-  a space before our opening brace ``{``
-  properties and values on the same line
-  a space after our property–value delimiting colon ``:``
-  each declaration on its own new line
-  the opening brace ``{`` on the same line as our last selector
-  our first declaration on a new line after our opening brace ``{``
-  our closing brace ``}`` on its own new line
-  each declaration indented by two spaces
-  a trailing semi-colon ``;`` on our last declaration

Exception, single line selector would be in case e.g.

..  code-block:: css

    .icon {
        display: inline-block;
        width:  16px;
        height: 16px;
        background-image: url(/img/sprite.svg);
    }

    .icon--home     { background-position:   0     0  ; }
    .icon--person   { background-position: -16px   0  ; }
    .icon--files    { background-position:   0   -16px; }
    .icon--settings { background-position: -16px -16px; }

Indentations
~~~~~~~~~~~~

Nesting in SASS should be avoided wherever possible. This is
`WHY <http://cssguidelin.es/#specificity>`_

Naming
~~~~~~

For naming we are using `BEM <https://en.bem.info/method/>`_
methodology. BEM stands for:

-  Block: The sole root of the component.
-  Element: A component part of the Block.
-  Modifier: A variant or extension of the Block

You can learn more about it
`here <https://en.bem.info/method/definitions/>`_

A good naming convention will tell you and your team:

-  what type of thing a class does
-  where a class can be used
-  what (else) a class might be related to

``data-*`` Attributes
~~~~~~~~~~~~~~~~~~~~~

A common practice is to use data-\* attributes as JS hooks, but this is
incorrect. data-\* attributes, as per the spec, are used to store custom
data private to the page or application (emphasis mine). data-\*
attributes are designed to store data, not be bound to.

File structure
--------------

Partials
~~~~~~~~

Every component should have it's own partial

HTML
----
Based and borrowed from `Google HTML Style Rules  <https://google.github.io/styleguide/htmlcssguide.html#HTML_Style_Rules>`_

- Use HTML5
- HTML5 (HTML syntax) is preferred for all HTML documents: <!DOCTYPE html>
- Although fine with HTML, do not close void elements, i.e. write <br>, not <br />


HTML Validity:
~~~~~~~~~~~~~~~
- Use valid HTML where possible
- Use valid HTML code unless that is not possible due to otherwise unattainable performance goals regarding file size
- Use tools such as the `W3C HTML validator <https://validator.w3.org/nu/>`_
- Using valid HTML is a measurable baseline quality attribute that contributes to learning about technical requirements and constraints, and that ensures proper HTML usage.

..  code-block:: html

    <!-- Not recommended -->
    <title>Test</title>
    <article>This is only a test.

..  code-block:: html

    <!-- Recommended -->
    <!DOCTYPE html>
    <meta charset="utf-8">
    <title>Test</title>
    <article>This is only a test.</article>

HTML Semantics:
~~~~~~~~~~~~~~~
- Use HTML according to its purpose.
- Use elements (sometimes incorrectly called “tags”) for what they have been created for. For example, use heading elements for headings, p elements for paragraphs, a elements for anchors, etc.
- Using HTML according to its purpose is important for accessibility, reuse, and code efficiency reasons

..  code-block:: html

    <!-- Not recommended -->
    <div onclick="goToRecommendations();">All recommendations</div>

..  code-block:: html

    <!-- Recommended -->
    <a href="recommendations/">All recommendations</a>

HTML Separation:
~~~~~~~~~~~~~~~~~~~
- Separate structure from presentation from behavior
- Strictly keep structure (markup), presentation (styling), and behavior (scripting) apart, and try to keep the interaction between the three to an absolute minimum
- In addition, keep the contact area as small as possible by linking as few style sheets and scripts as possible from documents and templates

HTML Formatting Rules:
~~~~~~~~~~~~~~~~~~~~~~
- Use a new line for every block, list, or table element, and indent every such child element
- When quoting attributes values, use double quotation marks
- While there is no column limit recommendation for HTML, you may consider wrapping long lines if it significantly improves readability
- When line-wrapping, each continuation line should be indented at least 4 additional spaces from the original line
