// see https://github.com/flauwekeul/honeycomb#get

import { extendHex, defineGrid } from 'honeycomb-grid';
import { SVG, extend as SVGextend, Element as SVGElement } from '@svgdotjs/svg.js';
import { Note, Interval, Scale, note } from '@tonaljs/tonal';

import { scaleTranspose } from '@strudel.cycles/tonal';

import * as Tone from 'tone';

import { infiter, numrange, repeat, countto, Vector, makeMapping } from 'liveprinter-utils';

import LivePrinter from "./modules/liveprinter.printer.js";

import Ant from "./modules/ant.js";
import Grid from "./modules/grid.js";

import { 
    countAll,
    parseSequenceToMap, 
    createESequence, 
    replaceFunctionsInMap, 
    createHilbertSequence, 
    hilbertReplacements, 
    createECurve, 
    eCurveReplacements, 
    testSequences, 
    createSierpinskiArrowHeadSequence,
    SierpinskiArrowHeadReplacements
 } from "./modules/sequences.js";

 import {ant_functionMap as functionMap } from './modules/functionmaps';

window.addEventListener('load', async (event) => {

    console.log('page is fully loaded');

    const frameIntervalTimeMs = 6000/120;

    const drawing = SVG().addTo('#svg-holder').size('90%', '80%');
    const drawGroup = drawing.group();
    const pointsGroup = drawing.group();


    console.log(drawing.node.clientHeight);
    console.log(`w:${drawing.width()} :: h:${drawing.height()}` );

    console.log(Scale.scaleNotes(["F#5","D5", "B4", "G4", "Bb4", "B4", "A4"]));

    
    console.log(Scale.scaleNotes(["F#5","D5"]));


    console.log(Scale.scaleNotes(["B4", "G4"]));

    console.log(Scale.scaleNotes(["B4", "A4"]));


    let w = drawing.node.clientWidth*0.9;
    let h = drawing.node.clientHeight*0.8;

    console.info('w/h:' + w + '/' + h);

    const dims = [800,600]; // dimensions of underlying grid - careful not to make too big!

    // for draw and current animation
    let animating = false;

    let then = 0; // last draw function call
    let ant = null;
    let grid = null;

    let sequenceLength = 0; // length of draw/main functions in current sequence, for reference

    //create a synth and connect it to the main output (your speakers)
    const synth = new Tone.Synth().toDestination();
    const metro = new Tone.AMSynth().toDestination();
    

    const Hex = extendHex({ size: 4 }); 
    const HexGrid = defineGrid(Hex);

    // get the corners of a hex (they're the same for all hexes created with the same Hex factory)
    const corners = Hex().corners();
    // an SVG symbol can be reused
    const hexSymbol = drawing.symbol()
        // map the corners' positions to a string and create a polygon
        .polygon(corners.map(({ x, y }) => `${x},${y}`))
        .fill('none')
        .stroke({ width: 1, color: '#999' });
    
    const animatingInput = document.querySelector('input[id="animate"]');

    const lp = new LivePrinter(); // liveprinter instance

    
    //
    // Ant movements, set in setup
    //
    let antSequence = "", antFunctionSequence = [];


    document.getElementById('play').addEventListener('click', async (event) => {
        //play a middle 'C' for the duration of an 8th note
        metro.volume.value = -36;
        metro.triggerAttackRelease("C4", 0.01);
    });


    document.getElementById('reset-btn').addEventListener('click', function (keyEvent) {
        setup();
    });

//    let noteMods = [[2,1], [0,2], [1,1], [4,2], [2,1], [3,1], [6,2], [4,1], [5,1]];
    let noteMods = [[0,2], [4,1], [2,1], [1,2], [4,1], [2,1], [7,2], [4,1], [2,1], [0,2], [4,1], [2,1]];

    document.getElementById('mods').textContent = JSON.stringify(noteMods);

    document.getElementById('mods').addEventListener('keydown', function (keyEvent) {
        if (keyEvent.code === 'Enter') {

            let goodValue = null;

            this.classList.remove('run-animation');
            this.classList.remove('run-error');
            void this.offsetWidth; // reflow trigger

            try {
                goodValue = eval(this.value);
            }
            catch (err) {
                goodValue = false;
                this.classList.add('run-error');
            }
            if (goodValue)
            {
                noteMods = goodValue;
                this.classList.add('run-animation');
            }
        }
    });

    animatingInput.addEventListener('change', async (e) => {
        e.preventDefault();
        //console.log(e.target);
        //console.log('clicked:' +  e.target.checked);
        animating = e.target.checked;

        await Tone.start();

        if (animating) {
            Tone.Transport.cancel(0); // cancel anything queued
            
            Tone.Transport.start();
            Tone.Transport.bpm.rampTo(80,0.1);

            Tone.Transport.scheduleRepeat( (time) => {
                metro.volume.value = -20;
                metro.triggerAttackRelease("C7", "32n");            
            }, "4n", "0");

            draw();
            //currentAnimation = window.requestAnimationFrame(runAnimations);
            //console.log(animating);
        }
        else {
            Tone.Transport.pause();
            //window.cancelAnimationFrame(currentAnimation);
            //console.log('stopped ' + animating);
        }
    });


    /**
     * Run animation functions., which should return the next function to run or false otherwise
     */
    function runAnimations()
    {
        if (animating) {
            currentAnimation = window.requestAnimationFrame(runAnimations);

            let timeDiff = Date.now() - then;

            if (timeDiff > frameIntervalTimeMs) {
                then = Date.now();
                draw();
            }            
        }
    }

    /**
     * 
     * @param {Array[2]} pos 
     * @param {Grid} g 
     * @returns Array[2]
     */
    function gridPosToWorld(pos, g) {
        const offsetx = 0.02;
        let x = w*(offsetx + (1-offsetx)*pos[0]/grid.width);
        let y = h*(offsetx + (1-offsetx)*pos[1]/grid.height);
        return [x,y];
    }


    /**
     * Set up grids etc.
     */
    async function setup()
    {
        console.info("SETUP----------------");

        //TEST
        testSequences();
        console.log('End test-----------------');

        // gridDrawings.map(g => {
        //     g.grid.clear();
        //     g.ants.map( a => a.line.remove());
        //     g.ants = [];
        //     return g;
        // });
        // gridDrawings = [];

        if (!grid) {
            grid = new Grid(dims[0], dims[1] );
            
            for (let row=0; row < dims[0]; row++) {
                for (let col=0; col < dims[1]; col++) {
                    const pos = gridPosToWorld([row,col],grid);    
                    if (col % 10 == 9 && row % 10 == 9)
                    {
                        pointsGroup.circle(2).attr({
                            cx: pos[0],
                            cy:pos[1],
                            stroke:'none',
                            fill:`hsl(0,0%,60%)`
                        });
                    }
                }
            }
        }


        // if (!ant) 
        // {
            console.info("setting up ant");

            const ll = 6;
            const ml = ll/2;


            // create initial sequence string, and corresponding turn-by-turn function map
            let eSequence = createESequence({bends:2, 
                blocksPerRow:2, /* must be even! */
                rows:2,
                majLength:ll,
                minLength:ml,
                dir:-1,
                startAngle:90
            });
            
            let eFunctionSequence = parseSequenceToMap(eSequence);
 //           console.log(antFunctionSequence);




            //--- Hilbert Curve --------------

            const hilbertIters = 3;
            const hilbert = parseSequenceToMap(createHilbertSequence());
            const hilbertReps = hilbertReplacements(dims[1]/(Math.pow(2,hilbertIters+2)));

            let hilbertIterated = replaceFunctionsInMap(hilbertReps, hilbert);
            for (let i=0; i<hilbertIters; i++) {
                hilbertIterated = replaceFunctionsInMap(hilbertReps, hilbertIterated);
            }

            //--- Douglas McKenna's E-Curve --------------

            let eIters = 1; // iterations

            let eCurve = [];
            try {
                eCurve = parseSequenceToMap(createECurve());
            }   catch (err) {
                console.error(err);
            }
            console.log(eCurve);
            let sideLength = 1;

            const eCurveReps = eCurveReplacements(sideLength);
            let eCurveIterated = replaceFunctionsInMap(eCurveReps, eCurve);

            await repeat(eIters-1, async (i) => eCurveIter1 = replaceFunctionsInMap(eCurveReps, eCurveIterated));

            //console.log('ECurve:');
            //console.log(eCurveIterated);


            //--- Sierpinski Arrow Curve --------------

            let SierpinskiCurve = []; 
            

            let serpIters = 6; // iterations

            try {
                SierpinskiCurve = parseSequenceToMap(createSierpinskiArrowHeadSequence());
            }   catch (err) {
                console.error(err);
            }

            sideLength = 1;

            const sierpCurveReps = SierpinskiArrowHeadReplacements(sideLength);
            let sierpIterated = replaceFunctionsInMap(sierpCurveReps, SierpinskiCurve);

            await repeat(serpIters-1, async (i) => sierpIterated = replaceFunctionsInMap(sierpCurveReps, sierpIterated));

            //console.log('SierpinskiCurve:');
            //console.log(sierpIterated);

            /// END CURVE generators --------------------------------

            antFunctionSequence = sierpIterated; // choose a curve
        
            //antFunctionSequence = eFunctionSequence;

            ////----------------------------------------------------

            drawGroup.clear();
            totalSequenceDuration = 0; // for recording purposes
            currentSegment = 0;
            notesPlayed = 0;

            ant = new Ant(0,dims[1]-1);

            grid.clear();
            grid.set(ant.x, ant.y, Grid.FULL);
                        
            ant.line = drawGroup.polyline(gridPosToWorld([ant.x, ant.y],grid))
                .fill('none')
                .attr({stroke: 'hsl(100,80%,40%)', 'stroke-width': 2});
        // }

        sequenceLength = countAll(['DL','DR'], antFunctionSequence);
        console.info(`counted ${sequenceLength} of ${['DL','DR']} in sequence` );
        document.getElementById('segs').innerHTML = `${sequenceLength}`;

    }


    /**
     * Update ant path and drawn line 
     * 
     * @param {Ant} ant 
     */
    function updateAntPath(ant) {
        const scaledPath = ant.path.map(p => gridPosToWorld(p,grid));
        ant.line = ant.line.plot(scaledPath);
    }


    function playNote(noteFreq, noteDuration, timeOffset, callback)
    {
        //const nextTime = Tone.Transport.nextSubdivision(noteDuration);                

        // schedule draw for after note is finished
        Tone.Transport.scheduleOnce( (time) => {
            synth.triggerAttackRelease(noteFreq, noteDuration);

            callback();   
        },`+${(timeOffset+noteDuration).toFixed(2)}`);

        //console.log(`current vs. nextTime:${Tone.immediate()}/${nextTime}`);
    }

    //let scales = ["F#4", "Bb3", "F#4", "Bb4", "F#4", "D4", "F#4", "Bb4", "G3", "A3"];
    let scales = ["F#3", "D3", "F#3", "A3", "F#3", "D3", "G3", "G3"];
    let notesPlayed = 0;
    let noteBaseDuration = Tone.Time("16n").toSeconds(); // note seconds

    console.log(`Each note is ${noteBaseDuration}s long`);

    document.getElementById('bl3').innerHTML = `${noteBaseDuration.toFixed(4)}s`;


    // maps printer y coords to grid y
    const printermap = makeMapping([0,lp.maxy], [0,dims[1]]);


    let totalSequenceDuration = 0; // for recording purposes
    let currentSegment = 0;
    

    /**
     * MAIN DRAWING FUNCTION
     */
    function draw() {

        if (animating && antFunctionSequence.length > 0)    
        {
            let scale = Scale.get(`${scales[notesPlayed % scales.length]} melodic minor`);

            // apply functions until we hit a 'main' function and get results  

            while (antFunctionSequence.length > 0)
            {
                const funcInfo = antFunctionSequence.shift();
                const functionType = functionMap[funcInfo.name].type;
                const funcBody = functionMap[funcInfo.name].function;
                const funcArgs = funcInfo.arg;

                try {

                    if (functionType == "main") { // draw function

                        //const noteMods = [[0,1], [4,2], [0,3], [2,1], [6,1]]; // [note shift, duration]

                        let currentTotalDuration = 0;

                        currentSegment++; // moved a segment

                        document.getElementById('cur-seg').innerHTML = `${currentSegment}`;

                        noteMods.forEach((n, i) =>{
                            const noteString = scale.notes[n[0] % scale.notes.length];
                            const noteMidi = Note.midi(noteString);
                            const noteSpeed = lp.midi2speed(noteMidi,'x'); // in seconds, not ms
                            const noteDuration = n[1]*noteBaseDuration; // note seconds
                            const noteDist = lp.t2mm(noteDuration*1000, noteSpeed); 
                
                            // convert note distance on printer bed to screen grid distance
                            const actualNoteDist = Math.round(printermap(noteDist));

                            document.getElementById('note-dist').innerHTML = `${noteDist.toFixed(4)}mm`;
                            
                            //console.log(`note length vs screen: ${noteDist}/${actualNoteDist}`);
            

                            //console.info(functionMap[result.name].type);
                            // moved = funcBody(ant, funcArgs, {distance:actualNoteDist});
                            
                            const callback = (i === (noteMods.length-1)) ? ()=>{ 
                                notesPlayed++;
                                moved = funcBody(ant, funcArgs, {distance:actualNoteDist});
                                updateAntPath(ant); // on screen
                                draw();
                            } : ()=>{
                                moved = funcBody(ant, funcArgs, {distance:actualNoteDist});
                                updateAntPath(ant); // on screen
                            }; 
                            
                            // PLAY NOTE for full duration with callback
                            playNote(noteString, noteDuration, currentTotalDuration, callback);
                            currentTotalDuration += noteDuration;
                            totalSequenceDuration += noteDuration;
                            
                        });
                        //currentNoteIndex = (currentNoteIndex + 1) % (notesSequence.length;
                        //currentNoteIndex = (currentNoteIndex+1) % 2;

                        // done drawing for this round! -------
                        break; 

                    }
                    else {
                        // other function like colour etc.

                        moved = funcBody(ant, funcArgs);
                    }

                }
                catch (err) 
                {
                    console.error(err);
                }
            }
        }
        document.getElementById('cur-time').innerHTML = `${totalSequenceDuration.toFixed(2)}s / min: ${sequenceLength*noteMods.length*noteBaseDuration}`;

    }

    const resize = setup;

    window.addEventListener('resize', resize);

    await setup();
});

