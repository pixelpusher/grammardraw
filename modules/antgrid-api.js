'use strict';


/**
 *  API for grid/ants
 *  by Evan Raskob, Copyright 2019
 *  All rights reserved
 */
import Ant from "./ant.js";
import Grid from "./grid.js";


const d2r = (degs) => {
    return degs * Math.PI/180;
};


/**
 * Move and ant on a grid, return the last and current points (x0,y0 => x1,y1) if so, otherwise null
 * @param {Ant} ant walker ant object
 * @param {Grid} grid grid to walk on
 * @param {Object} args Extra arguments to pass on to the function
 * @returns {Array} return the last and current points [[x0,y0], [x1,y1]] if moved, otherwise null 
 */
const moveAnt = (ant, functionMap, functionSequence, args) => {

    // each function returned is an object:
    // { 
    //  type:"function",
    //  name: "name", // D,T, etc.
    //  arg: args     // number, object, string
    // }

    let moved = []; // if we've moved, return [x,y] amount moved

    if (functionSequence.length > 0)
    {
        let result = functionSequence.shift();

        const func = functionMap[result.name].function;

        //console.info(result.arg);

        try {
            //console.info(functionMap[result.name].type);
            moved = func(ant, result.arg, args);
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

module.exports = { d2r, moveAnt, removeAntTrace};

