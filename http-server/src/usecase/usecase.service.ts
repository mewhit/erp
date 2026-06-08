import { Data, Effect, Schema } from "effect"
import { createApiClient } from "../shared/api-client/index.js"
import {
  AddUserOrganizationUserRole,
  AddUserUser,
  type AddUserInput,
  type AddUserResult
} from "./usecase.model.js"

class AddUserUseCaseError extends Data.TaggedError("AddUserUseCaseError")<{
  phase: "create-user" | "assign-organization-role" | "parse-response"
  message: string
  status?: number
}> {}

const UserResponse = Schema.Struct({
  data: AddUserUser
})

const OrganizationUserRoleResponse = Schema.Struct({
  data: AddUserOrganizationUserRole
})

const getErrorMessage = (error: unknown): string =>
  error instanceof Error ? error.message : "Unexpected usecase failure"

const usecaseApiClient = createApiClient({
  baseUrl: process.env.USECASE_API_BASE_URL
})

const mapApiClientError = (
  phase: "create-user" | "assign-organization-role",
  error: { message: string; status?: number }
) =>
  new AddUserUseCaseError({
    phase,
    message: error.message,
    status: error.status
  })

export const UsecaseService = {
  addUser: (input: AddUserInput): Effect.Effect<AddUserResult, AddUserUseCaseError> =>
    Effect.gen(function* () {
      const userResponse = yield* usecaseApiClient.user.post(input.user).pipe(
        Effect.mapError((error) => mapApiClientError("create-user", error)),
        Effect.flatMap((body) =>
          Schema.decodeUnknown(UserResponse)(body).pipe(
            Effect.mapError(
              (error) =>
                new AddUserUseCaseError({
                  phase: "parse-response",
                  message: getErrorMessage(error)
                })
            )
          )
        )
      )

      const organizationUserRoleResponse = yield* usecaseApiClient.organizationUserRole
        .post({
          organizationId: input.organizationId,
          userId: userResponse.data.id,
          roleId: input.roleId
        })
        .pipe(
          Effect.mapError((error) =>
            mapApiClientError("assign-organization-role", error)
          ),
          Effect.flatMap((body) =>
            Schema.decodeUnknown(OrganizationUserRoleResponse)(body).pipe(
              Effect.mapError(
                (error) =>
                  new AddUserUseCaseError({
                    phase: "parse-response",
                    message: getErrorMessage(error)
                  })
              )
            )
          )
        )

      return {
        user: userResponse.data,
        organizationUserRole: organizationUserRoleResponse.data
      }
    })
}
