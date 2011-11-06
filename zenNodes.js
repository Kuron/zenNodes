/**
 * zenNodes v0.1.0
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
  var state = {
      backreferences: [],
      current: parent,
      data: {},
      input: input,
      multiplier: false,
      parent: [],
      previous: '$start',
      root: parent,
      tokens: []
    },
    lastTokenEntity = '';
  
  zenNodes.analyze(state);
  lastTokenEntity = state.tokens.length ? state.tokens[state.tokens.length - 1].entity : '$start';
  
  if (state.input.length)
    zenNodes.error('Syntax error: expecting ' + zenNodes.transition[state.previous].join(', ') + ' entity after ' + lastTokenEntity);
  
  for (var found = false, item = zenNodes.transition[state.previous], i = 0, size = item.length; i < size; i++)
    if (item[i] == '$end')
      found = true;
  if (!found)
    zenNodes.error('Syntax error: unterminated ' + state.previous + ' expecting ' + zenNodes.transition[state.previous].join(', ') + ' entity');
  
  zenNodes.parse(state);
  return state.root;
};

zenNodes.analyze = function (state) {
  var entities = zenNodes.entities,
    entity = '',
    result = '',
    token = null;
  
  do {
    entity = zenNodes.search(state);
    if (entity) {
      result = zenNodes.value(state, entity);
      token = new zenNodes.obj.Token(entity, result[entities[entity].value]);
      
      state.tokens.push(token);
      if (entity == 'groupContents')
        state.backreferences.push(token);
      
      zenNodes.reduce(state, result[0].length);
      state.previous = entity;
    }
  } while (state.input.length && entity && entity != '$end');
};

zenNodes.error = function (msg) {
  throw 'zenNodes: ' + msg;
};

zenNodes.parse = function (state) {
  state.root = state.current = state.current || zenNodes.func.fragment();
  
  var tokens = state.tokens,
    token = null,
    i = 0,
    size = state.tokens.length
  
  zenNodes.rules.$init(state.data);
  
  for (; i < size; i++) {
    token = tokens[i];
    if (token.entity in zenNodes.parser)
      zenNodes.parser[token.entity](state, token, i);
    zenNodes.rules.$common(state.data, token);
    if (token.entity in zenNodes.rules)
      zenNodes.rules[token.entity](state.data, token);
  }
};

zenNodes.reduce = function (state, length) {
  state.input = state.input.substr(length);
};

zenNodes.search = function (state) {
  var entities = zenNodes.entities,
    transition = zenNodes.transition,
    previous = state.previous,
    i = 0,
    size = transition[state.previous].length;
  for (; i < size; i++)
    if (transition[previous][i] != '$end' && entities[transition[previous][i]].pattern.test(state.input))
      return transition[previous][i];
};

zenNodes.value = function (state, entity) {
  if ('block' in zenNodes.entities[entity]) {
    var result = state.input.substr(0, zenNodes.func.blocks(state.input, zenNodes.entities[entity].block));
    return [result, result];
  }
  return zenNodes.entities[entity].pattern.exec(state.input);
};

zenNodes.func = {};
zenNodes.init = {};
zenNodes.obj = {};

///////////////////////////////////////////////////////////////////////
// Defines entities. Value is the index for RegExp.exec.

zenNodes.entities = {
  attribute         : { value: 1, pattern: /^(\[)/ },
  attributeEnd      : { value: 1, pattern: /^(])/ },
  attributeName     : { value: 1, pattern: /^([a-zA-Z_:][\w:.-]+)/ },
  attributeSeparator: { value: 1, pattern: /^( )/ },
  attributeValue    : { value: 2, pattern: /^=('|")?([^\1]+?)\1/ },
  autocomplete      : { value: 1, pattern: /^(\+)$/ },
  backreference     : { value: 1, pattern: /^\\([\d])/ },
  'class'           : { value: 1, pattern: /^\.([\w-]+)/ },
  descendant        : { value: 1, pattern: /^(>)/ },
  group             : { value: 1, pattern: /^(\()/ },
  groupContents     : { value: 1, pattern: /^([^)]+)/, block: { start: '(', end: ')' } },
  groupEnd          : { value: 1, pattern: /^(\))/ },
  id                : { value: 1, pattern: /^#([\w]+)/ },
  multiplier        : { value: 1, pattern: /^\*([\d]+)/ },
  placeholder       : { value: 1, pattern: /^(\$+)/ },
  sibling           : { value: 1, pattern: /^(\+)/ },
  tag               : { value: 1, pattern: /^([a-z]+)/ },
  text              : { value: 1, pattern: /^({)/ },
  textContents      : { value: 1, pattern: /^(.*?(?:[^\\])(?![^}]+))/ },
  textEnd           : { value: 1, pattern: /^(})/ }
};

///////////////////////////////////////////////////////////////////////
// Defines valid transition states from one entity to another. Special 
// transition states are $start and $end. $start marks the beginning 
// while $end marks a state can be terminated. A set is prefixed with 
// $ that can be included into transition states. 

zenNodes.transition = {
  $start            : ['attribute', 'class', 'id', 'tag', 'text'],
  $afterTag         : ['attribute', 'class', 'descendant', 'id', 'multiplier', 'sibling', 'text'],
  attribute         : ['attributeName'],
  attributeEnd      : ['$end', '$afterTag'],
  attributeName     : ['attributeEnd', 'attributeValue'],
  attributeSeparator: ['attributeName'],
  attributeValue    : ['attributeEnd', 'attributeSeparator'],
  autocomplete      : ['$end'],
  backreference     : ['$end', 'sibling'],
  'class'           : ['$end', '$afterTag', 'placeholder'],
  descendant        : ['$afterTag', 'backreference', 'group', 'tag'],
  group             : ['groupContents'],
  groupContents     : ['groupEnd'],
  groupEnd          : ['$end', 'sibling'],
  id                : ['$end', '$afterTag', 'placeholder'],
  multiplier        : ['$end', 'descendant', 'sibling'],
  placeholder       : ['multiplier'],
  sibling           : ['$afterTag', 'backreference', 'group', 'tag'],
  tag               : ['$end', '$afterTag', 'autocomplete'],
  text              : ['textContents'],
  textContents      : ['textEnd'],
  textEnd           : ['$end', '$afterTag']
};

///////////////////////////////////////////////////////////////////////
// Defines rules for entities to follow. Rules are checked after each  
// entity is parsed. Entities that does not have any rules do not need 
// to be defined. $init is a special name that is called once before 
// entities gets parsed while $common gets called every time an entity 
// is parsed. $common gets called first before the entity rule.

zenNodes.rules = {
  $init: function (data) {
    if (!('attributes' in data))
      data.attributes = {};
    if (!('counters' in data))
      data.counters = {};
  },
  
  $common: function (data, token) {
    data.counters[token.entity] = !(token.entity in data.counters) ? 1 : data.counters[token.entity] + 1;
  },
  
  attribute: function (data, token) {
    if (data.counters.attribute > 1)
      zenNodes.error('Too many attributes defined: only one [] is needed');
  },
  
  attributeEnd: function (data, token) {
    data.attributes = {};
  },
  
  attributeName: function (data, token) {
    if (!(token.value in data.attributes))
      data.attributes[token.value] = true;
    else
      zenNodes.error('Attribute name already defined: ' + token.value);
  },
  
  descendant: function (data, token) {
    data.counters = {};
  },
  
  id: function (data, token) {
    if (data.counters.id > 1)
      zenNodes.error('Too many IDs defined: a tag can only have one ID');
  },
  
  sibling: function (data, token) {
    data.counters = {};
  },
  
  text: function (data, token) {
    if (data.counters.text > 1)
      zenNodes.error('Too many text defined: a tag can only have one text node');
  }
};

///////////////////////////////////////////////////////////////////////
// Defines how to parse each entity. Entities are ignored if a 
// definition is not defined.

zenNodes.parser = {
  attributeName: function (state, token) {
    if (!state.current.hasAttribute(token.value))
      state.current.setAttribute(token.value, '');
  },
  
  attributeValue: function (state, token, tokenIndex) {
    state.current.setAttribute(zenNodes.func.lastToken(state.tokens, tokenIndex).value, token.value);
  },
  
  backreference: function (state, token) {
    state.parent.push(state.current);
    state.current = state.current.appendChild(zenNodes(state.backreferences[token.value].value));
  },
  
  'class': function (state, token) {
    state.current.className += (state.current.className ? ' ' : '') + token.value;
  },
  
  groupContents: function (state, token) {
    state.parent.push(state.current);
    state.current = state.current.appendChild(zenNodes(token.value));
  },
  
  id: function (state, token) {
    state.current.id = token.value;
  },
  
  multiplier: function (state, token, tokenIndex) {
    for (var current = null, node = state.current, i = 0, size = token.value - 1; i < size; i++) {
      current = state.parent[state.parent.length - 1].appendChild(node.cloneNode(true));
      zenNodes.parser.multiplier.replace(current, i);
    }
    
    zenNodes.parser.multiplier.replace(state.current, -1);
    state.multiplier = true;
  },
  
  placeholder: function (state, token) {
    for (var i = 0, size = state.parent[state.parent.length - 1].childNodes.length; i < size; i++)
      state.parent[state.parent.length - 1].childNodes[i].className += token.value;
  },
  
  sibling: function (state, token) {
    state.current = state.parent.pop();
  },
  
  tag: function (state, token) {
    if (state.multiplier) {
      for (var parent = state.parent, i = 0, size = parent[parent.length - 1].childNodes.length; i < size; i++)
        parent[parent.length - 1].childNodes[i].appendChild(document.createElement(token.value));
    }
    
    else {
      state.parent[state.parent.length] = state.current;
      state.current = state.current.appendChild(document.createElement(token.value));
    }
  },
  
  textContents: function (state, token) {
    state.current.innerHTML = token.value;
  }
};

zenNodes.parser.multiplier.replace = function (node, i) {
  node.className = node.className.replace(/(\$+)/, function (match) {
    return zenNodes.func.pad(i + 2, match.length, '0');
  });
}

///////////////////////////////////////////////////////////////////////

zenNodes.func.blocks = function (input, def) {
  var counter = 1,
    i = 0,
    size = input.length;
  
  if (zenNodes.func.count(input, def.start) > zenNodes.func.count(input, def.end))
    zenNodes.error('unterminated block: expecing ' + def.end);
  
  for (; i < size; i++) {
    if (input.charAt(i) == def.start)
      counter++;
    else if (input.charAt(i) == def.end)
      counter--;
    else if (!counter)
      return i - 1;
  }
  
  zenNodes.error('unterminated block: expecting ' + def.end);
};

zenNodes.func.count = function (input, character) {
  return input.split(character).length - 1;
};

zenNodes.func.fragment = function () {
  return document.createDocumentFragment();
};

zenNodes.func.lastToken = function (tokens, tokenIndex, entity) {
  if (entity === undefined)
    return tokens[tokenIndex - 1];
  
  for (var i = tokenIndex, size = 0; i >= size; i--)
    if (tokens[i].entity == entity)
      return tokens[i];
};

zenNodes.func.pad = function (str, amount, character) {
  str = '' + str;
  if (str.length < amount)
    return (new Array(amount).join(character)) + str;
};

///////////////////////////////////////////////////////////////////////

zenNodes.init = function () {
  var transition = zenNodes.init,
    sets = transition.getSets();
  
  transition.delSets();
  transition.extendStates(sets);
};

zenNodes.init.delSets = function () {
  var transition = zenNodes.init,
    transitionList = zenNodes.transition,
    name = '';
  for (name in transitionList)
    if (transition.isSet(name))
      delete transitionList[name];
};

zenNodes.init.extendState = function (item, itemIndex, sets) {
  for (var i = 0, size = sets[item[itemIndex]].length; i < size; i++)
    item.push(sets[item[itemIndex]][i]);
  item.splice(itemIndex, 1);
};

zenNodes.init.extendStates = function (sets) {
  var transition = zenNodes.init,
    transitionList = zenNodes.transition,
    name = '',
    item = null,
    i = 0;
  for (name in transitionList) {
    item = transitionList[name];
    i = 0;
    while (i < item.length) {
      if (transition.isSet(item[i])) {
        if (item[i] in sets)
          transition.extendState(item, i, sets);
        else if (item[i] != '$end')
          zenNodes.error('Transition set not defined: ' + item[i]);
      }
      i++;
    }
  }
};

zenNodes.init.getSets = function () {
  var transition = zenNodes.init,
    transitionList = zenNodes.transition,
    transitionSets = {},
    name = '';
  for (name in transitionList)
    if (transition.isSet(name))
      transitionSets[name] = transitionList[name];
  return transitionSets;
};

zenNodes.init.isSet = function (name) {
  return name.charAt(0) == '$' && name != '$start';
};

///////////////////////////////////////////////////////////////////////

zenNodes.obj.Token = function (entity, value) {
  this.entity = entity;
  this.value = /^[\d.]+$/.test(value) ? parseFloat(value) : value;
  
  if (this.value.indexOf && this.value.indexOf('\\') > -1)
    this.value = value.replace(/\\(.)/g, '$1');
};

///////////////////////////////////////////////////////////////////////

zenNodes.init();
window.zenNodes = function (input, parent) { return zenNodes(input, parent); };
})(this);