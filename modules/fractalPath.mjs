import { Note, Scale } from '@tonaljs/tonal';

import { countAll, parseSequenceToMap } from "./sequences";

//import {lp_functionMap as functionMap } from 'functionmaps.mjs';

/**
 * Array of note modifiers for each fractal segment [step, duration] where step is a positive or negative number and duration is > 0
 */
let _noteMods = [[0,1]]
//[[0,2], [4,1], [2,1], [1,2], [4,1], [2,1], [7,2], [4,1], [2,1], [0,2], [4,1], [2,1]];

/**
 * Scale progression to play through
 */
let _scales = ["C4"]; // progression, like ["D2","C2"] 

export function getNoteMods() { return _noteMods};

/**
 * Set note modifications inside each fractal path
 * @param {Array} nm Note mods like [[0,1], [1,2]] 
 */
export function setNoteMods(nm) { _noteMods = nm};

export function getScales() { return _scales};

/**
 * Set scales
 * @param {Array} sc Array of scales like ["C2","D4"] 
 */
export function setScales(sc) { _scales=sc};

/**
 *  Note duration for calculations, will be used by liveprinter to calculate based on bpm
 */ 
let noteBaseDuration = 1/16; 

/**
 * Set note duration for calculations in beats (like 2, or a partial like 1/16), will be used by liveprinter to calculate based on bpm
 * @param {Number} beats like 1/4 or 1/16
 */
export function setBaseNoteDuration(beats)
{
    noteBaseDuration = beats; // note duration for calculations
}

/**
 * 
 * @returns {Number} Duration of a "note" in beats (like 1/6 or 2 for example)
 */
export function getBaseNoteDuration() { return noteBaseDuration; }

/**
 * Listener (functions) for each event (step -- when step is reached, 
 *  action -- when something actually happens, done -- when sequence is finished)
 */
const listeners = {
    'step': [],
    'action': [],
    'done': []
};

/**
 * Add a function (listener) to run when event name is fired
 * @param {String} eventName Event name: step, action, or done
 * @param {Function} func Function to run 
 */
export function on(eventName, func) {
    if (!listeners.hasOwnProperty(eventName))
    {
        throw new Error(`No fractalPath listener events for ${eventName}`);
    }

    listeners[eventName].push(func);
}

/**
 * Remove a function (listener) from list of events
 * @param {String} eventName Event name: step, action, or done
 * @param {Function} func Function to remove 
 */
export function off(eventName, func) {
    if (!listeners.hasOwnProperty(eventName))
    {
        throw new Error(`No fractalPath listener events for ${eventName}`);
    }

    listeners[eventName] = listeners[eventName].filter(f => f !== func);
}

/**
 * Fire an event (run listeners of that event name) with event data
 * @param {String} eventName Event name: step, action, or done
 * @param {Object} data Data to pass to listener
 * @returns {Array} array of results
 */
function event(eventName, data) {
    if (!listeners.hasOwnProperty(eventName))
    {
        throw new Error(`No fractalPath listener events for ${eventName}`);
    }

    return listeners[eventName].map(element => {
        element(data);
    });
}

/**
 * Iterate fractal function sequence musically via liveprinter object.
 * Compiles an L-systems-like sequence string into internal functions list
 * and iterates it each time.
 * 
 * @param {LivePrinter} livePrinter 
 * @param {String} sequenceString Sequence in L-system-like form (see sequences.js) 
 * @param {Array} functionMap List of functions to run, mapped to L-system-like keys 
 */
