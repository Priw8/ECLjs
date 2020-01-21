class ECLTimedChange {
    constructor(vm, addr, time, mode, start, end) {
        this.vm = vm;
        this.addr = addr;
        this.time = time;
        this.mode = mode;
        this.start = start;
        this.end = end;
        this.timer = 0;

        this.tmp = 0;

        this.vm.writeVar(this.addr, this.start);
    }
    modeDoubleHandler(x, pwr) {
        if (x < 0.5) {
            return Math.pow(x*2, pwr) / 2;
        } else {
            return (2 - Math.pow(2 - x*2, pwr)) / 2;
        }
    }
    modeDoubleHandlerB(x, pwr) {
        if (x < 0.5) {
            return (0.5 - (Math.pow(1 - 2*x, pwr)*0.5));
        } else {
            return (Math.pow(2*x - 1, pwr)*0.5) + 0.5;
        }
    }
    modeComplexHandler(x, c1, c2, c3, c4) {
        return ((Math.pow(x - c1, 2) / c2) - c3) / c4;
    }
    frame() {
        ++this.timer;
        let x = this.timer / this.time;
        let raw = false;
        switch(this.mode) {
            /* All formulas here come directly from reverse engineering the code of the game. */
            case 0:
                break;
            case 1:
                x = Math.pow(x, 2);
                break;
            case 2:
                x = Math.pow(x, 3);
                break;
            case 3:
                x = Math.pow(x, 4);
                break;
            case 4:
                x = 1 - Math.pow(1 - x, 2);
                break;
            case 5:
                x = 1 - Math.pow(1 - x, 3);
                break;
            case 6:
                x = 1 - Math.pow(1 - x, 4);
                break;
            case 7: // This one is weird, but that's what the game does...
                raw = true;
                this.start += this.end;
                x = this.start;
                break;
            case 8:
                x = Math.pow(x, 2)*(1 - x) + (1 - Math.pow(1 - x, 2))*x;
                break;
            case 9:
                x = this.modeDoubleHandler(x, 2);
                break;
            case 10:
                x = this.modeDoubleHandler(x, 3);
                break;
            case 11:
                x = this.modeDoubleHandler(x, 4);
                break;
            case 12:
                x = this.modeDoubleHandlerB(x, 2);
                break;
            case 13:
                x = this.modeDoubleHandlerB(x, 3);
                break;
            case 14:
                x = this.modeDoubleHandlerB(x, 4);
                break;
            case 15:
                if (x != 1)
                    x = 0;
                break;
            case 16:
                if (x != 0)
                    x = 1;
                break;
            case 17:
                raw = true;
                this.start += this.tmp;
                this.tmp += this.start;
                x = this.start;
                break;
            case 18:
                x = Math.sin(x * Math.PI / 2);
                break;
            case 19:
                x = 1 - Math.sin(x*Math.PI/2 + Math.PI/2);
                break;
            case 20:
                if (x < 0.5) {
                    x = Math.sin(x*Math.PI) / 2;
                } else {
                    x = ((1 - Math.sin(x*Math.PI)) / 2) + 0.5;
                }
                break;
            case 21:
                if (x < 0.5) {
                    x = (1 - Math.sin(x*Math.PI + Math.PI/2))*0.5;
                } else {
                    x = 0.5 + Math.sin((x - 0.5)*Math.PI)*0.5;
                }
                break;
            case 22:
                x = this.modeComplexHandler(x, 0.25, 0.5625, 0.111111, 0.888889);
                break;
            case 23:
                x = this.modeComplexHandler(x, 0.3, 0.49, 0.183673, 0.816326);
                break;
            case 24:
                x = this.modeComplexHandler(x, 0.35, 0.4225, 0.289941, 0.710059);
                break;
            case 25:
                x = this.modeComplexHandler(x, 0.38, 0.3844, 0.37565, 0.62435);
                break;
            case 26:
                x = this.modeComplexHandler(x, 0.4, 0.36, 0.444444, 0.555556);
                break;
            case 27:
                x = 1 - this.modeComplexHandler(1 - x, 0.25, 0.5625, 0.111111, 0.888889);
                break;
            case 28:
                x = 1 - this.modeComplexHandler(1 - x, 0.3, 0.49, 0.183673, 0.816326);
                break;
            case 29:
                x = 1 - this.modeComplexHandler(1 - x, 0.35, 0.4225, 0.289941, 0.710059);
                break;
            case 30:
                x = 1 - this.modeComplexHandler(1 - x, 0.38, 0.3844, 0.37565, 0.62435);
                break;
            case 31:
                x = 1 - this.modeComplexHandler(1 - x, 0.4, 0.36, 0.444444, 0.555556);
                break;
            default:
                this.vm.ecl.out("invalid mode for timed change="+this.mode);
        }
        this.vm.writeVar(this.addr, raw ? x : this.start + (this.end - this.start) * x);
        return this.timer == this.time;
    }
}
