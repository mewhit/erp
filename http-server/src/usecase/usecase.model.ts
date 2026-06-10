import { Schema } from "effect"
import {
  CreateCustomerInput,
  Customer
} from "../customer/customer.model.js"
import { CustomerWorkOrder } from "../customer-work-order/customer-work-order.model.js"
import { OrganizationCustomer } from "../organization-customer/organization-customer.model.js"
import { WorkOrderItem } from "../work-order-item/work-order-item.model.js"
import { WorkOrder } from "../work-order/work-order.model.js"

export const AddUserUserInput = Schema.Struct({
  name: Schema.String,
  email: Schema.String,
  password: Schema.String
})

export const AddUserInput = Schema.Struct({
  user: AddUserUserInput,
  organizationId: Schema.String,
  roleId: Schema.String
})

export type AddUserInput = typeof AddUserInput.Type

export const AddCustomerInput = Schema.Struct({
  customer: CreateCustomerInput,
  organizationId: Schema.String
})

export type AddCustomerInput = typeof AddCustomerInput.Type

export const AddWorkOrderToCustomerWorkOrderInput = Schema.Struct({
  organizationId: Schema.String,
  number: Schema.String,
  title: Schema.String,
  description: Schema.String,
  status: Schema.String
})

export type AddWorkOrderToCustomerWorkOrderInput =
  typeof AddWorkOrderToCustomerWorkOrderInput.Type

export const AddWorkOrderToCustomerInput = Schema.Struct({
  customerId: Schema.String,
  workOrder: AddWorkOrderToCustomerWorkOrderInput
})

export type AddWorkOrderToCustomerInput =
  typeof AddWorkOrderToCustomerInput.Type

export const AddWorkOrderItemInput = Schema.Struct({
  itemId: Schema.String,
  description: Schema.String,
  quantity: Schema.Number,
  unitPriceCents: Schema.Number
})

export type AddWorkOrderItemInput = typeof AddWorkOrderItemInput.Type

export const RemoveWorkOrderItemInput = Schema.Struct({
  workOrderItemId: Schema.String,
  quantity: Schema.Number
})

export type RemoveWorkOrderItemInput = typeof RemoveWorkOrderItemInput.Type

export const SetWorkOrderItemQuantityInput = Schema.Struct({
  workOrderItemId: Schema.String,
  quantity: Schema.Number
})

export type SetWorkOrderItemQuantityInput =
  typeof SetWorkOrderItemQuantityInput.Type

export const SetWorkOrderStatusInput = Schema.Struct({
  status: Schema.String
})

export type SetWorkOrderStatusInput = typeof SetWorkOrderStatusInput.Type

export const AddUserUser = Schema.Struct({
  id: Schema.String,
  name: Schema.String,
  email: Schema.String,
  createdAt: Schema.String
})

export type AddUserUser = typeof AddUserUser.Type

export const AddUserOrganizationUserRole = Schema.Struct({
  id: Schema.String,
  organizationId: Schema.String,
  userId: Schema.String,
  roleId: Schema.String,
  createdAt: Schema.String
})

export type AddUserOrganizationUserRole =
  typeof AddUserOrganizationUserRole.Type

export const AddCustomerResult = Schema.Struct({
  customer: Customer,
  organizationCustomer: OrganizationCustomer
})

export type AddCustomerResult = typeof AddCustomerResult.Type

export const AddWorkOrderToCustomerResult = Schema.Struct({
  workOrder: WorkOrder,
  customerWorkOrder: CustomerWorkOrder
})

export type AddWorkOrderToCustomerResult =
  typeof AddWorkOrderToCustomerResult.Type

export const AddWorkOrderItemResult = WorkOrderItem

export type AddWorkOrderItemResult = typeof AddWorkOrderItemResult.Type

export const RemoveWorkOrderItemResult = Schema.Struct({
  workOrderItemId: Schema.String,
  removed: Schema.Boolean,
  remainingQuantity: Schema.Number
})

export type RemoveWorkOrderItemResult =
  typeof RemoveWorkOrderItemResult.Type

export const SetWorkOrderItemQuantityResult = Schema.Struct({
  workOrderItemId: Schema.String,
  removed: Schema.Boolean,
  quantity: Schema.Number
})

export type SetWorkOrderItemQuantityResult =
  typeof SetWorkOrderItemQuantityResult.Type

export const SetWorkOrderStatusResult = WorkOrder

export type SetWorkOrderStatusResult = typeof SetWorkOrderStatusResult.Type

export const AddUserResult = Schema.Struct({
  user: AddUserUser,
  organizationUserRole: AddUserOrganizationUserRole
})

export type AddUserResult = typeof AddUserResult.Type
