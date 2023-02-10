/**
 * Test out various things
 */

 import * as Tone from 'tone';

 import LivePrinter from "./modules/liveprinter.printer.js";
 import {lp_functionMap as functionMap} from "./modules/functionmaps.mjs"
import {createESequence} from "./modules/sequences"


 import { noteMods, scales, getBaseNoteDuration, setBaseNoteDuration, 
    notestep,
    on, off
 } from "./modules/fractalPath.mjs";

 const listener = {
     'step': (v) => {
        for (let i in v)
            console.log(`step event:${i}::${v[i]}`);
    },
     'action': ({noteString,noteMidi,noteSpeed,notesPlayed,noteDuration,noteDist,
        currentTotalDuration, 
        totalSequenceDuration,
        moved}) => {
            console.log("action event");
            console.log({noteString,noteMidi,noteSpeed,notesPlayed,noteDuration,noteDist,
                currentTotalDuration, 
                totalSequenceDuration,
                moved});
            document.getElementById('cur-time').innerHTML = `${currentTotalDuration}s`;
            document.getElementById('note-string').innerHTML = `${noteString}`;
        },
     'done': (v) => {
        animating = false; 
        console.log(`done event: ${v}`);
        cancelAnimationFrame(animationFrameHandle);
     }
 }
 
let animationFrameHandle = null;

// iterate fractal functions

// create initial sequence string, and corresponding turn-by-turn function map
const eSequence = createESequence({bends:2, 
    blocksPerRow:2, /* must be even! */
    rows:2,
    majLength:8,
    minLength:4,
    dir:-1,
    startAngle:90
});

let fractalIterator = notestep(new LivePrinter(), eSequence, functionMap);


// setup listeners
for (let eventName in listener) {
    on(eventName, listener[eventName]);
}

// GUI

const animatingInput = document.querySelector('input[id="animate"]');

let animating = false; // flag for whether we are running or not

animatingInput.addEventListener('change', async (e) => {
    e.preventDefault();
    //console.log(e.target);
    //console.log('clicked:' +  e.target.checked);
    animating = e.target.checked;

    document.getElementById('gen-info').innerHTML = `Animating: ${animating}`;

    await Tone.start();

    if (animating) {
        Tone.Transport.cancel(0); // cancel anything queued
        
        Tone.Transport.start();
        Tone.Transport.bpm.rampTo(80,0.1);

        Tone.Transport.scheduleRepeat( draw, "4n", "0");
    }
    else {
        Tone.Transport.pause();
    }

});


let startTime, previousTime;

async function draw(timestamp)
{
    if (startTime === undefined) {
        startTime = timestamp;
    }

    const elapsed = timestamp - startTime;
    previousTime = timestamp;
    
    document.getElementById('tone-time').innerHTML = `${timestamp}`;

    if (animating) // redundant
    {
        const result = await fractalIterator.next();
        console.log(result.value);
    }
    //animationFrameHandle = requestAnimationFrame(draw);
}

