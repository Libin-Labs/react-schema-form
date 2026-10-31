import {
  getSafePath,
  parseSafePath,
  SchemaForm,
  setSafePath,
  validateForm,
  type SchemaField,
  type SchemaFormProps,
} from '../dist/esm/index.js';
const fields: SchemaField[] = [{ name: 'profile.name', type: 'text', required: true }];
const props: SchemaFormProps = { fields, value: {}, onChange: (value) => console.log(value) };
void [getSafePath, parseSafePath, SchemaForm, setSafePath, validateForm, props];
