'use strict';

/**
 *  Ant walker class
 *  by Evan Raskob, Copyright 2019
 *  All rights reserved
 */


export default class Ant {
    constructor(_x = 0, _y = 0, _maxLife = 50)
    {
        // max number of PVectors in the path
        this.x = _x;
        this.y = _y;
        this.alive = true;
        this.maxLife = _maxLife; // max number of ticks this 'lives' for
        this.path = [[_x, _y]];
        this.sequence = '';
        this.angle = 0; // angle of movement
        this.currentLife = 0; // current 'tick'
    }
}
