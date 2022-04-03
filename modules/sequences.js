import nearley  from "nearley";
import { isArray } from "tone";
import grammar from "../grammar.js";

export function parseSequenceToMap(sequence) {

    let functionSequenceMap = [];

    //
    // parse ant sequence into a list of functions
    //
    const parser = new nearley.Parser(nearley.Grammar.fromCompiled(grammar));

    console.info(`Feed ${sequence}`)

    parser.feed(sequence);

    // returns parser.results array of length 1 if successful
    
    if (parser.results.length !== 1) {
        throw new SyntaxError(`Parser error: ambiguous [${parser.results.length}]`, 'sequences.js', 15);
    }
    
    // each function returned is an object:
    // { 
    //  type:"function",
    //  name: "name", // D,T, etc.
    //  arg: args     // number, object, string
    // }
        
    try {
        if (isArray(parser.results[0]))    
        {
            for (let result of parser.results[0]) {
                functionSequenceMap.push(result);
            }
        }
        else {
            functionSequenceMap.push(parser.results[0]);
        }
    } catch (parseError) {
        console.error(parseError);
            console.error("Error at character " + parseError.offset); // "Error at character 9"
    }            
    // render 10,000 hexes
    // HexGrid.rectangle({ width: dims[0], height: dims[1] }).forEach(hex => {
    //     const { x, y } = hex.toPoint()
    //     // use hexSymbol and set its position for each hex
    //     drawing.use(hexSymbol).translate(x, y)
    // });

    return functionSequenceMap;
}


/**
 * 
 * @returns {String} sequence as string
 */
export function createESequence({
    bends=4, 
    blocksPerRow=4, /* must be even! */
    majLength=96, 
    minLength=48,
    dir=-1,
    startAngle=90
    }={})  
{
    const blocks = blocksPerRow*3;
    let sequence = "";
    let angle = startAngle;

    // sequence: 
    //  D = draw
    //  T = turn
    //  M = move (no draw)

    // algo:

    // for even blocks long length = maj length, for odd long length = 2*minor length

    // for each bend:

    // do 2x:

    //  dir = -dir

    //  go long length
    //  turn 90*dir
    //  go long length
    //  turn 90*dir

    // for even blocks:

    //  go long length
    //  go minor length
    //  turn 90*dir

    // for odd blocks:
    //  go long length
    //  turn 90*-dir
    //  go minor length


    for (let block=0; block < blocks; block++) {

        const evenBlock = (block % 2 === 0);

        const longLength = evenBlock ? majLength : bends*2*minLength;

        let jitter = (Math.round(2*Math.random())/10 + 0.8);

        let ll = evenBlock ? jitter*longLength : longLength;
        let ml = evenBlock ? minLength : jitter*minLength;

        for (let bend=0; bend < bends; bend++)
        {
            for (let i=0; i < 2; i++) {
                dir = -dir;
                sequence += `D:${ll}|T:${dir*angle}|D:${ml}|T:${dir*angle}|`;            
            }
        }
        if (evenBlock) 
        {
            sequence += `D:${ll}|D:${minLength}|T:${dir*angle}|`;
        }
        else 
        {
            sequence += `D:${ll}|T:${-dir*angle}|D:${minLength}|`;
            
        }
        if (block > 0 && (block % blocksPerRow === (blocksPerRow-1))) {
            dir = -dir;
            sequence += `T:${dir*angle}|D:${ll}|D:${ml}|T:${dir*angle}|`;
        }
    }

    //console.log(`Created ant: ${sequence}`);

    return sequence;
}


/**
 * 
 * @returns {String} sequence as string
 */
 export function createEReplaceSequence({
    bends=2, 
    majLength=12, 
    minLength=12,
    dir=1,
    startAngle=90
    }={})  
{
    let sequence = ""; // scale by 1/2
    let angle = startAngle;

    // sequence: 
    //  D = draw
    //  T = turn
    //  M = move (no draw)

    // algo:

    // for even blocks long length = maj length, for odd long length = 2*minor length

    // for each bend:

    // do 2x:

    //  dir = -dir

    //  go long length
    //  turn 90*dir
    //  go long length
    //  turn 90*dir

    sequence += "S:0.25|"

        const longLength = majLength;

        let jitter = (Math.round(2*Math.random())/10 + 0.8);

        let ll = longLength;
        let ml = minLength;

        for (let bend=0; bend < bends; bend++)
        {
            for (let i=0; i < 2; i++) {
                dir = -dir;
                sequence += `D:${ll}|T:${dir*angle}|D:${ml}|T:${dir*angle}|`;            
            }
        
        }

        sequence = sequence + "S:4|"; // scale to original

    return sequence;
}

/**
 * Replace a function type (e.g. 'D') in the function map with a new sequence.
 * For iterating L-Systems through replacement
 * @param {Array} functionNames Array of function names to replace e.g. ['D', 'F'] 
 * @param {Array} replacementArray Replacement array
 */
export function replaceFunctionsInMap(functionNames, functionArray, replacementArray) {
    
    // each function returned is an object:
    // { 
    //  type:"function",
    //  name: "name", // D,T, etc.
    //  arg: args     // number, object, string
    // }
    
    let matcherString = "";
    for (const f of functionNames) {
        matcherString += `^${f}$|`;
    }
    const matcher = new RegExp(matcherString.slice(0,matcherString.length-1), "i"); // cut off end | of string

    let i=-1;

    while (i < functionArray.length-1) {
        i++;
        const currentFunc = functionArray[i];

        if (matcher.test(currentFunc.name)) {
            //console.info(currentFunc.name);
            //console.log(`match: ${i} :: ${replacementArray.length}`);
        //     // swap out thingie
        //     // TODO: slice and join!!!!!
            const array1 = functionArray.slice(0,i);
            const array2 = functionArray.slice(i+1);

            functionArray = array1.concat(replacementArray).concat(array2); 
        //     //functionArray.splice(i,1,replacementArray);
            i += replacementArray.length; // update to 
        }
        
    }

    return functionArray;
}


export function testSequences() {
    const baseSequence = createESequence({bends:2});
    let funcMap = parseSequenceToMap(baseSequence);

    const replaceSequence = createEReplaceSequence();
    const replaceMap = parseSequenceToMap(replaceSequence);

    // replace D (draw) with subsequence
    console.info(`base sequence:`);
    console.info(baseSequence);
    console.info(`base function map:`);
    console.info(funcMap);
    console.info(`replacement function map:`);
    console.info(replaceMap);

    funcMap = replaceFunctionsInMap(['D'], funcMap, replaceMap);
    console.log(`Function map now:`);
    console.info(funcMap);

    

}