export async function* notestep(livePrinter, sequenceString, functionMap) {

    if (!livePrinter) {
        throw new Error('Error in fractal path, no LivePrinter object given');
    }
    if (!sequenceString) {
        throw new Error('Error in fractal path, no sequence string given');
    }
    if (!functionMap) {
        throw new Error('Error in fractal path, no function map given');
    }

    const sequenceFunctions = parseSequenceToMap(sequenceString);

    /*
    example of a sequence:

        // create initial sequence string, and corresponding turn-by-turn function map
        let eSequence = createESequence(
            {
                bends:2, 
                blocksPerRow:2, // must be even!
                rows:2,
                majLength:10,
                minLength:5,
                dir:-1,
                startAngle:90
            });

    */

    const mainFunctionsCount = countAll(['M','D','DL','DR'], sequenceFunctions);

    let notesPlayed = 0;
    let moved=0;

    const totalNoteModsLength = _noteMods.reduce((prev, curr, i)=> prev + curr[1], 0);

    for (let i=0; i < sequenceFunctions.length; i++)
    {
        const funcInfo = sequenceFunctions[i]; //head to tail order... maybe should reverse for O(1) complexity
        const funcName = funcInfo.name;
        if (!functionMap.hasOwnProperty(funcName)) continue; // this is a NOOP
        const functionType = functionMap[funcName].type;
        const funcBody = functionMap[funcName].function;
        const funcArgs = funcInfo.arg;

        try {

            if (functionType.match(/draw|move/g)) { // draw or move functions only

                let baseScale = Scale.get(`${_scales[notesPlayed % _scales.length]} melodic minor`);
                let noteBaseDurationMs = livePrinter.b2t(noteBaseDuration);
                totalSequenceDuration = mainFunctionsCount*totalNoteModsLength*noteBaseDurationMs; // this might change during iterations
        
                //totalSequenceDuration = mainFunctionsCount*totalNoteModsLength*noteBaseDuration; // this might change during iterations
        
                let currentTotalDuration = 0; // duration for this mini-note-sequence

                for(let n=0; n<_noteMods.length; n++)
                {
                    const currentNoteLength = _noteMods[n][1]; // some are twice as long, etc.
                    const noteString = baseScale.notes[(notesPlayed+_noteMods[n][0]) % baseScale.notes.length];
                    const noteMidi = Note.midi(noteString);
                    const noteSpeed = livePrinter.midi2speed(noteMidi,'x'); // in seconds, not ms
                    livePrinter.drawspeed(noteSpeed);
                    //const noteDuration = noteBaseDuration*currentNoteLength; // note seconds
                    
                    const noteDuration = noteBaseDurationMs*currentNoteLength; // note seconds
                    
                    const noteDist = livePrinter.t2mm(noteDuration, noteSpeed); 
                    
                    //document.getElementById('note-dist').innerHTML = `${noteDist.toFixed(4)}mm`;                
                    //console.info(functionMap[result.name].type);
                    // moved = funcBody(ant, funcArgs, {distance:actualNoteDist});
                    //document.getElementById('cur-time').innerHTML = `${totalSequenceDuration.toFixed(2)}s / min: ${sequenceLength*_noteMods.length*noteBaseDuration}`;

                    moved = await funcBody(livePrinter, noteDist);
        
                    currentTotalDuration += noteDuration;
                    notesPlayed++;

                    // fire 'action' event
                    event('action', {
                        noteString,noteMidi,noteSpeed,notesPlayed,noteDuration,noteDist,currentTotalDuration, 
                        totalSequenceDuration,moved
                    });
                    yield i;
                }
            }
            else {
                // other non-movement function like turn, colour etc.
                // don't yield loop for these!
                moved = await funcBody(livePrinter, funcArgs);
                // fire step event
                event('step', { funcName, funcArgs });
            }

        }
        catch (err) 
        {
            console.error(err);
        }
    } // end for
    event('done', "done");
}


/**
 * Iterate fractal function sequence via liveprinter object.
 * Compiles an L-systems-like sequence string into internal functions list
 * and iterates it each time.
 * 
 * - Make sure to set the drawspeed first!
 * - stepBaseduration can be computed like from ``livePrinter.b2t(noteBaseDuration)``;
 * 
 * @param {LivePrinter} livePrinter 
 * @param {String} sequenceString Sequence in L-system-like form (see sequences.js) 
 * @param {Array} functionMap List of functions to run, mapped to L-system-like keys 
 */
export async function* step(livePrinter, sequenceString, functionMap, stepBaseDuration) {

    if (!livePrinter) {
        throw new Error('Error in fractal path, no LivePrinter object given');
    }
    if (!sequenceString) {
        throw new Error('Error in fractal path, no sequence string given');
    }
    if (!functionMap) {
        throw new Error('Error in fractal path, no function map given');
    }

    const sequenceFunctions = parseSequenceToMap(sequenceString);

    const mainFunctionsCount = countAll(['M','D','DL','DR'], sequenceFunctions);

    let stepsComplete = 0;
    let moved=0;

    for (let i=0; i < sequenceFunctions.length; i++)
    {
        const funcInfo = sequenceFunctions[i]; //head to tail order... maybe should reverse for O(1) complexity
        const funcName = funcInfo.name;
        if (!functionMap.hasOwnProperty(funcName)) continue; // this is a NOOP
        const functionType = functionMap[funcName].type;
        const funcBody = functionMap[funcName].function;
        const funcArgs = funcInfo.arg;

        try {

            if (functionType.match(/draw|move/g)) { // draw or move functions only

                totalSequenceDuration = mainFunctionsCount*stepBaseDuration; // this might change during iterations
        
                let currentTotalDuration = 0; // duration for this mini-note-sequence

                for(let n=0; n<_noteMods.length; n++)
                {
                    const drawDist = livePrinter.t2mm(stepBaseDuration); 
                    
                    moved = await funcBody(livePrinter, drawDist);
        
                    currentTotalDuration += stepBaseDuration;
                    stepsComplete++;

                    // fire 'action' event
                    event('action', {
                        stepsComplete,stepBaseDuration,drawDist,currentTotalDuration, 
                        totalSequenceDuration,moved
                    });
                    yield i;
                }
            }
            else {
                // other non-movement function like turn, colour etc.
                // don't yield loop for these!
                moved = await funcBody(livePrinter, funcArgs);
                // fire step event
                event('step', { funcName, funcArgs });
            }

        }
        catch (err) 
        {
            console.error(err);
        }
    } // end for
    event('done', "done");
}
