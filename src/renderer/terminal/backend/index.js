let wasm;

let cachedUint8ArrayMemory0 = null;

function getUint8ArrayMemory0() {
    if (cachedUint8ArrayMemory0 === null || cachedUint8ArrayMemory0.byteLength === 0) {
        cachedUint8ArrayMemory0 = new Uint8Array(wasm.memory.buffer);
    }
    return cachedUint8ArrayMemory0;
}

let cachedTextDecoder = new TextDecoder('utf-8', { ignoreBOM: true, fatal: true });

cachedTextDecoder.decode();

const MAX_SAFARI_DECODE_BYTES = 2146435072;
let numBytesDecoded = 0;
function decodeText(ptr, len) {
    numBytesDecoded += len;
    if (numBytesDecoded >= MAX_SAFARI_DECODE_BYTES) {
        cachedTextDecoder = new TextDecoder('utf-8', { ignoreBOM: true, fatal: true });
        cachedTextDecoder.decode();
        numBytesDecoded = len;
    }
    return cachedTextDecoder.decode(getUint8ArrayMemory0().subarray(ptr, ptr + len));
}

function getStringFromWasm0(ptr, len) {
    ptr = ptr >>> 0;
    return decodeText(ptr, len);
}

const BackendFinalization = (typeof FinalizationRegistry === 'undefined')
    ? { register: () => {}, unregister: () => {} }
    : new FinalizationRegistry(ptr => wasm.__wbg_backend_free(ptr >>> 0, 1));

export class Backend {

    static __wrap(ptr) {
        ptr = ptr >>> 0;
        const obj = Object.create(Backend.prototype);
        obj.__wbg_ptr = ptr;
        BackendFinalization.register(obj, obj.__wbg_ptr, obj);
        return obj;
    }

    __destroy_into_raw() {
        const ptr = this.__wbg_ptr;
        this.__wbg_ptr = 0;
        BackendFinalization.unregister(this);
        return ptr;
    }

    free() {
        const ptr = this.__destroy_into_raw();
        wasm.__wbg_backend_free(ptr, 0);
    }
    /**
     * @param {number} ch
     * @param {number} ch1
     * @param {number} fg
     * @param {number} bg
     */
    stroke(ch, ch1, fg, bg) {
        wasm.backend_stroke(this.__wbg_ptr, ch, ch1, fg, bg);
    }
    /**
     * @param {number} ch
     * @param {number} ch1
     * @param {number} fg
     * @param {number} bg
     */
    fill(ch, ch1, fg, bg) {
        wasm.backend_fill(this.__wbg_ptr, ch, ch1, fg, bg);
    }
    /**
     * @param {number} ch
     * @param {number} ch1
     * @param {number} fg
     * @param {number} bg
     */
    background(ch, ch1, fg, bg) {
        wasm.backend_background(this.__wbg_ptr, ch, ch1, fg, bg);
    }
    noStroke() {
        wasm.backend_noStroke(this.__wbg_ptr);
    }
    noFill() {
        wasm.backend_noFill(this.__wbg_ptr);
    }
    /**
     * @returns {number}
     */
    render() {
        const ret = wasm.backend_render(this.__wbg_ptr);
        return ret >>> 0;
    }
    /**
     * @param {number} x
     * @param {number} y
     */
    translate(x, y) {
        wasm.backend_translate(this.__wbg_ptr, x, y);
    }
    /**
     * @param {number} x
     * @param {number} y
     */
    scale(x, y) {
        wasm.backend_scale(this.__wbg_ptr, x, y);
    }
    /**
     * @param {number} rad
     */
    rotate(rad) {
        wasm.backend_rotate(this.__wbg_ptr, rad);
    }
    pushMatrix() {
        wasm.backend_pushMatrix(this.__wbg_ptr);
    }
    popMatrix() {
        wasm.backend_popMatrix(this.__wbg_ptr);
    }
    /**
     * @param {number} x
     * @param {number} y
     * @returns {number}
     */
    transform(x, y) {
        const ret = wasm.backend_transform(this.__wbg_ptr, x, y);
        return ret >>> 0;
    }
    /**
     * @param {number} cols
     * @param {number} rows
     * @returns {Backend}
     */
    static new(cols, rows) {
        const ret = wasm.backend_new(cols, rows);
        return Backend.__wrap(ret);
    }
    clear() {
        wasm.backend_clear(this.__wbg_ptr);
    }
    /**
     * @param {number} x
     * @param {number} y
     */
    point(x, y) {
        wasm.backend_point(this.__wbg_ptr, x, y);
    }
    /**
     * @param {number} x
     * @param {number} y
     * @param {number} x1
     * @param {number} y1
     */
    line(x, y, x1, y1) {
        wasm.backend_line(this.__wbg_ptr, x, y, x1, y1);
    }
    /**
     * @param {number} x
     * @param {number} y
     * @param {number} width
     * @param {number} height
     */
    rect(x, y, width, height) {
        wasm.backend_rect(this.__wbg_ptr, x, y, width, height);
    }
}
if (Symbol.dispose) Backend.prototype[Symbol.dispose] = Backend.prototype.free;

