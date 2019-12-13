class ECLfile {
    constructor(buffer, name, ecl) {
        this.ecl = ecl;
        this.name = name;
        this.reader = new DataReader(buffer);
        
        const header = this.reader.struct(ECL_HEADER);
        // console.log("header", header);

        if (header.magic != SCPT)
            ecl.out(`Invalid SCPT magic in ECL file ${name}`);

        this.reader.setOffset(header.includeOffset);

        const animHeader = this.reader.struct(INCLUDE_HEADER);
        if (animHeader.magic != ANIM)
            ecl.out(`Invalid ANIM magic in ECL file ${name}`);
        
        this.anim = new Array(animHeader.cnt);
        for (let i=0; i<animHeader.cnt; ++i) {
            this.anim[i] = this.reader.cstring();
        }
        // console.log("anim", this.anim);

        this.reader.align(4);
        const ecliHeader = this.reader.struct(INCLUDE_HEADER);
        if (ecliHeader.magic != ECLI)
            ecl.out(`Invalid ECLI magic in ECL file ${name}`);

        this.ecli = new Array(ecliHeader.cnt);
        for (let i=0; i<ecliHeader.cnt; ++i) {
            this.ecli[i] = this.reader.cstring();
        }
        // console.log("ecli", this.ecli);

        this.reader.setOffset(header.includeOffset + header.includeLength);
        this.subOffsets = new Array(header.subCount);
        for (let i=0; i<header.subCount; ++i) {
            this.subOffsets[i] = this.reader.uint32();
        }
        
        this.subNames = new Array(header.subCount);
        for (let i=0; i<header.subCount; ++i) {
            this.subNames[i] = this.reader.cstring();
        }

        // console.log("sub_names", this.subNames);
        // console.log(this);
    }
    /* Returns offset of the given sub, or 0 if sub is not found */
    findSub(name) {
        /* Subs are sorted, so let's use binary search. */
        let begin = 0;
        let end = this.subNames.length;
        let current = Math.floor(end / 2);
        let res = strcmp(name, this.subNames[current]);
        while(res) {
            if (res < 0) {
                end = current;
            } else {
                begin = current;
            }
            if (end-1 == current && begin == current)
                return 0;
            
            current = begin + Math.floor((end - begin) / 2);
            res = strcmp(name, this.subNames[current]);
        }
        return this.subOffsets[current];
    }
}
