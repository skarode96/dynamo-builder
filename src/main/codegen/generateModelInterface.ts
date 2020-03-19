import { Model, ModelSet } from "./types"

export function generateModelInterfaces(
  models: ModelSet
): { code: string[]; imports: string[] } {
  const code: string[] = []
  const imports: string[] = []

  models.forEach(m => {
    const generatedInterface = generateModelInterface(m)
    code.push(generatedInterface.code)
    generatedInterface.imports.forEach(_ => imports.push(_))
  })

  return {
    code,
    imports
  }
}

function generateModelInterface(
  model: Model
): { code: string; imports: string[] } {
  const fields: string[] = []
  const imports: string[] = []

  Object.entries(model.fields).forEach(([name, type]) => {
    const generatedField = generateField(name, type)
    fields.push(generatedField.code)
    generatedField.imports.forEach(_ => imports.push(_))
  })

  const code = `
    export interface ${model.name} extends Model {
        model: ModelType.${model.name}
        ${fields.join("\n")}
      }`

  return { code, imports }
}

function generateField(
  name: string,
  typeName: string
): { code: string; imports: string[] } {
  const parts = typeName.split("/")
  if (parts.length > 1) {
    const existingTypeName = parts[parts.length - 1]
    return {
      code: `${name}: ${existingTypeName}`,
      imports: [`import { ${existingTypeName} } from "${typeName}"`]
    }
  } else {
    return { code: `${name}: ${typeName}`, imports: [] }
  }
}
