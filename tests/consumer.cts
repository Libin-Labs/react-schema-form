import api = require('../dist/cjs/index.js');
const fields: api.SchemaField[] = [{ name: 'name', type: 'text' }];
const props: api.SchemaFormProps = { fields, value: {}, onChange: (value) => console.log(value) };
void [api.getSafePath, api.parseSafePath, api.SchemaForm, api.setSafePath, api.validateForm, props];
