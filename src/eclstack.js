class ECLstack {
    constructor(ecl) {
        this.stack = new Array(2000); // not sure what stack size the game has
        this.ptr = 0;
        this.ecl = ecl;
    }
    // Generally in js there is no distinction between floats and ints, which is sad. Math.floor is used to perform "int casts"
    pushInt(val) {
        if (this.stack.length == this.ptr) {
            this.ecl.out("ECL stack overflow");
            return;
        }
        this.stack[this.ptr] = INT;
        this.stack[this.ptr + 1] = Math.floor(val);
        this.ptr += 2;
    }
    pushFloat(val) {
        if (this.stack.length == this.ptr) {
            this.ecl.out("ECL stack overflow");
            return;
        }
        this.stack[this.ptr] = FLOAT;
        this.stack[this.ptr + 1] = Number(val);
        this.ptr += 2;
    }
    popInt() {
        if (this.ptr == 0) {
            this.ecl.out("ECL stack underflow");
            return;
        }
        this.ptr -= 2;
        return this.stack[this.ptr] == INT ? this.stack[this.ptr+1] : Math.floor(this.stack[this.ptr+1]);
    }
    popFloat() {
        if (this.ptr == 0) {
            this.ecl.out("ECL stack underflow");
            return;
        }
        this.ptr -= 2;
        // in a low-level language, cast return from int to float if needed
        return this.stack[this.ptr+1];
    }
    // pop/push simple values
    push(val) {
        if (this.stack.length == this.ptr) {
            this.ecl.out("ECL stack overflow");
            return;
        }
        this.stack[this.ptr] = val;
        this.ptr += 1;
    }
    pop() {
        if (this.ptr == 0) {
            this.ecl.out("ECL stack underflow");
            return;
        }
        this.ptr -= 1;
        return this.stack[this.ptr];
    }
}
