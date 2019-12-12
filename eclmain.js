class ECL {
    constructor() {
        this.files = {};
        this.vms = [];
        this.out = Function.prototype;
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
    start() {
        let [offset, file] = this.findSub("main");
        let vm = new ECLVM(file, offset, this, null);
        this.vms.push(vm);
        this.run();
    }
    frame() {
        if (this.vms.length == 0)
            this.out("All VMs finished execution");
        else for (let i=0; i<this.vms.length; ++i) {
            const vm = this.vms[i];
            if (vm.delete || !vm.frame()) {
                this.vms.splice(i--, 1);
            }
        }
    }
    async run() {
        while(1) {
            this.frame();
            await new Promise(resolve => {
                setTimeout(resolve, 1000/60);
            });
        }
    }
}
