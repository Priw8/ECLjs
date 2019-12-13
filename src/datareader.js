class DataReader {
    constructor(buffer, littleEndian=true) {
        if (!(buffer instanceof ArrayBuffer)) {
            throw "DataReader: first parameter is not a buffer";
        }
        this.littleEndian = littleEndian;
        this.view = new DataView(buffer);
        this.offset = 0;

        this.cache = {
            uint8: [],
            int8: [],
            uint16: [],
            int16: [],
            uint32: [],
            int32: [],
            float: [],
            cstring: []
        }
    }
    getOffset() {
        return this.offset;
    }
    setOffset(offset) {
        this.offset = offset;
    }
    incOffset(offset) {
        this.offset += offset;
    }
    uint8() {
        let ret = typeof this.cache.uint8[this.offset] != "undefined" ? this.cache.uint8[this.offset] : this.cache.uint8[this.offset] = this.view.getUint8(this.offset);
        ++this.offset;
        return ret;
    }
    int8() {
        let ret = typeof this.cache.int8[this.offset] != "undefined" ? this.cache.int8[this.offset] : this.cache.int8[this.offset] = this.view.getInt8(this.offset);
        ++this.offset;
        return ret;
    }
    uint16() {
        let ret = typeof this.cache.uint16[this.offset] != "undefined" ? this.cache.uint16[this.offset] : this.cache.uint16[this.offset] = this.view.getUint16(this.offset, this.littleEndian);
        this.offset += 2;
        return ret;
    }
    int16() {
        let ret = typeof this.cache.int16[this.offset] != "undefined" ? this.cache.int16[this.offset] : this.cache.int16[this.offset] = this.view.getInt16(this.offset, this.littleEndian);
        this.offset += 2;
        return ret;
    }
    uint32() {
        let ret = typeof this.cache.uint32[this.offset] != "undefined" ? this.cache.uint32[this.offset] : this.cache.uint32[this.offset] = this.view.getUint32(this.offset, this.littleEndian);
        this.offset += 4;
        return ret;
    }
    int32() {
        let ret = typeof this.cache.int32[this.offset] != "undefined" ? this.cache.int32[this.offset] : this.cache.int32[this.offset] = this.view.getInt32(this.offset, this.littleEndian);
        this.offset += 4;
        return ret;
    }
    float() {
        let ret = typeof this.cache.float[this.offset] != "undefined" ? this.cache.float[this.offset] : this.cache.float[this.offset] = this.view.getFloat32(this.offset, this.littleEndian);
        this.offset += 4;
        return ret;
    }
    cstring() {
        // in a low-level language, you'd obviously just use pointers to the strings in the buffer itself
        if (typeof this.cache.cstring[this.offset] != "undefined") {
            let ret = this.cache.cstring[this.offset];
            this.offset += ret.length + 1;
            return ret;
        }

        let ret = "";
        let char;
        while(char = this.uint8())
            ret += String.fromCharCode(char);
        
        this.cache.cstring[this.offset - ret.length - 1] = ret;
        return ret;
    }
    struct(struct) {
        let ret = {};
        for (let i=0; i<struct.length; i+=2) {
            const type = struct[i];
            const name = struct[i+1];
            if (type != "arr") {
                ret[name] = this[type]();
            } else {
                const innerType = struct[i+2];
                const cnt = struct[i+3];
                ret[name] = new Array(cnt);
                for (let j=0; j<cnt; ++j)
                    ret[name][j] = this[innerType]();
                
                i += 2;
            }
        }
        return ret;
    }
    align(alignment) {
        this.offset = (this.offset + (alignment - 1)) & ~(alignment - 1);
    }
}
