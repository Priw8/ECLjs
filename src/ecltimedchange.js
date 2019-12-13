class ECLTimedChange {
    constructor(vm, addr, time, mode, start, end) {
        this.vm = vm;
        this.addr = addr;
        this.time = time;
        this.mode = mode;
        this.start = start;
        this.end = end;
        this.timer = 0;

        this.vm.writeVar(this.addr, this.start);
    }
    frame() {
        ++this.timer;
        let x = 1;
        switch(this.mode) {
            case 0:
                x = this.timer / this.time;
                break;
            case 1:
                x = Math.pow(this.timer / this.time, 2);
                break;
            case 4:
                x = this.timer / this.time;
                x = 2*x - x*x;
                break;
            case 9:
                x = this.timer / this.time;
                x = Math.pow((2 * x) - (x*x), 2);
                break;
            default:
                this.vm.ecl.out("invalid mode for timed change="+this.mode);
        }
        this.vm.writeVar(this.addr, this.start + (this.end - this.start) * x);
        return this.timer == this.time;
    }
}
