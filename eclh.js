const INT32_MAX = 2147483647;

const SCPT = 1414546259; // actually char magic[4]
const ANIM = 1296649793;
const ECLI = 1229734725;
const ECLH = 1212957509;

const DIFF_E = 1;
const DIFF_N = 1 << 1;
const DIFF_H = 1 << 2;
const DIFF_L = 1 << 3;
const DIFF_EX = 1 << 4;
const DIFF_O = 1 << 5;
const DIFF_WE = 1 << 6;
const DIFF_WN = 1 << 7;

const INT = "i".charCodeAt(0);
const FLOAT = "f".charCodeAt(0);

const CAST_II = 26985;
const CAST_FF = 26214;
const CAST_IF = 26217;
const CAST_FI = 26982;

const ECL_HEADER = [
    "uint32", "magic",
    "uint16", "one",
    "uint16", "includeLength",
    "uint32", "includeOffset",
    "uint32", "zero1",
    "uint32", "subCount",
    "arr", "zero2", "uint32", 4 // uint32 zero2[4]
] 

const INCLUDE_HEADER = [
    "uint32", "magic",
    "uint32", "cnt"
]

const SUB_HEADER = [
    "uint32", "magic",
    "uint32", "dataOffset",
    "arr", "zero", "uint32", 2
]

/*uint32_t time;
    uint16_t id;
    uint16_t size;
    uint16_t param_mask;
    * The rank bitmask.
     *   1111LHNE
     * Bits mean: easy, normal, hard, lunatic. The rest are always set to 1. *
    uint8_t rank_mask;
    * There doesn't seem to be a way of telling how many parameters there are
     * from the additional data. *
    uint8_t param_count;
    * From TH13 on, this field stores the number of current stack references
     * in the parameter list. *
    uint32_t zero;
    unsigned char data[];*/

const INSTR = [
    "uint32", "time",
    "uint16", "id",
    "uint16", "size",
    "uint16", "paramMask",
    "uint8", "rankMask",
    "uint8", "paramCnt",
    "uint32", "popCnt"
]

const SIZEOF_INSTR = 4 + 2 + 2 + 2 + 1 + 1 + 4;

function strcmp(str1, str2) {
    if (str1 < str2)
        return -1;
    if (str1 > str2)
        return 1;
    return 0;
}
