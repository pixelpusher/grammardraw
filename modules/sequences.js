import nearley  from "nearley";
import { isArray } from "tone";
import grammar from "../grammar.js";

/**
 * Counts all occurences of functions in a sequence
 * 
 * @param {Array or string} funcName Names of functions to count, as an array or a single string
 * @param {Array} funcArray Array of functions  
 * @returns {Integer} count of function occurences
 */
export function countAll (funcName, funcArray) {
return funcArray.filter(
        ({name}) => {
            //console.log(name);
            return (Array.isArray(funcName) ? funcName.includes(name) : name === funcName)
        }
    ) 
    .reduce((sum, current) => sum + 1, 0);
}

/**
 * 
 * @param {string} sequence The string representation of the sequence (ending with a '|') to turn into a an array of functions 
 * @returns {Array} Keys mapping to drawing functions: each entry is an object:
 * { 
 *      type:"function",
 *      name: "name", // Any char or string like 'D','T', etc.
 *      arg: args     // a number, object, string to be evaluated as JavaScript and passed to the function
 *  }
 * @throws {SyntaxError} on parse issue
 * @example parseSequenceToMap("T:-60|DL:4|T:60|C:c1|DR:4|T:60|DL:4|T:-60|")
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

/**
 * Classic SierpinskiArrowHead curve
 * @returns {String} 1-st level SierpinskiArrowHead l-system string
 */
 export function createSierpinskiArrowHeadSequence()
 {
    const sequence = "DR:0|";
    return sequence;
 }
 
 /**
  * Generate replacements for SierpinskiArrowHead L-system
  * @param {Number} sideLength Length of a segment 
  * @returns {Array} replacement map for SierpinskiArrowHead l-system
  */
 export function sierpinskiArrowHeadReplacements(sideLength) {
    const DRMap = `T:-60|DL:${sideLength}|T:60|DR:${sideLength}|T:60|DL:${sideLength}|T:-60|`;
    const DLMap = `T:60|DR:${sideLength}|T:-60|DL:${sideLength}|T:-60|DR:${sideLength}|T:60|`;
    
    return [
        {name: 'DL', sequence:parseSequenceToMap(DLMap) },
        {name: 'DR', sequence:parseSequenceToMap(DRMap) }
    ];
 }
 

export function createZigzagCurve(sideLength) {
    const sequence=`DR:${sideLength}|T:-90|DL:${sideLength}|T:90|DL:${sideLength}|T:90|DL:${sideLength}|DR:${sideLength}|T:-90|DR:${sideLength}|T:-90|DL:${sideLength}|T:90|DL:${sideLength}|`;
    return sequence;
}

export function zigZagReplacements(sideLength) {
    const DRMap = `DL:${sideLength}|T:90|DR:${sideLength}|T:-90|DR:${sideLength}|T:-90|DR:${sideLength}|DL:${sideLength}|T:90|DR:${sideLength}|T:90|DR:${sideLength}|T:-90|DR:${sideLength}|`; // to left side
    const DLMap = `DR:${sideLength}|T:-90|DL:${sideLength}|T:90|DL:${sideLength}|T:90|DL:${sideLength}|DR:${sideLength}|T:-90|DL:${sideLength}|T:-90|DL:${sideLength}|T:90|DL:${sideLength}|`; // to right side
    
    return [
        {name: 'DL', sequence:parseSequenceToMap(DLMap) },
        {name: 'DR', sequence:parseSequenceToMap(DRMap) }
    ];
 }


/**
 * Classic Hilbert curve
 * @returns {String} 1-st level hilbert l-system string
 */
export function createHilbertSequence()
{
    const sequence = "A:0";
    return sequence;
}

/**
 * Generate replacements for Hilbert L-system
 * @param {Number} sideLength Length of a segment 
 * @returns {Array} replacement map for hilbert l-system
 */
