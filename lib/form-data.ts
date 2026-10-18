function readRaw(formData: FormData, name: string): string | undefined {
  const value = formData.get(name);
  return typeof value === "string" ? value : undefined;
}

export function textField(formData: FormData, name: string): string {
  return readRaw(formData, name) ?? "";
}

export function optionalTextField(
  formData: FormData,
  name: string,
): string | undefined {
  const value = readRaw(formData, name);
  return value === undefined || value.trim() === "" ? undefined : value;
}

export function checkboxField(formData: FormData, name: string): boolean {
  return formData.get(name) === "on";
}
