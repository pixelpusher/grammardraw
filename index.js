// see https://github.com/flauwekeul/honeycomb#get


const nearley  = require("nearley");
const grammar = require ("./grammar.js");

import { extendHex, defineGrid } from 'honeycomb-grid';
import { SVG, extend as SVGextend, Element as SVGElement } from '@svgdotjs/svg.js';
import { Interval, Note, Scale } from "@tonaljs/tonal";
import * as Tone from 'tone';

import Ant from "./modules/ant.js";
import Grid from "./modules/grid.js";
import { d2r, moveAnt, createAnt, removeAntTrace } from "./modules/antgrid-api";


window.addEventListener('load', (event) => {
    console.log('page is fully loaded');

    const drawing = SVG().addTo('#svg-holder').size('90%', '100%');
    const drawGroup = drawing.group();

    //console.log(drawing.node.clientHeight);
    let w = drawing.node.clientWidth;
    let h = drawing.node.clientHeight;

    console.info('w/h:' + w + '/' + h);

    const dims = [120,80]; // dimensions of underlying grid - careful not to make too big!

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
    
    const functionMap = {
        'D': {
            "type": "main",
            "function": (ant, arg) => {  
                let moved = [];
                
                console.info(`D move ${arg}`);
                //console.log(ant);

                // move from current position to new position in the current direction by number of cells specified in cmd
                let newx, newy;
                
                newx =  ant.x + Math.round(arg * Math.cos(d2r(ant.angle)));
                newy =  ant.y + Math.round(arg * Math.sin(d2r(ant.angle)));

                // move or die
                if (grid.get(newx, newy) === Grid.EMPTY) {
                    if ((ant.x !== newx) || (ant.y !== newy)) {
                        moved = [newx, newy];

                        console.log(`Moved: ${moved}`)

                        ant.x = newx;
                        ant.y = newy;
                
                        // update grid
                        grid.set(newx, newy, Grid.FULL);
                        // update path
                        ant.currentLife++;
                    
                        ant.path[ant.currentLife] = [newx, newy];
                        //console.log(ant.path);
                    }
                } else {
                    console.log(`Ant hit edge or cell: ${newx}:${newy}`);
                    ant.alive = false;
                }
                return moved; // moved
            }
        },
        
        'T': {
            "type": "turn",
            "function":
                (ant, arg) => {// rotate internal angle only
                console.info(`T move ${arg}`);

                ant.angle += arg;
                return [];
            }
        }
    };


    // array of draw functions, parsed
    let antFunctionSequence = [];


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

            if (timeDiff > 40) {
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
        const offsetx = 0.05;
        let x = w*(offsetx + (1-offsetx)*pos[0]/grid.width);
        let y = h*(offsetx + (1-offsetx)*pos[1]/grid.height);
        return [x,y];
    }

    /**
     * Set up grids etc.
     */
    function setup()
    {
        // gridDrawings.map(g => {
        //     g.grid.clear();
        //     g.ants.map( a => a.line.remove());
        //     g.ants = [];
        //     return g;
        // });
        // gridDrawings = [];

        
        if (!grid) grid = new Grid(dims[0], dims[1] );
        
        if (!ant) 
        {
            console.info("setting up ant");

            antFunctionSequence = [];

            ant = createAnt(grid);
                
            ant.line = drawGroup.polyline(gridPosToWorld([ant.x, ant.y],grid))
                .fill('none')
                .attr({stroke: 'hsl(100,80%,40%)', 'stroke-width': 2});


            let parser = new nearley.Parser(nearley.Grammar.fromCompiled(grammar));

            parser.feed(ant.sequence);
                
            try {
                //console.log(parser.results);    
            
                for (let result of parser.results[0]) {
                    antFunctionSequence.push(result);
                }
            } catch (parseError) {
                    console.log("Error at character " + parseError.offset); // "Error at character 9"
            }            
            // render 10,000 hexes
            // HexGrid.rectangle({ width: dims[0], height: dims[1] }).forEach(hex => {
            //     const { x, y } = hex.toPoint()
            //     // use hexSymbol and set its position for each hex
            //     drawing.use(hexSymbol).translate(x, y)
            // });

        }
    }


    let moves = 0;

    function draw() {
        
        moves++;

       // if (moves >= 20) cancelAnimationFrame(currentAnimation);
        //else {
            const moved = moveAnt(ant, functionMap, antFunctionSequence);

            if (moved.length !== 0)
            {
                const infoBox = document.getElementById('info');
                infoBox.innerHTML += '<br/>' + gridPosToWorld(moved,grid);
                const scaledPath = ant.path.map(p => gridPosToWorld(p,grid));
                ant.line = ant.line.plot(scaledPath);
            }
        //}
    }

    const resize = setup;

    window.addEventListener('resize', resize);

    setup();
});

