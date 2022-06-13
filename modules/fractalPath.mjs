import { Note, Scale } from '@tonaljs/tonal';

import * as Tone from 'tone';

import { countAll, parseSequenceToMap } from "./sequences";

//import {lp_functionMap as functionMap } from 'functionmaps.mjs';


export let noteMods = [[0,2], [4,1], [2,1], [1,2], [4,1], [2,1], [7,2], [4,1], [2,1], [0,2], [4,1], [2,1]];
export let scales = ["D2","C2"]; // progression

let noteBaseDuration = Tone.Time("16n").toSeconds(); // note duration for calculations

export function setBaseNoteDuration(time='16n')
{
    noteBaseDuration = Tone.Time(time).toSeconds(); // note duration for calculations
}

// set base duration for notes for quantization
export function getBaseNoteDuration() { return noteBaseDuration; }

/**
 * Listener (functions) for each event
 */
const listeners = {
    'step': [],
    'action': [],
    'done': []
};

export function on(eventName, func) {
    if (!listeners.hasOwnProperty(eventName))
    {
        throw new Error(`No fractalPath listener events for ${eventName}`);
    }

    listeners[eventName].push(func);
}

export function off(eventName, func) {
    if (!listeners.hasOwnProperty(eventName))
    {
        throw new Error(`No fractalPath listener events for ${eventName}`);
    }

    listeners[eventName] = listeners[eventName].filter(f => f !== func);
}

function event(eventName, data) {
    if (!listeners.hasOwnProperty(eventName))
    {
        throw new Error(`No fractalPath listener events for ${eventName}`);
    }

    listeners[eventName].forEach(element => {
        element(data);
    });
}

/**
 * Iterate fractal function sequence via liveprinter object.
 * Compiles an L-systems-like sequence string into internal functions list
 * and iterates it each time.
 * 
 * @param {LivePrinter} livePrinter 
 * @param {String} sequenceString Sequence in L-system-like form (see sequences.js) 
 * @param {Array} functionMap List of functions to run, mapped to L-system-like keys 
 */
export async function* iterate(livePrinter, sequenceString, functionMap) {

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

    const totalNoteModsLength = noteMods.reduce((prev, curr, i)=> prev + curr[1], 0);

    for (let i=0; i < sequenceFunctions.length; i++)
    {
        const funcInfo = sequenceFunctions[i]; //head to tail order... maybe should reverse for O(1) complexity
        const funcName = funcInfo.name;
        if (!functionMap.hasOwnProperty(funcName)) continue; // this is a NOOP
        const functionType = functionMap[funcName].type;
        const funcBody = functionMap[funcName].function;
        const funcArgs = funcInfo.arg;
        const baseScale = Scale.get(`${scales[notesPlayed % scales.length]} melodic minor`);

        totalSequenceDuration = mainFunctionsCount*totalNoteModsLength*noteBaseDuration; // this might change during iterations

        try {

            if (functionType.match(/draw|move/g)) { // draw or move functions only

                let currentTotalDuration = 0; // duration for this mini-note-sequence

                for(let n=0; n<noteMods.length; n++)
                {
                    const currentNoteLength = noteMods[n][1]; // some are twice as long, etc.
                    const noteString = baseScale.notes[(notesPlayed+noteMods[n][0]) % baseScale.notes.length];
                    const noteMidi = Note.midi(noteString);
                    const noteSpeed = livePrinter.midi2speed(noteMidi,'x'); // in seconds, not ms
                    livePrinter.drawspeed(noteSpeed);
                    const noteDuration = noteBaseDuration*currentNoteLength; // note seconds
                    const noteDist = livePrinter.t2mm(noteDuration*1000, noteSpeed); 
                    
                    //document.getElementById('note-dist').innerHTML = `${noteDist.toFixed(4)}mm`;                
                    //console.info(functionMap[result.name].type);
                    // moved = funcBody(ant, funcArgs, {distance:actualNoteDist});
                    //document.getElementById('cur-time').innerHTML = `${totalSequenceDuration.toFixed(2)}s / min: ${sequenceLength*noteMods.length*noteBaseDuration}`;

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
