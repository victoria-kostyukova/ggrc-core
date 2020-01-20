/*
  Copyright (C) 2020 Google Inc.
  Licensed under http://www.apache.org/licenses/LICENSE-2.0 <see LICENSE file>
*/


start
  = _* or_exp:or_exp _*
    {
      return {
        expression: or_exp,
      };
    }
  / _*
    {
      return {
        expression: {},
      };
    }
  / .*
    {
      return false;
    }

word_list
  = word:word _* ',' _* word_list:word_list
    {
      return [word].concat(word_list);
    }

  / word:word
    {
      return [word];
    }

or_exp
  = left:and_exp op:OR right:or_exp
    {
      return {
        left: left,
        op: op,
        right: right,
      };
    }
  / and_exp


and_exp
  = left:simple_exp op:AND right:and_exp
    {
      return {
        left:left,
        op: op,
        right: right,
      };
    }
  / simple_exp


simple_exp
  = left:word op:OP right:word
    {
      var lleft = left.toLowerCase();
      return {
        left: lleft,
        op: op,
        right: right,
      };
    }
  / relevant_exp
  / not_empty_revisions_expr
  / paren_exp
  / text_exp
  / in_exp

relevant_exp
  = _* "#" relevant:word_list "#"
    {
      return {
        object_name: relevant[0],
        op: {name: "relevant"},
        ids: relevant.slice(1),
      };
    }

not_empty_revisions_expr
  = left:word _+ "not_empty_revisions_for" _+ right:word
    {
      return {
        op: {name: "not_empty_revisions"},
        resource_type: left,
        resource_id: right,
      }
    }

text_exp
  = _* "~" characters:.*
    {
      return {
        text: characters.join("").trim(),
        op: {name:'text_search'},
      };
    }
  / _* "!~" characters:.*
    {
      return {
        text: characters.join("").trim(),
        op: {name: 'exclude_text_search'},
      };
    }

paren_exp
  = LEFT_P or_exp:or_exp RIGHT_P
    {
      return or_exp;
    }

in_exp
  = left:word _* "IN"i _* LEFT_P right:word_list RIGHT_P
    {
      return {
        left: left,
        op: {name: "IN"},
        right: right,
      }
    }

word
  = unquoted_word
  / quoted_word


unquoted_word
  = word:unqoted_char+
    {
      return word.join('');
    }


quoted_word
  = '"' word:quoted_char* '"'
    {
      return word.join('');
    }

unqoted_char
  = escaped_symbol
  / [a-zA-Z0-9_\-./%]


quoted_char
  = escaped_symbol
  / [^"]


escaped_symbol
  = escape:'\\' symbol:.
    {
      return escape + symbol;
    }


AND
  = _+ 'AND'i _+
    {
      return {
        name: 'AND',
      };
    }
  / _* '&&'   _*
    {
      return {
        name: 'AND',
      };
    }


OR
  = _+ 'OR'i  _+
    {
      return {
        name: 'OR',
      };
    }
  / _* '||'   _*
    {
      return {
        name: 'OR',
      };
    }


OP
  = _* op:('=' / '!=' / '<=' / '<' / '>=' / '>' / '~' / '!~') _*
    {
      return {
        name: op,
      };
    }
  / _+ op:'is' _+
    {
      return {
        name: op,
      };
    }


LEFT_P = '(' _*

RIGHT_P = _* ')'

_ = [ \t\r\n\f]+
