// Generated automatically by nearley, version undefined
// http://github.com/Hardmath123/nearley
(function () {
function id(x) { return x[0]; }
var grammar = {
    Lexer: undefined,
    ParserRules: [
    {"name": "Chain", "symbols": ["BasicStatement", "Space", "PIPE", "Space", "Chain"], "postprocess": d => [d[0]].concat(d[4])},
    {"name": "Chain$ebnf$1", "symbols": ["PIPE"], "postprocess": id},
    {"name": "Chain$ebnf$1", "symbols": [], "postprocess": function(d) {return null;}},
    {"name": "Chain", "symbols": ["BasicStatement", "Space", "Chain$ebnf$1"], "postprocess": d => d[0]},
    {"name": "BasicStatement$ebnf$1", "symbols": [{"literal":":","pos":39}], "postprocess": id},
    {"name": "BasicStatement$ebnf$1", "symbols": [], "postprocess": function(d) {return null;}},
    {"name": "BasicStatement$ebnf$2", "symbols": ["AnyVar"], "postprocess": id},
    {"name": "BasicStatement$ebnf$2", "symbols": [], "postprocess": function(d) {return null;}},
    {"name": "BasicStatement", "symbols": ["PlainVariable", "Space", "BasicStatement$ebnf$1", "Space", "BasicStatement$ebnf$2"], "postprocess":  function ([pv, sp1, colon, sp2, var1]) { return {
        	type:"function",
        	name: pv,
        	arg: var1
        };																		 
        																								 }
        },
    {"name": "AnyVar", "symbols": ["Number"], "postprocess": id},
    {"name": "AnyVar", "symbols": ["PlainVariable"], "postprocess": id},
    {"name": "AnyVar", "symbols": ["ObjectVariable"], "postprocess": id},
    {"name": "AnyVar", "symbols": ["StringLiteral"], "postprocess": id},
    {"name": "ObjectVariable", "symbols": ["PlainVariable", "DOT", "PlainVariable"], "postprocess": ([pv1, dot, pv2])=> pv1 + dot + pv2},
    {"name": "PlainVariable$ebnf$1", "symbols": []},
    {"name": "PlainVariable$ebnf$1", "symbols": ["AnyValidCharacter", "PlainVariable$ebnf$1"], "postprocess": function arrconcat(d) {return [d[0]].concat(d[1]);}},
    {"name": "PlainVariable", "symbols": ["CharOrLetter", "PlainVariable$ebnf$1"], "postprocess": ([ff,ss])=> ff + ss.join('')},
    {"name": "StringLiteral$ebnf$1$subexpression$1", "symbols": ["AnyValidCharacter"]},
    {"name": "StringLiteral$ebnf$1$subexpression$1", "symbols": ["DOT"]},
    {"name": "StringLiteral$ebnf$1$subexpression$1", "symbols": [/[()\s]/]},
    {"name": "StringLiteral$ebnf$1", "symbols": ["StringLiteral$ebnf$1$subexpression$1"], "postprocess": id},
    {"name": "StringLiteral$ebnf$1", "symbols": [], "postprocess": function(d) {return null;}},
    {"name": "StringLiteral", "symbols": ["QUOTE", "StringLiteral$ebnf$1", "QUOTE"], "postprocess": ([lquote, statement, rquote]) => lquote + (statement ? statement.join("") : "") + rquote},
    {"name": "Number", "symbols": ["Integer"], "postprocess": id},
    {"name": "Number", "symbols": ["Float"], "postprocess": id},
    {"name": "Float$subexpression$1", "symbols": ["Zero"]},
    {"name": "Float$subexpression$1", "symbols": ["Integer"]},
    {"name": "Float$ebnf$1", "symbols": [/[0-9]/]},
    {"name": "Float$ebnf$1", "symbols": [/[0-9]/, "Float$ebnf$1"], "postprocess": function arrconcat(d) {return [d[0]].concat(d[1]);}},
    {"name": "Float", "symbols": ["Float$subexpression$1", {"literal":".","pos":156}, "Float$ebnf$1"], "postprocess": ([num1, dot, num2]) => num1 + dot + num2.join('')},
    {"name": "Integer", "symbols": ["Zero"]},
    {"name": "Integer$ebnf$1", "symbols": [{"literal":"-","pos":171}], "postprocess": id},
    {"name": "Integer$ebnf$1", "symbols": [], "postprocess": function(d) {return null;}},
    {"name": "Integer$ebnf$2", "symbols": []},
    {"name": "Integer$ebnf$2", "symbols": ["Digit", "Integer$ebnf$2"], "postprocess": function arrconcat(d) {return [d[0]].concat(d[1]);}},
    {"name": "Integer", "symbols": ["Integer$ebnf$1", "NonzeroNumber", "Integer$ebnf$2"], "postprocess": ([sign, num1, num2]) => (sign ? "-" : "") + num1 + num2.join('')},
    {"name": "Zero", "symbols": [{"literal":"0","pos":187}]},
    {"name": "AnyValidCharacter", "symbols": ["Letter"]},
    {"name": "AnyValidCharacter", "symbols": ["UsableCharacter"]},
    {"name": "AnyValidCharacter", "symbols": ["Digit"]},
    {"name": "CharOrLetter", "symbols": ["UsableCharacter"]},
    {"name": "CharOrLetter", "symbols": ["Letter"]},
    {"name": "UsableCharacter", "symbols": [/[\$\£\&\^\*]/]},
    {"name": "Letter", "symbols": [/[a-zA-Z]/]},
    {"name": "Digit", "symbols": [/[0-9]/]},
    {"name": "NonzeroNumber", "symbols": [/[1-9]/]},
    {"name": "ObjectLeftBrace", "symbols": [{"literal":"{","pos":243}]},
    {"name": "ObjectRightBrace", "symbols": [{"literal":"}","pos":249}]},
    {"name": "EOLPIPE", "symbols": ["EOL"]},
    {"name": "EOLPIPE", "symbols": ["PIPE"], "postprocess": function(d) {return null }},
    {"name": "PIPE", "symbols": [{"literal":"|","pos":267}]},
    {"name": "DOT", "symbols": [{"literal":".","pos":273}]},
    {"name": "QUOTE", "symbols": [{"literal":"\"","pos":279}]},
    {"name": "_$ebnf$1", "symbols": []},
    {"name": "_$ebnf$1", "symbols": [/[\s]/, "_$ebnf$1"], "postprocess": function arrconcat(d) {return [d[0]].concat(d[1]);}},
    {"name": "_", "symbols": ["_$ebnf$1"], "postprocess": function(d) {return null }},
    {"name": "__$ebnf$1", "symbols": [/[\s]/]},
    {"name": "__$ebnf$1", "symbols": [/[\s]/, "__$ebnf$1"], "postprocess": function arrconcat(d) {return [d[0]].concat(d[1]);}},
    {"name": "__", "symbols": ["__$ebnf$1"], "postprocess": function(d) {return null }},
    {"name": "EOL", "symbols": [/[\r\n]/], "postprocess": function(d) {return null }},
    {"name": "Space$ebnf$1", "symbols": []},
    {"name": "Space$ebnf$1", "symbols": [/[ ]/, "Space$ebnf$1"], "postprocess": function arrconcat(d) {return [d[0]].concat(d[1]);}},
    {"name": "Space", "symbols": ["Space$ebnf$1"], "postprocess": function(d) {return null }},
    {"name": "Spaces$ebnf$1", "symbols": [/[ ]/]},
    {"name": "Spaces$ebnf$1", "symbols": [/[ ]/, "Spaces$ebnf$1"], "postprocess": function arrconcat(d) {return [d[0]].concat(d[1]);}},
    {"name": "Spaces", "symbols": ["Spaces$ebnf$1"], "postprocess": function(d) {return null }}
]
  , ParserStart: "Chain"
}
if (typeof module !== 'undefined'&& typeof module.exports !== 'undefined') {
   module.exports = grammar;
} else {
   window.grammar = grammar;
}
})();
