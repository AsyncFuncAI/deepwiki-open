"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || function (mod) {
    if (mod && mod.__esModule) return mod;
    var result = {};
    if (mod != null) for (var k in mod) if (k !== "default" && Object.prototype.hasOwnProperty.call(mod, k)) __createBinding(result, mod, k);
    __setModuleDefault(result, mod);
    return result;
};
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.getLatestVersion = exports.getDependencies = exports.detectYarn = void 0;
const path = __importStar(require("path"));
const fs = __importStar(require("fs"));
const cp = __importStar(require("child_process"));
const parse_semver_1 = __importDefault(require("parse-semver"));
const util_1 = require("./util");
const exists = (file) => fs.promises.stat(file).then(_ => true, _ => false);
function parseStdout({ stdout }) {
    return stdout.split(/[\r\n]/).filter(line => !!line)[0];
}
function exec(command, options = {}, cancellationToken) {
    return new Promise((c, e) => {
        let disposeCancellationListener = null;
        const child = cp.exec(command, { ...options, encoding: 'utf8' }, (err, stdout, stderr) => {
            if (disposeCancellationListener) {
                disposeCancellationListener();
                disposeCancellationListener = null;
            }
            if (err) {
                return e(err);
            }
            c({ stdout, stderr });
        });
        if (cancellationToken) {
            disposeCancellationListener = cancellationToken.subscribe((err) => {
                child.kill();
                e(err);
            });
        }
    });
}
async function checkNPM(cancellationToken) {
    const { stdout } = await exec('npm -v', {}, cancellationToken);
    const version = stdout.trim();
    if (/^3\.7\.[0123]$/.test(version)) {
        throw new Error(`npm@${version} doesn't work with vsce. Please update npm: npm install -g npm`);
    }
}
function getNpmDependencies(cwd) {
    return checkNPM()
        .then(() => exec('npm list --production --parseable --depth=99999 --loglevel=error', { cwd, maxBuffer: 5000 * 1024 }))
        .then(({ stdout }) => stdout.split(/[\r\n]/).filter(dir => path.isAbsolute(dir)));
}
function asYarnDependency(prefix, tree, prune) {
    if (prune && /@[\^~]/.test(tree.name)) {
        return null;
    }
    let name;
    try {
        const parseResult = (0, parse_semver_1.default)(tree.name);
        name = parseResult.name;
    }
    catch (err) {
        name = tree.name.replace(/^([^@+])@.*$/, '$1');
    }
    const dependencyPath = path.join(prefix, name);
    const children = [];
    for (const child of tree.children || []) {
        const dep = asYarnDependency(path.join(prefix, name, 'node_modules'), child, prune);
        if (dep) {
            children.push(dep);
        }
    }
    return { name, path: dependencyPath, children };
}
function selectYarnDependencies(deps, packagedDependencies) {
    const index = new (class {
        constructor() {
            this.data = Object.create(null);
            for (const dep of deps) {
                if (this.data[dep.name]) {
                    throw Error(`Dependency seen more than once: ${dep.name}`);
                }
                this.data[dep.name] = dep;
            }
        }
        find(name) {
            let result = this.data[name];
            if (!result) {
                throw new Error(`Could not find dependency: ${name}`);
            }
            return result;
        }
    })();
    const reached = new (class {
        constructor() {
            this.values = [];
        }
        add(dep) {
            if (this.values.indexOf(dep) < 0) {
                this.values.push(dep);
                return true;
            }
            return false;
        }
    })();
    const visit = (name) => {
        let dep = index.find(name);
        if (!reached.add(dep)) {
            // already seen -> done
            return;
        }
        for (const child of dep.children) {
            visit(child.name);
        }
    };
    packagedDependencies.forEach(visit);
    return reached.values;
}
async function getYarnProductionDependencies(cwd, packagedDependencies) {
    const raw = await new Promise((c, e) => cp.exec('yarn list --prod --json', { cwd, encoding: 'utf8', env: { DISABLE_V8_COMPILE_CACHE: "1", ...process.env }, maxBuffer: 5000 * 1024 }, (err, stdout) => (err ? e(err) : c(stdout))));
    const match = /^{"type":"tree".*$/m.exec(raw);
    if (!match || match.length !== 1) {
        throw new Error('Could not parse result of `yarn list --json`');
    }
    const usingPackagedDependencies = Array.isArray(packagedDependencies);
    const trees = JSON.parse(match[0]).data.trees;
    let result = trees
        .map(tree => asYarnDependency(path.join(cwd, 'node_modules'), tree, !usingPackagedDependencies))
        .filter(util_1.nonnull);
    if (usingPackagedDependencies) {
        result = selectYarnDependencies(result, packagedDependencies);
    }
    return result;
}
async function getYarnDependencies(cwd, packagedDependencies) {
    const result = new Set([cwd]);
    const deps = await getYarnProductionDependencies(cwd, packagedDependencies);
    const flatten = (dep) => {
        result.add(dep.path);
        dep.children.forEach(flatten);
    };
    deps.forEach(flatten);
    return [...result];
}
async function detectYarn(cwd) {
    for (const name of ['yarn.lock', '.yarnrc', '.yarnrc.yaml', '.pnp.cjs', '.yarn']) {
        if (await exists(path.join(cwd, name))) {
            if (!process.env['VSCE_TESTS']) {
                util_1.log.info(`Detected presence of ${name}. Using 'yarn' instead of 'npm' (to override this pass '--no-yarn' on the command line).`);
            }
            return true;
        }
    }
    return false;
}
exports.detectYarn = detectYarn;
async function getDependencies(cwd, dependencies, packagedDependencies) {
    if (dependencies === 'none') {
        return [cwd];
    }
    else if (dependencies === 'yarn' || (dependencies === undefined && (await detectYarn(cwd)))) {
        return await getYarnDependencies(cwd, packagedDependencies);
    }
    else {
        return await getNpmDependencies(cwd);
    }
}
exports.getDependencies = getDependencies;
function getLatestVersion(name, cancellationToken) {
    return checkNPM(cancellationToken)
        .then(() => exec(`npm show ${name} version`, {}, cancellationToken))
        .then(parseStdout);
}
exports.getLatestVersion = getLatestVersion;
//# sourceMappingURL=npm.js.map