/**
 * All important mapping of draw functions to sequence symbols (D, D2, T, etc.).
 * Relies on variable "lp" representing the liveprinter object (see liveprinter.printer.js)
 */
export const lp_functionMap = {
    'D': {
        "type": "main",
        "function": async (lp, arg, args) => {  
            let moved = [];

            let scaledMove;
            
            if (args && args.distance) {
                scaledMove = args.distance*Number(arg);
            } else {
                scaledMove = Number(arg);
            }

            return lp.draw(scaledMove);
        }
    },
    
    'T': {
        "type": "turn",
        "function":
            async (lp, arg, args) => {// rotate internal angle only
            //console.info(`T move ${arg}`);

            return lp.turn(Number(arg));
        }
    },

    // NOT USED
    'S': {
        "type": "scale",
        "function": async (lp, arg, args) => {// set scaling factor for draw operations
            let infoString = `S by ${arg} from ${ant.scale} `;
            
            //lp.scale *= Number(arg);
            
            infoString = infoString + `to ${ant.scale}`;
            //console.info(infoString);

            return lp;
        }
    },

    'C' : {
        "type": "color",
        "function": async (lp, arg, args) => {// change stroke colour
            
            const c1 = `hsl(100,80%,40%)`; // green
            const c2 = `hsl(60,90%,40%)`; // yellow
            const c3 = `hsl(280,80%,40%)`; // purple
            const c4 = `hsl(0,80%,50%)`; // red

            const infoString = `C ${arg} :: ${eval(arg)}`;
            
            console.info(infoString);

            return lp;
        }
    },
    'NOOP': {
        "type": "none",
        "function": async (lp, arg, args) => lp 
    }
};

lp_functionMap.A = lp_functionMap.NOOP;
lp_functionMap.B = lp_functionMap.NOOP;

lp_functionMap.DR = lp_functionMap.D; // synonym, for ECurve etc.
lp_functionMap.DL = lp_functionMap.D; // synonym, for ECurve etc.



/**
 * All important mapping of draw functions to sequence symbols (D, D2, T, etc.)
 */
export const ant_functionMap = {
    'D': {
        "type": "main",
        "function": (ant, arg, args) => {  
            let moved = [];

            let scaledMove;
            
            if (args && args.distance) {
                scaledMove = args.distance*Number(arg);
            } else {
                scaledMove = Number(arg)*ant.scale;
            }
            
            const angleRadians = Math.PI * (ant.angle/180);
            
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
            
                    // update grid -- use args.grid??
                    //grid.set(newx, newy, Grid.FULL);
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
            (ant, arg, args) => {// rotate internal angle only
            //console.info(`T move ${arg}`);

            ant.angle += Number(arg);
            return [];
        }
    },

    'S': {
        "type": "scale",
        "function": (ant, arg, args) => {// set scaling factor for draw operations
            let infoString = `S by ${arg} from ${ant.scale} `;
            ant.scale *= Number(arg);
            infoString = infoString + `to ${ant.scale}`;
            //console.info(infoString);

            return [];
        }
    },
    'C' : {
        "type": "color",
        "function": (ant, arg, args) => {// change stroke colour
            
            const c1 = `hsl(100,80%,40%)`; // green
            const c2 = `hsl(60,90%,40%)`; // yellow
            const c3 = `hsl(280,80%,40%)`; // purple
            const c4 = `hsl(0,80%,50%)`; // red

            const infoString = `C ${arg} :: ${eval(arg)}`;
            
            ant.line.attr({stroke: eval(arg)});

            console.info(infoString);

            return [];
        }
    },
    'A': {
        "type": "none",
        "function": (ant, arg, args) => [] 
    },
    'B': {
        "type": "none",
        "function": (ant, arg, args) => [] 
    },
};

ant_functionMap.DR = ant_functionMap.D; // synonym, for ECurve etc.
ant_functionMap.DL = ant_functionMap.D; // synonym, for ECurve etc.
