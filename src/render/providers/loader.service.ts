import {Injectable} from '@angular/core';
import {IVisualization, IParameter} from '../../common/models';
import {CanvasService} from './canvas.service';
import {SKQW_CORE_MODULE_NAME, SKQW_UTILS_MODULE_NAME} from '../../common/constants';
import {skqwUtils} from '../modules/skqw-utils';
import {createCoreModule} from '../modules/skqw-core';
import {Context} from 'vm';

const path = require('path');
const fs = require('fs');
const vm = require('vm');
// Webpack patches the native Node require, so we need to use this instead.
const nativeRequire = (<any> global).require;

@Injectable()
export class Loader {

    private library: {
        name: string;
        path: string;
        // TODO: implement a hash for use in presets etc.
        hash?: string;
    }[] = [];
    private visPath: string = path.join(__dirname, 'library');

    constructor(private canvasService: CanvasService) {}

    /**
     * Set the path where the visualizations are located.
     */
    setPath(absolutePath: string) {
        // TODO: enable as additional scripts path
        // this.visPath = absolutePath;
    }


    /**
     * Load all visualizations which reside in the folder specified by setPath().
     * Visualizations should reside in their own folders, with the main entry point
     * named `index.js`.
     */
    loadAll() {
        const isDir = p => fs.statSync(path.join(this.visPath, p)).isDirectory();
        const hasIndex = p => fs.statSync(path.join(this.visPath, p, 'index.js')).isFile();
        const isVisObject = v => v && v.name && v.init && v.tick;
        this.library = [];

        fs.readdirSync(this.visPath).forEach(p => {
            try {
                if (!isDir(p) || !hasIndex(p)) {
                    return;
                }
                let visPath = path.join(this.visPath, p);
                let vis = createSandbox(this.canvasService).run(visPath);
                if (isVisObject(vis)) {
                    // TODO: check for duplicate names and error if found.
                    this.library.push({
                        name: vis.name,
                        path: visPath
                    });
                }
            } catch (e) {
                console.error(`Failed to load index.js in folder "${p}":`);
                console.error(e);
            }
        });
    }

    /**
     * Get a list of the names and ids of all loaded visualizations.
     */
    listAll(): { id: number, name: string }[] {
        return this.library.map((v, i) => ({ id: i, name: v.name }));
    }

    /**
     * Returns a visualization object given by the id (the index in the library array)
     */
    getVisualization(id: number, debugMode: boolean = false): IVisualization {
        if (0 <= id && id < this.library.length) {
            let vis = createSandbox(this.canvasService, debugMode).run(this.library[id].path);
            return this.normalizeParams(vis);
        }
    }

    /**
     * Ensure the parameters contain the expected data, and clone the object to eliminate
     * references when the user changes params.
     */
    private normalizeParams(vis: IVisualization): IVisualization {
        const params = Object.assign({}, vis.params);
        for(let paramName in params) {
            if (params.hasOwnProperty(paramName)) {
                params[paramName] = this.normalizeParam(params[paramName]);
            }
        }
        vis.params = params;
        return vis;
    }

    private normalizeParam(param: IParameter): IParameter {

        if (param.type === 'range') {
            if (param.min === undefined) {
                param.min = 0;
            }
            if (param.max === undefined) {
                param.max = Math.round(<number>param.value * 2);
            }
            if (param.step === undefined) {
                param.step = 1;
            }
        }
        return param;
    }
}

/**
 * When we run a visualization script, we do not want to give that script access to same execution context as that
 * of the app itself. Therefore we run the script in a sandbox, which provides a limited set of global methods and
 * objects.
 */
export function createSandbox(canvasService: CanvasService, debugMode: boolean = false): { run: (filepath: string) => IVisualization; } {

    return {
        run(visPath: string): IVisualization {
            // return runInGlobalContext(canvasService, visPath);
            // This is the safer mode to run in, but is buggy.
            return runInVmSandbox(canvasService, visPath, debugMode);
        }
    };
}

/**
 * Runs the visualization script in a new Node vm context, to prevent scripts from polluting the global app scope.
 *
 * When debugMode === true, scripts are run the the app context (not in a sandbox) because it is not possible to use
 * the Chrome devtools to debug scripts in another context (see https://github.com/electron/electron/issues/7816).
 *
 * TODO: currently not possible to run in new context, see https://github.com/electron/electron/issues/7814
 */
function runInVmSandbox(canvasService: CanvasService, visPath: string, debugMode: boolean = false): IVisualization {
    let filename = path.join(visPath, 'index.js');
    let options = {
        filename,
        timeout: 5000
    };

    let sandbox: Context;
    if (!debugMode) {
        const noop = () => {};
        sandbox = vm.createContext({
            console: {
                log: noop,
                warn: noop,
                error: noop,
                info: noop
            },
        });
    }

    let customRequire = (moduleName) => {
        if (isBuiltInModule(moduleName)) {
            console.warn(`Cannot require module "${moduleName}" from a visualization script. Access denied.`)
        } else if (moduleName === SKQW_UTILS_MODULE_NAME) {
            return skqwUtils;
        } else if (moduleName === SKQW_CORE_MODULE_NAME) {
            return createCoreModule(canvasService, visPath, sandbox);
        } else {
            return nativeRequire(path.join(visPath, moduleName));
        }
    };
    let script = fs.readFileSync(filename).toString();
    let wrapped = moduleWrap(script);
    let dirname = path.dirname(filename);
    let module: any = { exports: {} };

    let compiledWrapper: any;
    // TODO: try to enable this again once https://github.com/electron/electron/pull/7909 is merged
    // if (debugMode) {
        compiledWrapper = vm.runInThisContext(wrapped, options);
    // } else {
    //    compiledWrapper = vm.runInContext(wrapped, sandbox, options);
    //}
    let args = [module.exports, customRequire, module, filename, dirname];

    compiledWrapper.apply(this, args);
    return module.exports;
}

function moduleWrap(script: string): string {
    let prefix = '(function (exports, require, module, __filename, __dirname) { ';
    let suffix = '\n});';
    return `${prefix} ${script} ${suffix}`;
}

/**
 * Returns true is the module is a built-in, e.g. "path" or "fs".
 */
function isBuiltInModule(name: string): boolean {
    let isBuiltIn: boolean;
    try {
        isBuiltIn = nativeRequire.resolve(name).indexOf('/') <= 0;
    } catch (e) {
        isBuiltIn = false;
    }
    return isBuiltIn;
}