export function hilbertReplacements(sideLength) {
    // const AMap = `S:0.5|T:-90|B|D:${sideLength}|T:90|A|D:${sideLength}|A|T:90|D:${sideLength}|B|T:-90|S:2|`;
    // const BMap = `S:0.5|T:90|A|D:${sideLength}|T:-90|B|D:${sideLength}|B|T:-90|D:${sideLength}|A|T:90|S:2|`;
    const AMap = `T:-90|B|D:${sideLength}|T:90|A|D:${sideLength}|A|T:90|D:${sideLength}|B|T:-90|`;
    const BMap = `T:90|A|D:${sideLength}|T:-90|B|D:${sideLength}|B|T:-90|D:${sideLength}|A|T:90|`;

    return [
        {name: 'A', sequence:parseSequenceToMap(AMap) },
        {name: 'B', sequence:parseSequenceToMap(BMap) }
    ];
}


/**
 * Douglas McKenna's E-sequence
 * @returns {String} 1-st level E-sequence l-system string
 */
export function createECurve()
{
    const sequence = "DL:0";
    return sequence;
}
/**
 * Generate replacements for E-curve L-system
 * @param {Number} sideLength Length of a side, in mm (or pixels) 
 * @returns {Array} replacement operations for e-curve
 */
export function eCurveReplacements(sideLength) {
    const l = sideLength; // brevity
    const DLMap = `T:-90|DR:${l}|DR:${l}|T:90|DL:${l}|T:90|DL:${l}|T:-90|DR:${l}|T:-90|DR:${l}|DL:${l}|T:-90|DR:${l}|T:90|DL:${l}|DL:${l}|T:90|DR:${l}|T:90|DL:${l}|T:-90|DR:${l}|DL:${l}|DL:${l}|T:90|DR:${l}|T:90|DL:${l}|DR:${l}|T:-90|DR:${l}|T:-90|DL:${l}|T:90|DL:${l}|T:90|DR:${l}|T:-90|DR:${l}|T:-90|DL:${l}|DL:${l}`;

    const DRMap = `DR:${l}|DR:${l}|T:90|DL:${l}|T:90|DL:${l}|T:-90|DR:${l}|T:-90|DR:${l}|T:90|DL:${l}|T:90|DL:${l}|DR:${l}|T:-90|DL:${l}|T:-90|DR:${l}|DR:${l}|DL:${l}|T:90|DR:${l}|T:-90|DL:${l}|T:-90|DR:${l}|DR:${l}|T:-90|DL:${l}|T:90|DR:${l}|DL:${l}|T:90|DL:${l}|T:90|DR:${l}|T:-90|DR:${l}|T:-90|DL:${l}|DL:${l}|T:90`;

    const retVal = [];

    try 
    {
        const DLSeq = parseSequenceToMap(DLMap);
        retVal.push({name: 'DL', sequence: DLSeq});
    }
    catch (err) {
        console.error("DLMap");
        console.error(DLMap);
        console.error(err);
    }

    try 
    {
        const DRSeq = parseSequenceToMap(DRMap);
        retVal.push({name: 'DR', sequence: DRSeq});
    }
    catch (err) {
        console.error("DRMap");
        console.error(DRMap);
        console.error(err);
    }
    
    return retVal;
}



/**
 * Create the 'E' sequence string inspired by Vera Molnar
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

        // let ll = evenBlock ? jitter*longLength : longLength;
        // let ml = evenBlock ? minLength : jitter*minLength;

        let ll = evenBlock ? longLength : longLength;
        let ml = evenBlock ? minLength : minLength;

        for (let bend=0; bend < bends; bend++)
        {
            for (let i=0; i < 2; i++) {
                //dir = -dir;
                sequence += `C:c1|DR:${ll}|T:${dir*angle}|DR:${ml}|T:${dir*angle}|`;            
                angle = (angle + 180) % 360;
            }
        }
        if (evenBlock) 
        {
            angle = (180 + angle) % 360;

            sequence += `C:c2|D:${ll}|DL:${minLength}|T:${dir*angle}|`;
            angle = (180 + angle) % 360;

        }
        // else 
        // {
        //     sequence += `C:c3|DR:${ll}|T:${-dir*angle}|DL:${minLength}|`;
        // }
        if (block > 0 && (block % blocksPerRow === (blocksPerRow-1))) {
//            dir = -dir;

            // sequence += `C:c4|T:${dir*angle}|D2:${ll}|D2:${ml}|T:${dir*angle}|`;
            sequence += `C:c4|T:${dir*angle}|T:${dir*angle}|DL:${ml}|T:${dir*angle}|`;
            angle = (180 + angle) % 360;
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
