import * as React from 'react';

export type SchemaValue =
  string | number | boolean | null | SchemaValue[] | { [key: string]: SchemaValue };
export type FieldKind = 'text' | 'number' | 'boolean' | 'select';
export interface SchemaField {
  name: string;
  label?: string;
  type: FieldKind;
  required?: boolean;
  min?: number;
  max?: number;
  pattern?: string;
  options?: readonly { label: string; value: string }[];
  validate?: (
    value: SchemaValue | undefined,
    values: Record<string, SchemaValue>,
  ) => string | undefined;
}
export type FormValues = Record<string, SchemaValue>;
export type FormErrors = Record<string, string>;
export type FieldRendererProps = {
  field: SchemaField;
  value: SchemaValue | undefined;
  error?: string;
  onChange: (value: SchemaValue) => void;
};
export type FieldRenderers = Partial<
  Record<FieldKind, (props: FieldRendererProps) => React.ReactNode>
>;

const forbidden = new Set(['__proto__', 'prototype', 'constructor']);
export function parseSafePath(path: string): string[] {
  const parts = path.split('.');
  if (!path || parts.some((part) => !part || forbidden.has(part)))
    throw new Error(`Unsafe or empty field path: ${path}`);
  return parts;
}
export function getSafePath(values: FormValues, path: string): SchemaValue | undefined {
  let current: unknown = values;
  for (const part of parseSafePath(path)) {
    if (
      !current ||
      typeof current !== 'object' ||
      !Object.prototype.hasOwnProperty.call(current, part)
    )
      return undefined;
    current = (current as Record<string, unknown>)[part];
  }
  return current as SchemaValue | undefined;
}
export function setSafePath(values: FormValues, path: string, value: SchemaValue): FormValues {
  const parts = parseSafePath(path);
  const output = structuredClone(values);
  let cursor: Record<string, unknown> = output;
  for (const part of parts.slice(0, -1)) {
    const child = cursor[part];
    if (
      child !== undefined &&
      (child === null || typeof child !== 'object' || Array.isArray(child))
    ) {
      throw new Error(`Cannot write through non-object path segment: ${part}`);
    }
    if (child === undefined) cursor[part] = Object.create(null) as Record<string, unknown>;
    cursor = cursor[part] as Record<string, unknown>;
  }
  cursor[parts[parts.length - 1]] = value;
  return output;
}
export function validateForm(fields: readonly SchemaField[], values: FormValues): FormErrors {
  const errors: FormErrors = {};
  const names = new Set<string>();
  for (const field of fields) {
    parseSafePath(field.name);
    if (names.has(field.name)) throw new Error(`Duplicate field name: ${field.name}`);
    names.add(field.name);
    const value = getSafePath(values, field.name);
    let message: string | undefined;
    if (field.required && (value === undefined || value === null || value === ''))
      message = 'This field is required.';
    else if (
      typeof value === 'number' &&
      ((field.min !== undefined && value < field.min) ||
        (field.max !== undefined && value > field.max))
    )
      message = `Value must be between ${field.min ?? '-infinity'} and ${field.max ?? 'infinity'}.`;
    else if (
      typeof value === 'string' &&
      field.pattern &&
      value &&
      !new RegExp(field.pattern).test(value)
    )
      message = 'Value has an invalid format.';
    else if (
      field.type === 'select' &&
      value !== undefined &&
      !field.options?.some((option) => option.value === value)
    )
      message = 'Choose a listed option.';
    errors[field.name] = field.validate?.(value, values) ?? message ?? '';
    if (!errors[field.name]) delete errors[field.name];
  }
  return errors;
}

export interface SchemaFormProps {
  fields: readonly SchemaField[];
  value: FormValues;
  onChange: (value: FormValues) => void;
  onSubmit?: (value: FormValues) => void;
  renderers?: FieldRenderers;
  className?: string;
  id?: string;
}
export function SchemaForm({
  fields,
  value,
  onChange,
  onSubmit,
  renderers,
  className,
  id,
}: SchemaFormProps): React.ReactElement {
  const errors = validateForm(fields, value);
  return (
    <form
      className={className ?? 'lp-schema-form'}
      id={id}
      noValidate
      onSubmit={(event) => {
        event.preventDefault();
        const nextErrors = validateForm(fields, value);
        if (Object.keys(nextErrors).length === 0) onSubmit?.(value);
      }}
    >
      {fields.map((field) => {
        const current = getSafePath(value, field.name);
        const error = errors[field.name];
        const change = (next: SchemaValue) => onChange(setSafePath(value, field.name, next));
        const custom = renderers?.[field.type];
        const common = { field, value: current, error, onChange: change };
        return (
          <div key={field.name} className="lp-schema-form__field">
            <label htmlFor={`${id ?? 'schema-form'}-${field.name}`}>
              {field.label ?? field.name}
            </label>
            {custom ? (
              custom(common)
            ) : field.type === 'select' ? (
              <select
                id={`${id ?? 'schema-form'}-${field.name}`}
                value={typeof current === 'string' ? current : ''}
                onChange={(event) => change(event.target.value)}
                aria-invalid={Boolean(error)}
                aria-describedby={error ? `${field.name}-error` : undefined}
              >
                <option value="">Select...</option>
                {field.options?.map((option) => (
                  <option key={option.value} value={option.value}>
                    {option.label}
                  </option>
                ))}
              </select>
            ) : (
              <input
                id={`${id ?? 'schema-form'}-${field.name}`}
                type={
                  field.type === 'boolean'
                    ? 'checkbox'
                    : field.type === 'number'
                      ? 'number'
                      : 'text'
                }
                checked={field.type === 'boolean' ? Boolean(current) : undefined}
                value={
                  field.type === 'boolean'
                    ? undefined
                    : current === undefined || current === null
                      ? ''
                      : String(current)
                }
                min={field.min}
                max={field.max}
                pattern={field.pattern}
                required={field.required}
                aria-invalid={Boolean(error)}
                aria-describedby={error ? `${field.name}-error` : undefined}
                onChange={(event) =>
                  change(
                    field.type === 'boolean'
                      ? event.target.checked
                      : field.type === 'number'
                        ? event.target.value === ''
                          ? null
                          : Number(event.target.value)
                        : event.target.value,
                  )
                }
              />
            )}
            {error && (
              <span id={`${field.name}-error`} role="alert">
                {error}
              </span>
            )}
          </div>
        );
      })}
      {onSubmit && <button type="submit">Submit</button>}
    </form>
  );
}
