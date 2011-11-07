/**
 * zenNodes v0.2.0
 * A Javascript implementation of Zen Coding that generates DOM nodes. 
 * 
 * Copyright (c) 2011 Phuong Phan
 * Release under the MIT license.
 * 
 * Design credits goes to Zen Coding author(s).
 * http://code.google.com/p/zen-coding/
 */

(function (window, undefined) {

///////////////////////////////////////////////////////////////////////
// Main

var zenNodes = function (input, parent) {
  var state = zenNodes.analyze(input);
  
  if (state.input.length)
    zenNodes.error('Syntax error: expecting ' + zenNodes.grammars[state.previous].join(', ') + ' token after ' + (state.tokens.length ? zenNodes.func.lastToken(state.tokens).name : '$start'));
  if (!zenNodes.func.inList(zenNodes.grammars[state.previous], '$end'))
    zenNodes.error('Syntax error: unterminated ' + state.previous + ' expecting ' + zenNodes.grammars[state.previous].join(', ') + ' token');
  
  delete state.input;
  delete state.previous;
  zenNodes.parse(state, parent);
  
  return state.root;
};

zenNodes.analyze = function (input) {
  var state = {
      input: input,
      previous: '$start',
      tokens: []
    },
    name = '',
    value = '';
  
  do {
    name = zenNodes.getNextTokenName(state.input, state.previous);
    if (name) {
      value = zenNodes.getValue(state.input, name);
      state.tokens.push(new zenNodes.obj.Token(name, zenNodes.tokens[name].type, value[zenNodes.tokens[name].value]));
      state.input = state.input.substr(value[0].length);
      state.previous = name;
    }
  } while (state.input.length && name);
  
  return state;
};

zenNodes.error = function (msg) {
  throw 'zenNodes: ' + msg;
};

zenNodes.parse = function (state, parent) {
  state.current = null;
  state.data = {};
  state.multiplier = false;
  state.parent = [];
  state.root = parent || zenNodes.func.fragment();
  state.parent.push(state.root);
  
  var token = null,
    i = 0,
    size = state.tokens.length
  
  zenNodes.rules.$init(state.data);
  for (; i < size; i++) {
    token = state.tokens[i];
    if (token.name in zenNodes.parser)
      zenNodes.parser[token.name](state, token, i);
    zenNodes.rules.$common(state.data, token);
    if (token.name in zenNodes.rules)
      zenNodes.rules[token.name](state.data, token);
  }
};

zenNodes.getNextTokenName = function (input, tokenName) {
  var grammars = zenNodes.grammars,
    i = 0,
    size = grammars[tokenName].length;
  for (; i < size; i++)
    if (grammars[tokenName][i] != '$end' && zenNodes.tokens[grammars[tokenName][i]].pattern.test(input))
      return grammars[tokenName][i];
};

zenNodes.getValue = function (input, type) {
  if ('block' in zenNodes.tokens[type]) {
    var result = input.substr(0, zenNodes.func.blocks(input, zenNodes.tokens[type].block));
    return [result, result];
  }
  return zenNodes.tokens[type].pattern.exec(input);
};

zenNodes.func = {};
zenNodes.init = {};
zenNodes.obj = {};

///////////////////////////////////////////////////////////////////////
// Defines tokens. Value is the index for RegExp.exec.

zenNodes.tokenTypes = {
  NUMBER: 1,
  STRING: 2,
  TEXT: 3
};

zenNodes.tokens = {
  'attribute'         : { value: 1, pattern: /^(\[)/ },
  'attributeEnd'      : { value: 1, pattern: /^(])/ },
  'attributeName'     : { value: 1, pattern: /^([a-zA-Z_:][\w:.-]+)/ },
  'attributeSeparator': { value: 1, pattern: /^( )/ },
  'attributeValue'    : { value: 2, pattern: /^=('|")?([^\1]+?)\1/ },
  'autocomplete'      : { value: 1, pattern: /^(\+)$/ },
  'class'             : { value: 1, pattern: /^\.([\w-_]+)/ },
  'descendant'        : { value: 1, pattern: /^(>)/ },
  'group'             : { value: 1, pattern: /^(\()/ },
  'groupContents'     : { value: 1, pattern: /^([^)]+)/, type: zenNodes.tokenTypes.TEXT, block: { start: '(', end: ')' } },
  'groupEnd'          : { value: 1, pattern: /^(\))/ },
  'id'                : { value: 1, pattern: /^#([\w-_]+)/ },
  'multiplier'        : { value: 1, pattern: /^\*([\d]+)/, type: zenNodes.tokenTypes.NUMBER },
  'placeholder'       : { value: 1, pattern: /^(\$+)/ },
  'sibling'           : { value: 1, pattern: /^(\+)/ },
  'tag'               : { value: 1, pattern: /^([a-z]+)/ },
  'text'              : { value: 1, pattern: /^({)/ },
  'textContents'      : { value: 1, pattern: /^(.*?(?:[^\\])(?![^}]+))/ },
  'textEnd'           : { value: 1, pattern: /^(})/ }
};

///////////////////////////////////////////////////////////////////////
// Defines grammar sequence. $start marks the beginning while $end 
// marks a state can be terminated. A set is prefixed with $ that can 
// be included into transition states. 

zenNodes.grammars = {
  '$start'            : ['attribute', 'class', 'id', 'tag', 'text'],
  '$afterTag'         : ['attribute', 'class', 'descendant', 'id', 'multiplier', 'sibling', 'text'],
  'attribute'         : ['attributeName'],
  'attributeEnd'      : ['$end', '$afterTag'],
  'attributeName'     : ['attributeEnd', 'attributeValue'],
  'attributeSeparator': ['attributeName'],
  'attributeValue'    : ['attributeEnd', 'attributeSeparator'],
  'autocomplete'      : ['$end'],
  'class'             : ['$end', '$afterTag', 'placeholder'],
  'descendant'        : ['$afterTag', 'group', 'tag'],
  'group'             : ['groupContents'],
  'groupContents'     : ['groupEnd'],
  'groupEnd'          : ['$end', 'sibling'],
  'id'                : ['$end', '$afterTag', 'placeholder'],
  'multiplier'        : ['$end', 'descendant', 'sibling'],
  'placeholder'       : ['multiplier'],
  'sibling'           : ['$afterTag', 'group', 'tag'],
  'tag'               : ['$end', '$afterTag', 'autocomplete'],
  'text'              : ['textContents'],
  'textContents'      : ['textEnd'],
  'textEnd'           : ['$end', '$afterTag']
};

///////////////////////////////////////////////////////////////////////
// Defines rules when dealing with groups of tokens. Rules are checked 
// after each token is parsed. Tokens that does not have any rules do 
// not need to be defined. $init is called once before tokens gets 
// parsed while $common gets called every time a token is parsed. 
// $common gets called first before the token rule.

zenNodes.rules = {
  $init: function (data) {
    if (!('attributes' in data))
      data.attributes = {};
    if (!('counters' in data))
      data.counters = {};
  },
  
  $common: function (data, token) {
    data.counters[token.name] = !(token.name in data.counters) ? 1 : data.counters[token.name] + 1;
  },
  
  'attribute': function (data, token) {
    if (data.counters.attribute > 1)
      zenNodes.error('Too many attributes defined: only one [] is needed');
  },
  
  'attributeEnd': function (data, token) {
    data.attributes = {};
  },
  
  'attributeName': function (data, token) {
    if (!(token.value in data.attributes))
      data.attributes[token.value] = true;
    else
      zenNodes.error('Attribute name already defined: ' + token.value);
  },
  
  'descendant': function (data, token) {
    data.counters = {};
  },
  
  'id': function (data, token) {
    if (data.counters.id > 1)
      zenNodes.error('Too many IDs defined: a tag can only have one ID');
  },
  
  'sibling': function (data, token) {
    data.counters = {};
  },
  
  'text': function (data, token) {
    if (data.counters.text > 1)
      zenNodes.error('Too many text defined: a tag can only have one text node');
  }
};

///////////////////////////////////////////////////////////////////////
// Defines how to parse each token. Entities are ignored if a 
// definition is not defined.

zenNodes.parser = {
  'attribute': function (state, token) {
    if (!state.current)
      state.current = zenNodes.func.lastParent(state.parent).appendChild(document.createElement('div'));
  },
  
  'attributeName': function (state, token) {
    if (!state.current.hasAttribute(token.value))
      state.current.setAttribute(token.value, '');
  },
  
  'attributeValue': function (state, token, tokenIndex) {
    state.current.setAttribute(zenNodes.func.lastToken(state.tokens, tokenIndex).value, token.value);
  },
  
  'class': function (state, token) {
    if (!state.current)
      state.current = zenNodes.func.lastParent(state.parent).appendChild(document.createElement('div'));
    
    state.current.className += (state.current.className ? ' ' : '') + token.value;
  },
  
  'descendant': function (state, token) {
    state.parent.push(state.current);
    state.current = null;
  },
  
  'groupContents': function (state, token) {
    zenNodes.func.lastParent(state.parent).appendChild(zenNodes(token.value));
  },
  
  'id': function (state, token) {
    if (!state.current)
      state.current = zenNodes.func.lastParent(state.parent).appendChild(document.createElement('div'));
    
    state.current.id = token.value;
  },
  
  'multiplier': function (state, token, tokenIndex) {
    for (var current = null, node = state.current, i = 0, size = token.value - 1; i < size; i++) {
      current = zenNodes.func.lastParent(state.parent).appendChild(node.cloneNode(true));
      if (current.className.indexOf('$') > -1)
        zenNodes.parser['multiplier'].replace(current, i);
    }
    
    if (state.current.className.indexOf('$') > -1)
      zenNodes.parser['multiplier'].replace(state.current, -1);
    state.multiplier = true;
  },
  
  'placeholder': function (state, token) {
    for (var parent = zenNodes.func.lastParent(state.parent), i = 0, size = parent.childNodes.length; i < size; i++)
      parent.childNodes[i].className += token.value;
  },
  
  'tag': function (state, token) {
    if (state.multiplier) {
      for (var parent = zenNodes.func.lastParent(state.parent, 2), i = 0, size = parent.childNodes.length; i < size; i++)
        parent.childNodes[i].appendChild(document.createElement(token.value));
    }
    
    else
      state.current = zenNodes.func.lastParent(state.parent).appendChild(document.createElement(token.value));
  },
  
  'text': function (state, token) {
    if (!state.current)
      state.current = zenNodes.func.lastParent(state.parent).appendChild(document.createElement('div'));
  },
  
  'textContents': function (state, token) {
    state.current.innerHTML = token.value;
  }
};

zenNodes.parser['multiplier'].replace = function (node, i) {
  node.className = node.className.replace(/(\$+)/, function (match) {
    return zenNodes.func.padding(i + 2, match.length, '0');
  });
}

///////////////////////////////////////////////////////////////////////
// Utility functions

zenNodes.func.blocks = function (input, def) {
  var counter = 1,
    i = input.charAt(0) == def.start ? 1 : 0,
    size = input.length;
  
  if (zenNodes.func.count(input, def.start) > zenNodes.func.count(input, def.end))
    zenNodes.error('unterminated block: expecing ' + def.end);
  
  for (; i < size; i++) {
    if (input.charAt(i) == def.start)
      counter++;
    else if (input.charAt(i) == def.end)
      counter--;
    if (!counter)
      return i;
  }
  
  zenNodes.error('unterminated block: expecting ' + def.end);
};

zenNodes.func.count = function (input, character) {
  return input.split(character).length - 1;
};

zenNodes.func.fragment = function () {
  return document.createDocumentFragment();
};

zenNodes.func.inList = function (list, value) {
  for (var i = 0, size = list.length; i < size; i++)
    if (list[i] == value)
      return true;
  return false;
};

zenNodes.func.lastParent = function (parents, num) {
  return parents[parents.length - (num || 1)];
};

zenNodes.func.lastToken = function (tokens, tokenIndex, name) {
  if (name !== undefined)
    for (var i = tokenIndex, size = 0; i >= size; i--)
      if (tokens[i].name == name)
        return tokens[i];
  return tokens[(tokenIndex || tokens.length) - 1];
};

zenNodes.func.padding = function (str, length, character) {
  str = '' + str;
  if (str.length < length)
    return (new Array((length - str.length) + 1).join(character)) + str;
  return str;
};

///////////////////////////////////////////////////////////////////////

zenNodes.init = function () {
  zenNodes.init.transition();
};

zenNodes.init.transition = function () {
  var sets = {},
    name = '',
    item = null,
    i = 0,
    isSet = function (name) {
      return name.charAt(0) == '$' && name != '$start';
    };
  
  for (name in zenNodes.grammars)
    if (isSet(name)) {
      sets[name] = zenNodes.grammars[name];
      delete zenNodes.grammars[name];
    }
  
  for (name in zenNodes.grammars) {
    item = zenNodes.grammars[name];
    i = 0;
    while (i < item.length) {
      if (isSet(item[i])) {
        if (item[i] in sets) {
          Array.prototype.push.apply(item, sets[item[i]]);
          item.splice(i, 1);
        }
        else if (item[i] != '$end')
          zenNodes.error('Transition set not defined: ' + item[i]);
      }
      i++;
    }
  }
};

///////////////////////////////////////////////////////////////////////

zenNodes.obj.Token = function (name, type, value) {
  this.name = name;
  this.type = type;
  this.value = value;
  
  switch (this.type) {
    case zenNodes.tokenTypes.NUMBER: this.value = parseFloat(value); break;
    //case zenNodes.tokenTypes.STRING: break;
    case zenNodes.tokenTypes.TEXT  : this.value = value.replace(/\\(.)/g, '$1'); break;
  };
};

///////////////////////////////////////////////////////////////////////

zenNodes.init();
window['zenNodes'] = function (input, parent) { return zenNodes(input, parent); };

})(this);