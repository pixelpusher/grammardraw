import nearley  from "nearley";
import { isArray } from "tone";
import grammar from "../grammar.js";

/**
 * 
 * @param {string} sequence The string representation of the sequence to turn into a an array of functions 
 * @returns {Array} Keys mapping to drawing functions: each entry is an object:
 * { 
 *      type:"function",
 *      name: "name", // Any char or string like 'D','T', etc.
 *      arg: args     // a number, object, string to be evaluated as JavaScript and passed to the function
 *  }
 * @throws {SyntaxError} on parse issue
 */
export function parseSequenceToMap(sequence) {

    let functionSequenceMap = [];

    //
    // parse ant sequence into a list of functions
    //
    const parser = new nearley.Parser(nearley.Grammar.fromCompiled(grammar));

    //console.info(`Feed ${sequence}`)

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
        console.error("Parser error:");
        console.error(parseError);
        throw new SyntaxError(`Parser error at character ${parseError.offset} (${sequence[parseError.offset]})`, 'sequences.js', 55);
    }            
    // render 10,000 hexes
    // HexGrid.rectangle({ width: dims[0], height: dims[1] }).forEach(hex => {
    //     const { x, y } = hex.toPoint()
    //     // use hexSymbol and set its position for each hex
    //     drawing.use(hexSymbol).translate(x, y)
    // });

    return functionSequenceMap;
}


export function createHilbertSequence()
{
    const sequence = "A";
    return sequence;
}

export function hilbertReplacements(sideLength) {
    const AMap = `S:0.25|T:-90|B|D:${sideLength}|T:90|A|D:${sideLength}|A|T:90|D:${sideLength}|B|T:-90|S:4|`;
    const BMap = `S:0.25|T:90|A|D:${sideLength}|T:-90|B|D:${sideLength}|B|T:-90|D:${sideLength}|A|T:90|S:4|`;
    return [
        {name: 'A', sequence:parseSequenceToMap(AMap) },
        {name: 'B', sequence:parseSequenceToMap(BMap) }
    ];
}


/**
 * Create the 'E' sequence string
 * @returns {String} sequence as string
 */
export function createESequence({
    bends=4, 
    blocksPerRow=4, /* must be even! */
    rows=1,
    majLength=96, 
    minLength=48,
    dir=-1,
    startAngle=90
    }={})  
{
    const blocks = blocksPerRow*rows;
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
                sequence += `C:c1|D:${ll}|T:${dir*angle}|D:${ml}|T:${dir*angle}|`;            
            }
        }
        if (evenBlock) 
        {
            sequence += `C:c2|D:${ll}|D2:${minLength}|T:${dir*angle}|`;
        }
        else 
        {
            //sequence += `C:c3|D:${ll}|T:${-dir*angle}|D2:${minLength}|`;
        }
        if (block > 0 && (block % blocksPerRow === (blocksPerRow-1))) {
            dir = -dir;
            // sequence += `C:c4|T:${dir*angle}|D2:${ll}|D2:${ml}|T:${dir*angle}|`;
            sequence += `C:c4|T:${dir*angle}|T:${dir*angle}|D2:${ml}|T:${dir*angle}|`;
        }
    }

    //console.log(`Created ant: ${sequence}`);

    return sequence;
}


/**
 * Replace a function type (e.g. 'D') in the function map with a new sequence.
 * For iterating L-Systems through replacement
 * @param {Array} functionNames Array of function names to replace e.g. [{name:'D', sequence:function array}] 
 * @param {Array} functionArray Array of functions to replace in    
 */
export function replaceFunctionsInMap(replacements, functionArray) {

//    functionNames, functionArray, replacementArray

    // each function returned is an object:
    // { 
    //  type:"function",
    //  name: "name", // D,T, etc.
    //  arg: args     // number, object, string
    // }
    

    let i=-1;

    while (++i < functionArray.length) {

        const currentFunc = functionArray[i];
        //console.log(`currentFunc.name: ${currentFunc.name}`);
        for (const rep of replacements)
        {
            if (rep.name == currentFunc.name) {
                //console.info(`Matched: ${currentFunc.name}`);
                //console.log(`match index: ${i} :: replacement length: ${replacementArray.length}`);
                
                const array1 = functionArray.slice(0,i);
                //console.log(array1);
                const array2 = functionArray.slice(i+1);
                //console.log(array2);            
                functionArray = array1.concat(rep.sequence).concat(array2);

                i += rep.sequence.length - 1; // update to length minus this replaced func 
                //console.log(`i now ${i}`);
            }
        }
        
    }

    return functionArray;
}


/**
 * Testing function
 */
export function testSequences() {
    //const baseSequence = createESequence({bends:2});
    const baseSequence = "D:2|D2:3|t:3|D:1";
    let funcMap = parseSequenceToMap(baseSequence);

    const replaceSequence = "E:1|F:4|D:8";
    const replaceMap = parseSequenceToMap(replaceSequence);

    // replace D (draw) with subsequence
    console.info(`base sequence:`);
    console.info(baseSequence);
    console.info(`base function map:`);
    console.info(funcMap);
    console.info(`replacement function map:`);
    console.info(replaceMap);

    funcMap = replaceFunctionsInMap([{name:'D', sequence:replaceMap}], funcMap);
    console.log(`Function map now:`);
    console.info(funcMap);
}