const EXPECTED_RESPONSE_TYPES = new Set(['basic', 'cors', 'default']);

async function __wbg_load(module, imports) {
    if (typeof Response === 'function' && module instanceof Response) {
        if (typeof WebAssembly.instantiateStreaming === 'function') {
            try {
                return await WebAssembly.instantiateStreaming(module, imports);

            } catch (e) {
                const validResponse = module.ok && EXPECTED_RESPONSE_TYPES.has(module.type);

                if (validResponse && module.headers.get('Content-Type') !== 'application/wasm') {
                    console.warn("`WebAssembly.instantiateStreaming` failed because your server does not serve Wasm with `application/wasm` MIME type. Falling back to `WebAssembly.instantiate` which is slower. Original error:\n", e);

                } else {
                    throw e;
                }
            }
        }

        const bytes = await module.arrayBuffer();
        return await WebAssembly.instantiate(bytes, imports);

    } else {
        const instance = await WebAssembly.instantiate(module, imports);

        if (instance instanceof WebAssembly.Instance) {
            return { instance, module };

        } else {
            return instance;
        }
    }
}

function __wbg_get_imports() {
    const imports = {};
    imports.wbg = {};
    imports.wbg.__wbg___wbindgen_throw_b855445ff6a94295 = function(arg0, arg1) {
        throw new Error(getStringFromWasm0(arg0, arg1));
    };
    imports.wbg.__wbindgen_init_externref_table = function() {
        const table = wasm.__wbindgen_externrefs;
        const offset = table.grow(4);
        table.set(0, undefined);
        table.set(offset + 0, undefined);
        table.set(offset + 1, null);
        table.set(offset + 2, true);
        table.set(offset + 3, false);
        ;
    };

    return imports;
}

function __wbg_finalize_init(instance, module) {
    wasm = instance.exports;
    __wbg_init.__wbindgen_wasm_module = module;
    cachedUint8ArrayMemory0 = null;


    wasm.__wbindgen_start();
    return wasm;
}

function initSync(module) {
    if (wasm !== undefined) return wasm;


    if (typeof module !== 'undefined') {
        if (Object.getPrototypeOf(module) === Object.prototype) {
            ({module} = module)
        } else {
            console.warn('using deprecated parameters for `initSync()`; pass a single object instead')
        }
    }

    const imports = __wbg_get_imports();

    if (!(module instanceof WebAssembly.Module)) {
        module = new WebAssembly.Module(module);
    }

    const instance = new WebAssembly.Instance(module, imports);

    return __wbg_finalize_init(instance, module);
}

async function __wbg_init(module_or_path) {
    if (wasm !== undefined) return wasm;


    if (typeof module_or_path !== 'undefined') {
        if (Object.getPrototypeOf(module_or_path) === Object.prototype) {
            ({module_or_path} = module_or_path)
        } else {
            console.warn('using deprecated parameters for the initialization function; pass a single object instead')
        }
    }

    if (typeof module_or_path === 'undefined') {
        module_or_path = new URL('index_bg.wasm', import.meta.url);
    }
    const imports = __wbg_get_imports();

    if (typeof module_or_path === 'string' || (typeof Request === 'function' && module_or_path instanceof Request) || (typeof URL === 'function' && module_or_path instanceof URL)) {
        module_or_path = fetch(module_or_path);
    }

    const { instance, module } = await __wbg_load(await module_or_path, imports);

    return __wbg_finalize_init(instance, module);
}

export { initSync };
export default __wbg_init;
