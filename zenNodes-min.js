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
(function(g,h){function b(a,d){var c=b.t(a);c.input.length&&b.error("Syntax error: expecting "+b.d[c.g].join(", ")+" token after "+(c.c.length?b.a.n(c.c).name:"$start"));b.a.B(b.d[c.g])||b.error("Syntax error: unterminated "+c.g+" expecting "+b.d[c.g].join(", ")+" token");delete c.input;delete c.g;b.parse(c,d);return c.root}b.t=function(a){var a={input:a,g:"$start",c:[]},d="",c="";do if(d=b.z(a.input,a.g))c=b.A(a.input,d),a.c.push(new b.p.s(d,b.c[d].type,c[b.c[d].value])),a.input=a.input.substr(c[0].length),
a.g=d;while(a.input.length&&d);return a};b.error=function(a){throw"zenNodes: "+a;};b.parse=function(a,d){a.b=null;a.data={};a.o=false;a.parent=[];a.root=d||b.a.w();a.parent.push(a.root);var c=null,e=0,f=a.c.length;for(b.rules.r(a.data);e<f;e++){c=a.c[e];if(c.name in b.h)b.h[c.name](a,c,e);b.rules.q(a.data,c);if(c.name in b.rules)b.rules[c.name](a.data,c)}};b.z=function(a,d){for(var c=b.d,e=0,f=c[d].length;e<f;e++)if(c[d][e]!="$end"&&b.c[c[d][e]].pattern.test(a))return c[d][e]};b.A=function(a,d){if("block"in
b.c[d]){var c=a.substr(0,b.a.v(a,b.c[d].u));return[c,c]}return b.c[d].pattern.exec(a)};b.a={};b.i={};b.p={};b.j={k:1,D:2,l:3};b.c={attribute:{value:1,pattern:/^(\[)/},attributeEnd:{value:1,pattern:/^(])/},attributeName:{value:1,pattern:/^([a-zA-Z_:][\w:.-]+)/},attributeSeparator:{value:1,pattern:/^( )/},attributeValue:{value:2,pattern:/^=('|")?([^\1]+?)\1/},autocomplete:{value:1,pattern:/^(\+)$/},"class":{value:1,pattern:/^\.([\w-_]+)/},descendant:{value:1,pattern:/^(>)/},group:{value:1,pattern:/^(\()/},
groupContents:{value:1,pattern:/^([^)]+)/,type:b.j.l,u:{start:"(",end:")"}},groupEnd:{value:1,pattern:/^(\))/},id:{value:1,pattern:/^#([\w-_]+)/},multiplier:{value:1,pattern:/^\*([\d]+)/,type:b.j.k},placeholder:{value:1,pattern:/^(\$+)/},sibling:{value:1,pattern:/^(\+)/},tag:{value:1,pattern:/^([a-z]+)/},text:{value:1,pattern:/^({)/},textContents:{value:1,pattern:/^(.*?(?:[^\\])(?![^}]+))/},textEnd:{value:1,pattern:/^(})/}};b.d={$start:["attribute","class","id","tag","text"],$afterTag:"attribute,class,descendant,id,multiplier,sibling,text".split(","),
attribute:["attributeName"],attributeEnd:["$end","$afterTag"],attributeName:["attributeEnd","attributeValue"],attributeSeparator:["attributeName"],attributeValue:["attributeEnd","attributeSeparator"],autocomplete:["$end"],"class":["$end","$afterTag","placeholder"],descendant:["$afterTag","group","tag"],group:["groupContents"],groupContents:["groupEnd"],groupEnd:["$end","sibling"],id:["$end","$afterTag","placeholder"],multiplier:["$end","descendant","sibling"],placeholder:["multiplier"],sibling:["$afterTag",
"group","tag"],tag:["$end","$afterTag","autocomplete"],text:["textContents"],textContents:["textEnd"],textEnd:["$end","$afterTag"]};b.rules={r:function(a){if(!("attributes"in a))a.attributes={};if(!("counters"in a))a.f={}},q:function(a,b){a.f[b.name]=!(b.name in a.f)?1:a.f[b.name]+1},attribute:function(a){a.f.F>1&&b.error("Too many attributes defined: only one [] is needed")},attributeEnd:function(a){a.attributes={}},attributeName:function(a,d){d.value in a.attributes?b.error("Attribute name already defined: "+
d.value):a.attributes[d.value]=true},descendant:function(a){a.f={}},id:function(a){a.f.id>1&&b.error("Too many IDs defined: a tag can only have one ID")},sibling:function(a){a.f={}},text:function(a){a.f.text>1&&b.error("Too many text defined: a tag can only have one text node")}};b.h={attribute:function(a){if(!a.b)a.b=b.a.e(a.parent).appendChild(document.createElement("div"))},attributeName:function(a,b){a.b.hasAttribute(b.value)||a.b.setAttribute(b.value,"")},attributeValue:function(a,d,c){a.b.setAttribute(b.a.n(a.c,
c).value,d.value)},"class":function(a,d){if(!a.b)a.b=b.a.e(a.parent).appendChild(document.createElement("div"));a.b.className+=(a.b.className?" ":"")+d.value},descendant:function(a){a.parent.push(a.b);a.b=null},groupContents:function(a,d){b.a.e(a.parent).appendChild(b(d.value))},id:function(a,d){if(!a.b)a.b=b.a.e(a.parent).appendChild(document.createElement("div"));a.b.id=d.value},multiplier:function(a,d){for(var c=null,e=a.b,f=0,g=d.value-1;f<g;f++)c=b.a.e(a.parent).appendChild(e.cloneNode(true)),
c.className.indexOf("$")>-1&&b.h.multiplier.replace(c,f);a.b.className.indexOf("$")>-1&&b.h.multiplier.replace(a.b,-1);a.o=true},placeholder:function(a,d){for(var c=b.a.e(a.parent),e=0,f=c.childNodes.length;e<f;e++)c.childNodes[e].className+=d.value},tag:function(a,d){if(a.o)for(var c=b.a.e(a.parent,2),e=0,f=c.childNodes.length;e<f;e++)c.childNodes[e].appendChild(document.createElement(d.value));else a.b=b.a.e(a.parent).appendChild(document.createElement(d.value))},text:function(a){if(!a.b)a.b=b.a.e(a.parent).appendChild(document.createElement("div"))},
textContents:function(a,b){a.b.innerHTML=b.value}};b.h.multiplier.replace=function(a,d){a.className=a.className.replace(/(\$+)/,function(a){return b.a.padding(d+2,a.length,"0")})};b.a.v=function(a,d){var c=1,e=a.charAt(0)==d.start?1:0,f=a.length;for(b.a.m(a,d.start)>b.a.m(a,d.end)&&b.error("unterminated block: expecing "+d.end);e<f;e++)if(a.charAt(e)==d.start?c++:a.charAt(e)==d.end&&c--,!c)return e;b.error("unterminated block: expecting "+d.end)};b.a.m=function(a,b){return a.split(b).length-1};b.a.w=
function(){return document.createDocumentFragment()};b.a.B=function(a){for(var b=0,c=a.length;b<c;b++)if(a[b]=="$end")return true;return false};b.a.e=function(a,b){return a[a.length-(b||1)]};b.a.n=function(a,b){if(void 0!==h)for(var c=b;c>=0;c--)if(a[c].name==void 0)return a[c];return a[(b||a.length)-1]};b.a.padding=function(a,b,c){a=""+a;return a.length<b?Array(b-a.length+1).join(c)+a:a};b.i=function(){b.i.C()};b.i.C=function(){var a={},d="",c=null,e=0;for(d in b.d)d.charAt(0)=="$"&&d!="$start"&&
(a[d]=b.d[d],delete b.d[d]);for(d in b.d){c=b.d[d];for(e=0;e<c.length;)c[e].charAt(0)=="$"&&c[e]!="$start"&&(c[e]in a?(Array.prototype.push.apply(c,a[c[e]]),c.splice(e,1)):c[e]!="$end"&&b.error("Transition set not defined: "+c[e])),e++}};b.p.s=function(a,d,c){this.name=a;this.type=d;this.value=c;switch(this.type){case b.j.k:this.value=parseFloat(c);break;case b.j.l:this.value=c.replace(/\\(.)/g,"$1")}};b.i();g.zenNodes=function(a,d){return b(a,d)}})(this);