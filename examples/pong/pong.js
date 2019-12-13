(async function() {
    class InputGetter {
        constructor(mapping) {
            this.mapping = mapping;
            this.state = 0;
            document.addEventListener("keydown", e => this.keyDown(e));
            document.addEventListener("keyup", e => this.keyUp(e));
        }
        get() {
            return this.state;
        }
        keyDown(e) {
            const ind = this.mapping.indexOf(e.key);
            if (ind > -1)
                this.state |= 1 << ind;
        }
        keyUp(e) {
            const ind = this.mapping.indexOf(e.key);
            if (ind > -1)
                this.state &= ~(1 << ind);
        }
    }

    const input = new InputGetter(["ArrowLeft", "ArrowRight", "a", "d"]);

    const ctx = document.querySelector("#pong").getContext("2d");

    const ID_P1 = 0;
    const ID_P2 = 1;
    const ID_BALL = 2;

    const entityList = [null, null, null];

    class SimpleEntity {
        constructor(x, y, w, h, id) {
            this.x = x;
            this.y = y;
            this.w = w;
            this.h = h;
            this.id = id;
        }
        draw(ctx) {
            ctx.fillStyle = "white";
            ctx.fillRect(this.x + 196 - this.w/2, this.y - this.h/2, this.w, this.h);
        }
    }

    const res = await fetch("pong.ecl");
    const file = await res.arrayBuffer();

    const ecl = new ECL();
    ecl.setOutput(console.log);
    ecl.load("pong.ecl", file);

    ecl.addIns((vm, instr) => {
        switch(instr.id) {
            case 300: {
                let offset = vm.getIntArg(instr, 0);
                let name = vm.getCstringArg(instr, 0);
                let id = vm.getIntArg(instr, 5, offset);
                let ent = new SimpleEntity(
                    vm.getFloatArg(instr, 1, offset),
                    vm.getFloatArg(instr, 2, offset),
                    vm.getFloatArg(instr, 3, offset),
                    vm.getFloatArg(instr, 4, offset),
                    id
                );
                entityList[id] = ent;
                ecl.create(name, ent);
                break;
            }
            case 400:
                vm.host.x = vm.getFloatArg(instr, 0);
                vm.host.y = vm.getFloatArg(instr, 1);
                break;
            case 801: {
                let id = vm.getIntArg(instr, 2);
                vm.writeVar(vm.getAddressOfFloatArg(instr, 0), entityList[id].x);
                vm.writeVar(vm.getAddressOfFloatArg(instr, 1), entityList[id].y);
                break;
            }
            case 803: {
                let id = vm.getIntArg(instr, 2);
                vm.writeVar(vm.getAddressOfFloatArg(instr, 0), entityList[id].w);
                vm.writeVar(vm.getAddressOfFloatArg(instr, 1), entityList[id].h);
                break;
            }
            case 1000: {
                ctx.fillStyle = "black";
                ctx.fillRect(0, 0, 396, 448);
                for (let i=0; i<entityList.length; ++i)
                    entityList[i].draw(ctx);
                break;
            }
            default:
                return 0;
        }
        return 1;
    });
    ecl.addVar((vm, id) => {
        switch(id) {
            case -10001:
                return input.get();
            case -10000:
                return Math.random()*0x7FFFFFFF;
            case -9997:
                return vm.host.x;
            case -9996:
                return vm.host.y;
            case -9995:
                return vm.host.w;
            case -9994:
                return vm.host.h;
            case -9914:
                return vm.host.id;
            default:
                return null;
        }
    }, (vm, id, val) => {
        // no writable vars
        return 0;
    });

    ecl.create("main", null);
    ecl.run();
})();