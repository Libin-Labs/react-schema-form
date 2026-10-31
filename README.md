# @lp-labs/react-schema-form

A controlled React form for a deliberately small, documented schema: text, number, boolean, and select fields. Nested values use safe dot paths. Validation runs during rendering and again on submit; submitting never bypasses validation.

## Example

```tsx
import { SchemaForm, type SchemaField, type FormValues } from "@lp-labs/react-schema-form";
import "@lp-labs/react-schema-form/styles.css";

const fields: SchemaField[] = [
  { name: "profile.name", label: "Name", type: "text", required: true },
  { name: "age", type: "number", min: 0, max: 130 },
  { name: "active", type: "boolean" },
  { name: "role", type: "select", options: [{ label: "Reader", value: "reader" }] },
];
function ProfileForm() {
  const [value, setValue] = React.useState<FormValues>({});
  return <SchemaForm fields={fields} value={value} onChange={setValue} onSubmit={(valid) => console.log(valid)} />;
}
```

## React API

`SchemaForm` accepts `SchemaFormProps`: `fields` (required readonly `SchemaField[]`), `value` (required controlled `FormValues`), `onChange` (required callback receiving a new immutable top-level form object), optional `onSubmit` (called with the current values only when `validateForm` has no errors), optional `renderers`, `className`, and `id`. Default class is `lp-schema-form`; default generated form id prefix is `schema-form`. Fields render labels, native controls, and `role="alert"` validation text. The field type selects the control. Browser-native constraint attributes are hints; this package's own rules determine submit eligibility.

`SchemaField` has `name`, optional `label`, `type` (`text | number | boolean | select`), optional `required`, numeric `min`/`max`, string `pattern` (JavaScript regular expression source), select `options`, and optional `validate(value, values)`. Custom `validate` returns an error string or `undefined`; a returned string takes precedence over built-in errors. Options are `{label, value}` strings. For select, a nonempty value must match an option.

`FieldRenderers` maps any field type to a renderer called with `{field, value, error, onChange}`. Return a React node; call `onChange` with the field value. Custom renderers are responsible for associating accessible labels and error text. `SchemaFormProps` is the complete component prop type. `FormValues` is a string-keyed record of JSON-like `SchemaValue` values; `SchemaValue` is string, number, boolean, null, arrays, or string-keyed objects. `FormErrors` is a string-keyed error map. `FieldKind`, `FieldRendererProps`, and `FieldRenderers` are exported types.

## Helpers

- `parseSafePath(path: string): string[]` splits dot notation. Empty paths/segments and `__proto__`, `prototype`, or `constructor` segments throw `Error`.
- `getSafePath(values: FormValues, path: string): SchemaValue | undefined` reads only own properties. Missing paths return `undefined`.
- `setSafePath(values: FormValues, path: string, value: SchemaValue): FormValues` clones the input and writes a nested value; rejects unsafe paths or traversing through scalars/arrays. It never mutates the input.
- `validateForm(fields: readonly SchemaField[], values: FormValues): FormErrors` validates required, numeric bounds, pattern, select membership, then custom validators. Successful fields are absent from the returned map. Unsafe and duplicate field names throw; an invalid regex pattern propagates `SyntaxError`.

## Behavior and limits

This is not a JSON Schema implementation. It does not interpret conditional schemas, arrays of fields, async validation, coercion, or HTML-form submission serialization. Number controls produce numbers or `null` for cleared input; select and text produce strings; booleans produce booleans. Path syntax is dot-only (no escaping or bracket notation), so property names cannot contain dots. Custom validators should be pure and fast. Inputs use native labels and error announcements; custom controls must preserve equivalent keyboard and screen-reader access. Avoid treating client validation as server-side validation.

React is the sole runtime peer. Both ESM and CommonJS builds include TypeScript declarations. CSS is optional.

## License

[MIT](./LICENSE).

## Support

If this library is useful to you, consider supporting its maintenance with a [donation via PayPal](https://www.paypal.me/LibinPrasanth).

## Author

Created by [Libin Prasanth](https://www.linkedin.com/in/libinprasanth/). Connect on LinkedIn for updates and discussion.
