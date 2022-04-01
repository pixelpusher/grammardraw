# Main -> Chain EOL:+ Space Main {% d => [d[0]].concat(d[3]).join(";") %} 
#	| Chain Space EOL:? {% d => d[0] + ';' %}

 Chain -> BasicStatement Space PIPE Space Chain {% d => [d[0]].concat(d[4]) %} 
	| BasicStatement Space PIPE:? {% d => d[0] %}


BasicStatement -> PlainVariable Space ":":? Space AnyVar:? {% function ([pv, sp1, colon, sp2, var1]) { return {
		type:"function",
		name: pv,
		arg: var1
	};																		 
}
%}

# valid variable types for math ops etc
AnyVar -> Number 	{% id %} # int or float
	| PlainVariable {% id %} # named variable
	| ObjectVariable {% id %}# something.something
	| StringLiteral {% id %}
	#| ParenthesisStatement

ObjectVariable -> PlainVariable DOT PlainVariable {% ([pv1, dot, pv2])=> pv1 + dot + pv2 %} 

PlainVariable -> CharOrLetter AnyValidCharacter:* {% ([ff,ss])=> ff + ss.join('') %}

StringLiteral -> QUOTE (AnyValidCharacter | DOT | [()\s]):? QUOTE {% ([lquote, statement, rquote]) => lquote + (statement ? statement.join("") : "") + rquote %}

Number -> Integer 	{% id %}
	| Float 		{% id %}
	
Float -> (Zero | Integer) "." [0-9]:+		{% ([num1, dot, num2]) => num1 + dot + num2.join('') %}

Integer -> Zero |
		"-":? NonzeroNumber Digit:*   {% ([sign, num1, num2]) => (sign ? "-" : "") + num1 + num2.join('') %}
		#{% d => ({ d:d[0] + d[1].join(''), v: parseInt(d[0] + d[1].join('')) }) %}

Zero -> "0"

AnyValidCharacter -> Letter | UsableCharacter | Digit
#Letter {% id %} | Digit {% id %} | UsableCharacters {% id %}

CharOrLetter -> UsableCharacter | Letter

UsableCharacter -> [\$\£\&\^\*]

Letter -> [a-zA-Z]

Digit -> [0-9]

NonzeroNumber -> [1-9]

ObjectLeftBrace -> "{"

ObjectRightBrace -> "}"

EOLPIPE -> EOL | PIPE  {% function(d) {return null } %}

PIPE -> "|"

DOT -> "."

QUOTE -> "\""

# Whitespace. The important thing here is that the postprocessor
# is a null-returning function. This is a memory efficiency trick.
_ -> [\s]:*     {% function(d) {return null } %}

__ -> [\s]:+     {% function(d) {return null } %}

EOL -> [\r\n]	{% function(d) {return null } %}

Space -> [ ]:*	{% function(d) {return null } %}

Spaces -> [ ]:+	{% function(d) {return null } %}