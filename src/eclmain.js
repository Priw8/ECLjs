class ECL {
    constructor() {
        this.files = {};
        this.vms = [];
        this.out = Function.prototype;
        this.extraIns = [];
        this.extraVarRead = [];
        this.extraVarWrite = [];
        this.rankMask = DIFF_L;
    }
    setOutput(fun) {
        this.out = fun;
    }
    setDiff(diffNum) {
        this.rankMask = 1 << diffNum;
    }
    load(name, buffer) {
        this.files[name] = new ECLfile(buffer, name, this);
    }
    addIns(fun) {
        this.extraIns.push(fun);
    }
    addVar(funRead, funWrite) {
        this.extraVarRead.push(funRead);
        this.extraVarWrite.push(funWrite);
    }
    findSub(name) {
        let offset = 0, file = null;
        for (let fname in this.files) {
            file = this.files[fname];
            offset = file.findSub(name);
            if (offset != 0)
                break;
        }
        return [offset, file];
    }
    create(sub, host) {
        let [offset, file] = this.findSub(sub);
        if (offset == 0) 
            this.out(`Error: unable to find sub ${sub}`);
            return null;
        else {
            let vm = new ECLVM(file, offset, this, null, host);
            this.vms.push(vm);
            return vm;
        }
    }
    frame() {
        for (let i=0; i<this.vms.length; ++i) {
            const vm = this.vms[i];
            if (vm.delete || !vm.frame()) {
                this.vms.splice(i--, 1);
            }
        }
    }
    async run() {
        while(1) {
            if (this.vms.length == 0) {
                this.out("All VMs finished execution");
                return;
            }
            this.frame();
            await new Promise(resolve => {
                setTimeout(resolve, 1000/60);
            });
        }
    }
}
