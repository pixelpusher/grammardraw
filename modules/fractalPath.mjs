import { Note, Interval, Scale, note } from '@tonaljs/tonal';

import { scaleTranspose } from '@strudel.cycles/tonal';

import * as Tone from 'tone';

import { infiter, numrange, repeat, countto, Vector, makeMapping } from 'liveprinter-utils';

import { countAll, parseSequenceToMap } from "sequences.js";

import {lp_functionMap as functionMap } from 'functionmaps.jsx';


export let noteMods = [[0,2], [4,1], [2,1], [1,2], [4,1], [2,1], [7,2], [4,1], [2,1], [0,2], [4,1], [2,1]];
export let scales = ["D2","C2"]; // progression

let sequence = null; // current fractal functions sequence
let sequenceLength = 0; // length of draw or movement commands in this sequence
let noteBaseDuration = Tone.Time("16n").toSeconds(); // note duration for calculations

let lp = null; // LivePrinter object

let printermapX, printermapY;


export function setBaseNoteDuration(time='16n')
{
    noteBaseDuration = Tone.Time(time).toSeconds(); // note duration for calculations
}

export function setBaseNoteDuration() { return noteBaseDuration; }

export function init(livePrinter, dims=[100,100]){
    if (!livePrinter) {
        throw new Error('Error in fractal path, no LivePrinter object given');
    }

    lp = LivePrinter;
    // maps printer y coords to grid y
    printermapX = makeMapping([0,lp.maxx], [0,dims[0]]);
    printermapY = makeMapping([0,lp.maxy], [0,dims[1]]);

}

export function setSequence(seq)
{
    sequence = parseSequenceToMap(seq);

    sequenceLength = countAll(['M','D','DL','DR'], sequence);
    
    totalSequenceDuration = sequenceLength; // will be recalculated in iterate()

    return sequenceLength;
}

/*
example:

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

/**
 * Listener (functions) for each event
 */
const listeners = {
    'step': [],
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
        element[eventName](data);
    });
}

export async function* iterate() {
    let notesPlayed = 0;
    let moved=0;

    const totalNoteModsLength = noteMods.reduce((prev, curr, i)=> prev + curr[1], 0);

    for (let i=0; i < sequence.length; i++)
    {
        const funcInfo = sequence[i]; //head to tail order... maybe should reverse for O(1) complexity
        const functionType = functionMap[funcInfo.name].type;
        const funcBody = functionMap[funcInfo.name].function;
        const funcArgs = funcInfo.arg;
        const baseScale = Scale.get(`${scales[notesPlayed % scales.length]} melodic minor`);

        totalSequenceDuration = sequenceLength*totalNoteModsLength*noteBaseDuration; // this might change during iterations

        try {

            if (functionType.match(/draw|move/g)) { // draw or move functions only

                let currentTotalDuration = 0; // duration for this mini-note-sequence

                currentSegment++; // moved a segment

                for(let n=0; n<noteMods.length; n++)
                {
                    const currentNoteLength = noteMods[n][1]; // some are twice as long, etc.
                    const noteString = scale.notes[(currentSegment+noteMods[n][0]) % scale.notes.length];
                    const noteMidi = Note.midi(noteString);
                    const noteSpeed = lp.midi2speed(noteMidi,'x'); // in seconds, not ms
                    lp.speed(noteSpeed);
                    const noteDuration = noteBaseDuration*currentNoteLength; // note seconds
                    const noteDist = lp.t2mm(noteDuration*1000, noteSpeed); 
                    
                    //document.getElementById('note-dist').innerHTML = `${noteDist.toFixed(4)}mm`;                
                    //console.info(functionMap[result.name].type);
                    // moved = funcBody(ant, funcArgs, {distance:actualNoteDist});
                    //document.getElementById('cur-time').innerHTML = `${totalSequenceDuration.toFixed(2)}s / min: ${sequenceLength*noteMods.length*noteBaseDuration}`;

                    moved = await funcBody(lp, noteDist);
        
                    currentTotalDuration += noteDuration;
                    totalSequenceDuration += noteDuration; 

                    // fire 'step' event
                    event('step', {
                        noteString,noteMidi,noteSpeed,noteDuration,noteDist,currentTotalDuration, 
                        totalSequenceDuration
                    });
                    yield true;
                }
            }
            else {
                // other non-movement function like turn, colour etc.
                moved = await funcBody(lp, funcArgs);
            }

        }
        catch (err) 
        {
            console.error(err);
        }
    } // end for
    yield false; // done
}
