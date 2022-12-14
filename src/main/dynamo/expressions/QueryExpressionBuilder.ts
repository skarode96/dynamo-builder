import { KeysOf } from "../../typeUtils"
import { TaggedModel } from "../types"
import { Attributes } from "./Attributes"
import { Variables } from "./Variables"
import { DynamoDBExpression } from "./DynamoDBExpression"

export type Operator = "=" | "<>" | "<" | "<=" | ">" | ">="

/** Builds and executes parameters for a DynamoDB Query operation */
export class QueryExpressionBuilder<T extends TaggedModel> {
  private statements: string[] = []
  private attributeNames = new Attributes()
  private attributeValues = new Variables()

  where(attribute: KeysOf<T>, operator: Operator, value: any): this {
    this.addCondition({ attribute, operator, value })
    return this
  }

  or(attribute: KeysOf<T>, operator: Operator, value: any): this {
    this.addCondition({ attribute, operator, value, booleanOperator: "OR" })
    return this
  }

  and(attribute: KeysOf<T>, operator: Operator, value: any): this {
    this.addCondition({ attribute, operator, value, booleanOperator: "AND" })
    return this
  }

  andBetween(attribute: KeysOf<T>, start: any, end: any): this {
    this.addBetweenCondition({attribute, start, end})
    return this
  }

  attributeExists(name: KeysOf<T>): this {
    const placeholder = this.addAttributeName(name)
    this.addStatement(`attribute_exists(${placeholder})`)
    return this
  }

  attributeNotExists(name: KeysOf<T>): this {
    const placeholder = this.addAttributeName(name)
    this.addStatement(`attribute_not_exists(${placeholder})`)
    return this
  }

  orAttributeExists(name: KeysOf<T>): this {
    const placeholder = this.addAttributeName(name)
    this.addStatement(`OR attribute_exists(${placeholder})`)
    return this
  }

  orAttributeNotExists(name: KeysOf<T>): this {
    const placeholder = this.addAttributeName(name)
    this.addStatement(`OR attribute_not_exists(${placeholder})`)
    return this
  }

  andAttributeExists(name: KeysOf<T>): this {
    const placeholder = this.addAttributeName(name)
    this.addStatement(`AND attribute_exists(${placeholder})`)
    return this
  }

  andAttributeNotExists(name: KeysOf<T>): this {
    const placeholder = this.addAttributeName(name)
    this.addStatement(`AND attribute_not_exists(${placeholder})`)
    return this
  }

  build(): DynamoDBExpression {
    const expression = this.statements.join(" ")
    const attributeNames = this.attributeNames.getSubstitutions()
    const attributeValues = this.attributeValues.getSubstitutions()

    return {
      expression,
      attributeNames,
      attributeValues
    }
  }

  protected addAttributeName(name: string): string {
    return this.attributeNames.add(name)
  }
  protected addAttributeValue(value: any): string {
    return this.attributeValues.add(value)
  }

  protected addStatement(statement: string): void {
    this.statements.push(statement)
  }

  private addCondition(params: {
    attribute: string
    value: any
    operator: Operator
    booleanOperator?: "OR" | "AND"
  }): void {
    const attributePlaceholder = this.addAttributeName(params.attribute)
    const valuePlaceholder = this.addAttributeValue(params.value)
    const expression = []

    if (params.booleanOperator !== undefined) {
      expression.push(params.booleanOperator)
    }

    expression.push(attributePlaceholder, params.operator, valuePlaceholder)
    this.addStatement(expression.join(" "))
  }

  private addBetweenCondition(params: {
    attribute: string
    start: any,
    end: any,
  }): void {
    const attributePlaceholder = this.addAttributeName(params.attribute)
    const startValuePlaceholder = this.addAttributeValue(params.start)
    const endValuePlaceholder = this.addAttributeValue(params.end)
    const expression = []
    expression.push("AND", attributePlaceholder, "BETWEEN", startValuePlaceholder, "AND", endValuePlaceholder)
    this.addStatement(expression.join(" "))
  }
}
