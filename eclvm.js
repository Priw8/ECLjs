class ECLVM {
    constructor(file, offset, ecl, asyncList) {
        this.ecl = ecl;
        this.offset = 0;
        this.file = null;
        if (asyncList == null) {
            this.asyncList = new Array(16);
            for (let i=0; i<this.asyncList.length; ++i)
                this.asyncList[i] = null;
        } else
            this.asyncList = asyncList;

        this.stack = new ECLstack();

        this.delete = 0;
        this.time = 0;
        this.wait = 0;
        this.bp = 0; // base pointer for accessing local vars

        this.call(file, offset);
    }
    call(file, offset) {
        // in a low-level lang you can get away with using offset to an absolute memory location, instead of pushing offset in the file and file data
        this.stack.push(this.time);
        this.stack.push(this.offset);
        // pushing the file to the stack is a bit wack, but there are no absolute pointers in js
        // although I guess I could put all loaded ECL files in 1 buffer? Hmm...
        this.stack.push(this.file);
        this.offset = offset;
        this.file = file;
        file.reader.setOffset(offset);
        const subHeader = file.reader.struct(SUB_HEADER);
        this.offset = file.reader.getOffset();
        if (subHeader.magic != ECLH)
            this.ecl.out(`Bad ECLH header at offset ${offset} in file ${file.name}`);

        file.reader.setOffset(offset + subHeader.dataOffset);
    }
    ret() {
        this.stack.ptr = this.bp;
        this.bp = this.stack.pop();
        this.file = this.stack.pop();
        if (typeof this.file != "object") {
            this.ecl.out("fatal error: stack corruption detected");
            throw "ecl stack corruption";
        }
        this.offset = this.stack.pop();
        this.time = this.stack.pop();
    }
    getVar(addr) {
        if (addr > -1000)
            return this.stack.stack[addr];
        else {
            switch(addr + 10000) {
                case 0:
                    // TODO: implement ZUN's rand function
                    return Math.random()*INT32_MAX;
                case 93: // SPELL_ID
                    return -1;
                default:
                    this.ecl.out("unknown var read: " + addr);
                    return 0;
            }
        }
    }
    writeVar(addr, val) {
        if (addr >= 0)
            this.stack.stack[addr] = val;
        else {
            switch(addr + 10000) {
                case 0:
                case 93: // SPELL_ID
                    this.ecl.out(`ERROR: variable ${addr} is readonly`);
                    break;
                default:
                    this.ecl.out("unknown var write: " + addr);
            }
        }
    }
    getIntArg(instr, n, extraOffset=0) {
        this.file.reader.setOffset(this.offset + SIZEOF_INSTR + n*4 + extraOffset);
        let val = this.file.reader.int32();
        if ((instr.paramMask >> n) & 1)
            return Math.floor(this.getVar(this.getVarAddress(val)));
        return val;
    }
    getFloatArg(instr, n, extraOffset=0) {
        this.file.reader.setOffset(this.offset + SIZEOF_INSTR + n*4 + extraOffset);
        let val = this.file.reader.float();
        if ((instr.paramMask >> n) & 1)
            return this.getVar(this.getVarAddress(val));
        return val;
    }
    getCstringArg(instr, n) {
        this.file.reader.setOffset(this.offset + SIZEOF_INSTR + n*4 + 4);
        return this.file.reader.cstring();
    }
    // the so-called "D" param is an 8-byte value consisting of 2 bytes indicating typeFrom and typeTo, 2 bytes of padding and 4 byte float or int32 value
    getDArg(instr, n, DParamsBefore, extraOffset=0) {
        this.file.reader.setOffset(this.offset + SIZEOF_INSTR + extraOffset + (n - DParamsBefore)*4 + DParamsBefore*8);
        const type = this.file.reader.uint32();
        let val;
        if (type == CAST_II || type == CAST_FI)
            val = this.file.reader.int32();
        else
            val = this.file.reader.float();
        
        if ((instr.paramMask >> n) & 1) {
                val = this.getVar(this.getVarAddress(val));
        }
        if (type == CAST_IF)
            val = Math.floor(val);

        return val;
    }
    getDType(instr, n, DParamsBefore, extraOffset=0) {
        this.file.reader.setOffset(this.offset + SIZEOF_INSTR + extraOffset + (n - DParamsBefore)*4 + DParamsBefore*8);
        const type = this.file.reader.uint32();
        if (type == CAST_II || type == CAST_IF)
            return INT;
        else
            return FLOAT;
    }
    getVarAddress(addr) {
        if (addr >= 0)
            return this.bp + addr / 4; // stack is made of 4 byte values, val is offset in bytes
        else if (addr > -1000)
            return this.stack.ptr + addr*2 + 1;
        else
            return addr;
    }
    // returns either stack offset or the raw value (negative)
    // if the value is negative, it should be passed to some switch that determines what var it actually refers to
    getAddressOfIntArg(instr, n) {
        this.file.reader.setOffset(this.offset + SIZEOF_INSTR + n*4);
        if (!((instr.paramMask >> n) & 1))
            this.ecl.out(`warning: parameter ${n} of ins_${instr.id} is not a variable`);

        let val = this.file.reader.int32();
        return this.getVarAddress(val);
    }
    getAddressOfFloatArg(instr, n) {
        this.file.reader.setOffset(this.offset + SIZEOF_INSTR + n*4);
        if (!((instr.paramMask >> n) & 1))
            this.ecl.out(`warning: parameter ${n} of ins_${instr.id} is not a variable`);

        let val = this.file.reader.float();
        return this.getVarAddress(val);
    }
    frame() {
        if (this.wait) {
            --this.wait;
        } else {
            while(this.execute());
            if (!this.wait)
                this.time += 1;
        }
        return this.offset;
    }
    /* Returns 1 if should be called again (continue execution), or 0 if the execution should be halted. */
    execute() {
        this.file.reader.setOffset(this.offset);
        const instr = this.file.reader.struct(INSTR);
        if (instr.time > this.time || this.wait)
            return 0;

        // this.ecl.out(`execute opcode ${instr.id}`);
        let noInc = 0;
        // TODO: indent this lol
        if (instr.rankMask & this.ecl.rankMask) {
        switch(instr.id) {
            case 0: break; // nop
            case 1: // delete
                this.offset = 0;
                return 0;
            case 10: // return
                this.ret();
                return this.offset;
            case 11:
            case 15:
            case 16: { // call, callAsync, callAsyncId
                let name = this.getCstringArg(instr, 0);
                this.ecl.out(`calling ${name} via ins_${instr.id}`);
                let paramOffset = this.getIntArg(instr, 0); // size of the string

                let i, id;
                if (instr.id == 16) {
                    id = this.getIntArg(instr, 1, paramOffset);
                    i = 2;
                } else {
                    id = -1;
                    i = 1;
                }

                let params = [];
                for (; i<instr.paramCnt; ++i) {
                    // string size + "string size" size - sizeof(param_D), since D param cnt is 1 smaller than actual param cnt
                    let val = this.getDArg(instr, i, params.length, paramOffset);
                    params.push(val);
                }
                this.offset += instr.size;
                let [offset, file] = this.ecl.findSub(name);
                if (!offset) {
                    this.ecl.out("Fatal error: unknown sub call - "+name);
                    this.offset = 0;
                    return 0;   
                }
                if (instr.id == 11) {
                    this.stack.ptr -= instr.popCnt*2;
                    this.call(file, offset);
                    // copy params to the called sub vars
                    for (let i=0; i<params.length; ++i) {
                        this.stack.stack[this.stack.ptr + i + 1] = params[i];
                    }
                } else {
                    const vm = new ECLVM(file, offset, this.ecl, this.asyncList);
                    this.ecl.vms.push(vm);
                    if (id >= 0) {
                        if (this.asyncList[id] != null)
                            this.asyncList[id].delete = true;
                        this.asyncList[id] = vm;
                    }
                    for (let i=0; i<params.length; ++i) {
                        vm.stack.stack[vm.stack.ptr + i + 1] = params[i];
                    }
                }
                return 1;
            }
            case 17: { // killAsync
                let id = this.getIntArg(instr, 0);
                if (this.asyncList[id] != null) {
                    this.asyncList[id].delete = true;
                    this.asyncList[id] = null;
                }
                break;
            }
            case 12: // jmp
                this.time = this.getIntArg(instr, 1);
                this.offset += this.getIntArg(instr, 0);
                noInc = 1;
                break;
            case 13: // jmpeq
                if (!this.stack.popInt()) {
                    this.time = this.getIntArg(instr, 1);
                    this.offset += this.getIntArg(instr, 0);
                    noInc = 1;
                }
                break;
            case 14: // jmpneq
                if (this.stack.popInt()) {
                    this.time = this.getIntArg(instr, 1);
                    this.offset += this.getIntArg(instr, 0);
                    noInc = 1;
                }
                break;
            case 21: // normally does not exist, here it's a debug ins that prints an int
                this.ecl.out(`ins_21: ${this.getIntArg(instr, 0)}`);
                break;
            case 23:
                this.wait = this.getIntArg(instr, 0) - 1;
                break;
            case 30: {
                let str = this.getCstringArg(instr, 0);
                let paramOffset = this.getIntArg(instr, 0); // size of the string
                for (let i=1; i<instr.paramCnt; ++i) {
                    let val = this.getDArg(instr, i, i - 1, paramOffset);
                    let type = this.getDType(instr, i, i - 1, paramOffset);
                    if (type == FLOAT)
                        str = str.replace("%f", val.toFixed(4) + "f");
                    else
                        str = str.replace("%d", val);
                }
                this.ecl.out(str);
                break;
            }
            case 40: // stackcAlloc
                this.stack.push(this.bp);
                this.bp = this.stack.ptr;
                this.stack.ptr += this.getIntArg(instr, 0) / 4; // here stack consists of 4-byte values
                break;
            case 42: // pushi
                this.stack.pushInt(this.getIntArg(instr, 0));
                break;
            case 43: // popi
                this.writeVar(this.getAddressOfIntArg(instr, 0), this.stack.popInt());
                break;
            case 44: // pushf
                this.stack.pushFloat(this.getFloatArg(instr, 0));
                break;
            case 45: // popf
                this.writeVar(this.getAddressOfFloatArg(instr, 0), this.stack.popFloat());
                break;
            case 50: // addi
                this.stack.pushInt(this.stack.popInt() + this.stack.popInt());
                break;
            case 51: // addf
                this.stack.pushFloat(this.stack.popFloat() + this.stack.popFloat());
                break;
            case 52: // subi
                this.stack.pushInt(this.stack.popInt() - this.stack.popInt());
                break;
            case 53: // subf
                this.stack.pushFloat(this.stack.popFloat() - this.stack.popFloat());
                break;
            case 54: // muli
                this.stack.pushInt(this.stack.popInt() * this.stack.popInt());
                break;
            case 55: // mulf
                this.stack.pushFloat(this.stack.popFloat() * this.stack.popFloat());
                break;
            case 56: // divi
                this.stack.pushInt(Math.floor(this.stack.popInt() / this.stack.popInt()));
                break;
            case 57: // divf
                this.stack.pushFloat(this.stack.popFloat() / this.stack.popFloat());
                break;
            case 58: // modi
                this.stack.pushInt(Math.floor(this.stack.popInt() % this.stack.popInt()));
                break;
            case 59: // eqi
                this.stack.pushInt(this.stack.popInt() == this.stack.popInt());
                break;
            case 60: // eqf
                this.stack.pushInt(this.stack.popFloat() == this.stack.popFloat());
                break;
            case 61: // neqi
                this.stack.pushInt(this.stack.popInt() != this.stack.popInt());
                break;
            case 62: // neqf
                this.stack.pushInt(this.stack.popFloat() != this.stack.popFloat());
                break;
            // all inequalities below are reversed since the first popped value is the righthand side of the expression
            case 63: // li
                this.stack.pushInt(this.stack.popInt() >= this.stack.popInt());
                break;
            case 64: // lf
                this.stack.pushInt(this.stack.popFloat() >= this.stack.popFloat());
                break;
            case 65: // leqi
                this.stack.pushInt(this.stack.popInt() > this.stack.popInt());
                break;
            case 66: // leqf
                this.stack.pushInt(this.stack.popFloat() > this.stack.popFloat());
                break;
            case 67: // gi
                this.stack.pushInt(this.stack.popInt() <= this.stack.popInt());
                break;
            case 68: // gf
                this.stack.pushInt(this.stack.popFloat() <= this.stack.popFloat());
                break;
            case 69: // geqi
                this.stack.pushInt(this.stack.popInt() < this.stack.popInt());
                break;
            case 70: // geqf
                this.stack.pushInt(this.stack.popFloat() < this.stack.popFloat());
                break;
            case 71: // noti
                this.stack.pushInt(!this.stack.popInt());
                break;
            case 72: // notf
                this.stack.pushInt(!this.stack.popFloat());
                break;
            case 73: { // or
                let v1 = this.stack.popInt(), v2 = this.stack.popInt();
                this.stack.pushInt(v1 || v2);
                break;
            }
            case 74: { // and
                let v1 = this.stack.popInt(), v2 = this.stack.popInt();
                this.stack.pushInt(v1 && v2);
                break;
            }
            case 75: // xor
                this.stack.pushInt(this.stack.popInt() ^ this.stack.popInt());
                break;
            case 76: // bor
                this.stack.pushInt(this.stack.popInt() | this.stack.popInt());
                break;
            case 77: // band
                this.stack.pushInt(this.stack.popInt() & this.stack.popInt());
                break;
            case 78: {// pushDec (-- operator)
                let addr = this.getAddressOfIntArg(instr, 0);
                let val = this.getVar(addr);
                this.stack.pushInt(val);
                this.writeVar(addr, val - 1);
                break;
            }
            case 79: // sin
                this.stack.pushFloat(Math.sin(this.stack.popFloat()));
                break;
            case 80: // cos
                this.stack.pushFloat(Math.cos(this.stack.popFloat()));
                break;
            case 81: { // mathCirclePos
                let x = this.getAddressOfFloatArg(instr, 0);
                let y = this.getAddressOfFloatArg(instr, 1);
                let ang = this.getFloatArg(instr, 2);
                let rad = this.getFloatArg(instr, 3);
                this.writeVar(x, Math.cos(ang)*rad);
                this.writeVar(y, Math.sin(ang)*rad);
                break;
            }
            case 82: { // validRad
                let addr = this.getAddressOfFloatArg(instr, 0);
                let val = this.getVar(addr);
                console.log(val);
                while(val >= Math.PI)
                    val -= Math.PI*2;
                while(val <= -Math.PI)
                    val += Math.PI*2;
                this.writeVar(addr, val);
                break;
            }
            case 83: // negi
                this.stack.pushInt(-this.stack.popInt());
                break;
            case 84: // negf
                this.stack.pushFloat(-this.stack.popFloat());
                break;
            case 85:
            case 86: { // squareSum/squareSumRoot
                let addr = this.getAddressOfFloatArg(instr, 0);
                let x = this.getFloatArg(instr, 1), y = this.getFloatArg(instr, 2);
                let sum = x*x + y*y;
                if (instr.id == 86)
                    sum = Math.sqrt(sum);
                this.writeVar(addr, sum);
                break;
            }
            case 87: {  // mathAngle
                let addr = this.getAddressOfFloatArg(instr, 0);
                let x1 = this.getFloatArg(instr, 1), y1 = this.getFloatArg(instr, 2);
                let x2 = this.getFloatArg(instr, 3), y2 = this.getFloatArg(instr, 4);
                this.writeVar(addr, Math.atan2(y2 - y1, x2 - x1));
                break;
            }
            case 88: // sqrt
                this.stack.pushFloat(Math.sqrt(this.stack.popFloat()));
                break;
            case 89: // linearFunc
                this.writeVar(this.getAddressOfFloatArg(instr, 0), this.getFloatArg(instr, 1) * this.getFloatArg(instr, 2));
                break;
            case 90: { // pointRotate
                let var1 = this.getAddressOfFloatArg(instr, 0), var2 = this.getAddressOfFloatArg(instr, 1);
                let x = this.getFloatArg(instr, 2), y = this.getFloatArg(instr, 3);
                let ang = -this.getFloatArg(instr, 4); // TODO: check which way the game actually rotates
                let cos = Math.cos(ang), sin = Math.sin(ang);
                this.writeVar(var1, (cos * x) + (sin * y));
                this.writeVar(var2, (cos * y) - (sin * x));
                break;
            }
            case 91:
            case 92:
            case 93:
                this.ecl.out(`unimplemented opcode ${instr.id}: it's unclear how it works exactly`);
                break;
            default:
                this.ecl.out(`unknown opcode ${instr.id}`);
        }
        this.stack.ptr -= instr.popCnt*2;
        }
        if (!noInc)
            this.offset += instr.size;

        return 1;
    }
}
