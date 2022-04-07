// see https://github.com/flauwekeul/honeycomb#get

import { extendHex, defineGrid } from 'honeycomb-grid';
import { SVG, extend as SVGextend, Element as SVGElement } from '@svgdotjs/svg.js';
import { Interval, Note, Scale } from "@tonaljs/tonal";
import * as Tone from 'tone';

import Ant from "./modules/ant.js";
import Grid from "./modules/grid.js";
import { d2r, moveAnt, createAnt, removeAntTrace } from "./modules/antgrid-api";
import { parseSequenceToMap, createESequence, replaceFunctionsInMap, createHilbertSequence, hilbertReplacements, testSequences } from "./modules/sequences.js";


window.addEventListener('load', (event) => {
    console.log('page is fully loaded');

    const frameIntervalTimeMs = 6000/120;

    const drawing = SVG().addTo('#svg-holder').size('90%', '80%');
    const drawGroup = drawing.group();
    const pointsGroup = drawing.group();


    //console.log(drawing.node.clientHeight);
    let w = drawing.node.clientWidth*0.9;
    let h = drawing.node.clientHeight*0.8;

    console.info('w/h:' + w + '/' + h);

    const dims = [600,400]; // dimensions of underlying grid - careful not to make too big!

    let animating = false;
    let currentAnimation = -1;

    let then = 0; // last draw function call
    let ant = null;
    let grid = null;

    //create a synth and connect it to the main output (your speakers)
    const synth = new Tone.Synth().toDestination();

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
    
    /**
     * All important mapping of draw functions to sequence symbols (D, D2, T, etc.)
     */
    const functionMap = {
        'D': {
            "type": "main",
            "function": (ant, arg) => {  
                let moved = [];
                const scaledMove = Number(arg)*ant.scale;
                const angleRadians = d2r(ant.angle);
                
                //console.info(`D move ${arg}, scale:${ant.scale}, total:${scaledMove}`);
                //console.log(ant);

                // move from current position to new position in the current direction by number of cells specified in cmd
                let newx, newy;
                
                newx =  ant.x + Math.round(scaledMove * Math.cos(angleRadians));
                newy =  ant.y + Math.round(scaledMove * Math.sin(angleRadians));

                // move or die
                //if (grid.get(newx, newy) === Grid.EMPTY) {
                    if ((ant.x !== newx) || (ant.y !== newy)) {
                        moved = [newx, newy];

                        //console.log(`Moved: ${moved}`)

                        ant.x = newx;
                        ant.y = newy;
                
                        // update grid
                        grid.set(newx, newy, Grid.FULL);
                        // update path
                        ant.currentLife++;
                    
                        ant.path[ant.currentLife] = [newx, newy];
                        //console.log(ant.path);
                    }
                // } else {
                //     console.log(`Ant hit edge or cell going towards (${newx},${newy})`);
                //     //ant.alive = false;
                // }
                return moved; // moved
            }
        },
        
        'T': {
            "type": "turn",
            "function":
                (ant, arg) => {// rotate internal angle only
                //console.info(`T move ${arg}`);

                ant.angle += Number(arg);
                return [];
            }
        },

        'S': {
            "type": "scale",
            "function": (ant, arg) => {// set scaling factor for draw operations
                let infoString = `S by ${arg} from ${ant.scale} `;
                ant.scale *= Number(arg);
                infoString = infoString + `to ${ant.scale}`;
                //console.info(infoString);

                return [];
            }
        },
        'C' : {
            "type": "color",
            "function": (ant, arg) => {// set scaling factor for draw operations
                
                const c1 = `hsl(100,80%,40%)`;
                const c2 = `hsl(280,80%,40%)`;
                const c3 = `hsl(340,80%,40%)`;
                const c4 = `hsl(40,80%,40%)`;

                const infoString = `C ${arg} :: ${eval(arg)}`;
                
                ant.line.attr({stroke: eval(arg)});

                console.info(infoString);

                return [];
            }
        },
        'A': {
            "type": "none",
            "function": (ant, arg) => [] 
        },
        'B': {
            "type": "none",
            "function": (ant, arg) => [] 
        },
    };

    functionMap.D2 = functionMap.D; // synonym, but D2's aren't replaced when iterated


    //
    // Ant movements, set in setup
    //
    let antSequence = "", antFunctionSequence = [];


    document.getElementById('play').addEventListener('click', async (event) => {
        //play a middle 'C' for the duration of an 8th note
        synth.triggerAttackRelease("C4", "8n");

    });

    animatingInput.addEventListener('change', (e) => {
        e.preventDefault();
        //console.log(e.target);
        //console.log('clicked:' +  e.target.checked);
        animating = e.target.checked;

        if (animating) {
            currentAnimation = window.requestAnimationFrame(runAnimations);
            //console.log(animating);
        }
        else {
            window.cancelAnimationFrame(currentAnimation);
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
    function setup()
    {
        console.info("SETUP----------------");

        // setup Tone
        Tone.Transport.start();


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
                    if (col % 4 == 0 && row % 4 == 0)
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


        if (!ant) 
        {
            console.info("setting up ant");

            const ll = 180;
            const ml = ll/4;

            // create initial sequence string, and corresponding turn-by-turn function map
            antSequence = createESequence({bends:1, 
                blocksPerRow:2, /* must be even! */
                rows:2,
                majLength:ll, 
                minLength:ml,
                dir:-1,
                startAngle:90
            });
            
            antFunctionSequence = parseSequenceToMap(antSequence);
            console.log(antFunctionSequence);

            const countAll = (funcName, funcArray) =>
                funcArray.filter(({name}) => name === funcName) 
                .reduce((sum, current) => sum + 1, 0);


            const numDs = countAll('D', antFunctionSequence);
            console.info(numDs);


            // const replaceSequence = createEReplaceSequence({bends:2, 
            //     majLength:ll,
            //     minLength:ml,
            //     dir:1,
            //     startAngle:-90
            // });
        
            // const replaceMap = parseSequenceToMap(replaceSequence);
        
            // antFunctionSequence = replaceFunctionsInMap(['D'], antFunctionSequence, replaceMap);
        
            // console.log(antFunctionSequence);

            const hilbertIters = 4;
            const hilbert = parseSequenceToMap(createHilbertSequence());
            const hilbertReps = hilbertReplacements(dims[0]/(Math.pow(2,hilbertIters+2)));

            let hilbertIter1 = replaceFunctionsInMap(hilbertReps, hilbert);
            for (let i=0; i<hilbertIters; i++) {
                hilbertIter1 = replaceFunctionsInMap(hilbertReps, hilbertIter1);
            }

            //console.log('HILBERT');
            //console.log(hilbertIter1);


            antFunctionSequence = hilbertIter1;
        
            ant = new Ant(0,dims[1]);

            grid.clear();
            grid.set(ant.x, ant.y, Grid.FULL);
                        
            ant.line = drawGroup.polyline(gridPosToWorld([ant.x, ant.y],grid))
                .fill('none')
                .attr({stroke: 'hsl(100,80%,40%)', 'stroke-width': 2});
        }
    }


    let readyToDraw = false; // true when finished moving
    let notesSequence = Scale.get("c3 pentatonic").notes.concat(Scale.get("c4 pentatonic").notes);
    let currentNoteIndex = 0;

    function draw() {
        let moves = 0;
        let didItActuallyMove = true;
        
        // let currentNote = 

        while (antFunctionSequence.length > 0 && didItActuallyMove)    
        {
            const moved = moveAnt(ant, functionMap, antFunctionSequence);
            didItActuallyMove = (moved.length !== 0);

            if (didItActuallyMove)
            {
                synth.triggerAttackRelease(notesSequence[Math.round(currentNoteIndex*Math.random())], "32n");

                currentNoteIndex = (currentNoteIndex + 1) % notesSequence.length;

                //const infoBox = document.getElementById('info');
                //infoBox.innerHTML += '<br/>' + gridPosToWorld(moved,grid);
                const scaledPath = ant.path.map(p => gridPosToWorld(p,grid));
                ant.line = ant.line.plot(scaledPath);
            }
            moves++;
         
            if (moves > 10) break; // safety
        }
    }

    const resize = setup;

    window.addEventListener('resize', resize);

    setup();
});

