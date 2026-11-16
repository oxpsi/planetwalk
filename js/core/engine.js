// Registry of named procedural sub-generators.

export class ProcEngine {
  constructor() {
    this._gens = new Map();
  }

  register(name, gen) {
    if (this._gens.has(name)) throw new Error(`ProcEngine: generator "${name}" already registered`);
    this._gens.set(name, gen);
  }

  has(name) {
    return this._gens.has(name);
  }

  generate(name, params) {
    const gen = this._gens.get(name);
    if (!gen) throw new Error(`ProcEngine: unknown generator "${name}"`);
    return gen.generate(params);
  }
}
