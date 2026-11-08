// JSON-schema validation of manifests and view contexts against Omniscope's published schema.
const Ajv = require('ajv');
const schema = relax(JSON.parse(JSON.stringify(require('./schema/customview-schema.json'))));
// The published schema dates from 2018 and is stricter than the live server: the real context
// has extra keys and nulls everywhere. Relax it: allow additional properties and nulls,
// and treat option item values as free-form. Required keys and non-null types are still checked.
function relax(o) {
  if (Array.isArray(o)) return o.map(relax);
  if (!o || typeof o !== 'object') return o;
  for (const k of Object.keys(o)) o[k] = relax(o[k]);
  if (o.additionalProperties === false) delete o.additionalProperties;
  if (typeof o.type === 'string' && o.type !== 'null') o.type = [o.type, 'null'];
  else if (Array.isArray(o.type) && !o.type.includes('null')) o.type = o.type.concat(['null']);
  if (Array.isArray(o.enum) && !o.enum.includes(null)) o.enum = o.enum.concat([null]);
  if (o.oneOf) { o.anyOf = o.oneOf.concat([{ type: 'null' }]); delete o.oneOf; }
  if (o.properties && o.properties.items && /items|option/i.test(o.properties.items.description || '')) o.properties.items = {};
  return o;
}
const ajv = new Ajv({ schemaId: 'auto', allErrors: true, unknownFormats: 'ignore', logger: false });
ajv.addMetaSchema(require('ajv/lib/refs/json-schema-draft-04.json'));
ajv.addSchema(schema, 'cv');
function check(defName, obj) {
  const v = ajv.getSchema('cv#/definitions/' + defName);
  const ok = v(obj);
  return { ok, errors: ok ? [] : v.errors.map(e => `${e.dataPath} ${e.message}${e.params && e.params.additionalProperty ? ' (' + e.params.additionalProperty + ')' : ''}`) };
}
module.exports = { manifest: m => check('CustomViewApi.ViewApiManifest', m), context: c => check('CustomViewApi.ViewApiContext', c) };
if (require.main === module) {
  const f = require('path').resolve(process.argv[3]);
  const o = require(f);
  console.log(JSON.stringify(module.exports[process.argv[2]](o.ctx || o), null, 1));
}
