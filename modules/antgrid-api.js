'use strict';


/**
 *  API for grid/ants
 *  by Evan Raskob, Copyright 2019
 *  All rights reserved
 */
import Ant from "./ant.js";
import Grid from "./grid.js";
import nearley  from "nearley";
import grammar from "../grammar.js";


const d2r = (degs) => {
    return degs * Math.PI/180;
};


const createAnt = (grid) => {
    
    grid.clear();

    let ant = new Ant(8,8);
    grid.set(ant.x, ant.y, Grid.FULL);

    const bends = 4;
    const blocksPerRow = 4; // must be even!
    const blocks = blocksPerRow*3;
    const majLength = 3; // FIXME:::: multiples of min
    const minLength = 2;
    let dir = -1; // direction
    let angle = 90;

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
                ant.sequence += `D:${ll}|T:${dir*angle}|D:${ml}|T:${dir*angle}|`;            
            }
        }
        if (evenBlock) 
        {
            ant.sequence += `D:${ll}|D:${minLength}|T:${dir*angle}|`;
        }
        else 
        {
            ant.sequence += `D:${ll}|T:${-dir*angle}|D:${minLength}|`;
            
        }
        if (block > 0 && (block % blocksPerRow === (blocksPerRow-1))) {
            dir = -dir;
            ant.sequence += `T:${dir*angle}|D:${ll}|D:${ml}|T:${dir*angle}|`;
        }
    }

    console.log(`Created ant: ${ant.sequence}`);

    ant.maxLife = ant.sequence.length;

    return ant;
};


/**
 * Move and ant on a grid, return the last and current points (x0,y0 => x1,y1) if so, otherwise null
 * @param {Ant} ant walker ant object
 * @param {Grid} grid grid to walk on
 * @returns {Array} return the last and current points [[x0,y0], [x1,y1]] if moved, otherwise null 
 */
const moveAnt = (ant, functionMap, functionSequence) => {

    let moved = []; // if we've moved, to return

    if (functionSequence.length > 0)
    {
        let result = functionSequence.shift();

        const func = functionMap[result.name].function;
        try {
            console.info(functionMap[result.name].type);
            moved = func(ant, eval(result.arg));
        }
        catch (err) 
        {
            console.error(err);
        }
    }
    return moved;
}; // end move


/**
 * Remove ant and references from grid
 * @param {Ant} ant 
 */
 const removeAntTrace = (ant, grid) => {
    for (const path of ant.path) {
        grid.set(path[0], path[1], Grid.EMPTY);
    }
};

module.exports = { d2r, createAnt, moveAnt, removeAntTrace};

