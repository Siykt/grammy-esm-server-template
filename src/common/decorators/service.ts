import type { BindingScope } from 'inversify'
import { injectable } from 'inversify'

const registeredServices: NewableFunction[] = []

export function Service(scope?: BindingScope): ClassDecorator {
  return (target: unknown) => {
    injectable(scope)(target as NewableFunction)
    registeredServices.push(target as NewableFunction)
  }
}

export function getRegisteredServices(): NewableFunction[] {
  return [...registeredServices]
}
