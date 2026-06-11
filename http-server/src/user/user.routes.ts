import { HttpRouter, HttpServerRequest, HttpServerResponse } from "@effect/platform";
import { Effect, Schema } from "effect";
import { CreateUserInput } from "./user.model.js";
import { UserService } from "./user.service.js";

const UserPathParams = Schema.Struct({
  id: Schema.String,
});

const UserEmailPathParams = Schema.Struct({
  email: Schema.String,
});

const notFound = (id: string) =>
  HttpServerResponse.json(
    {
      message: `User ${id} not found`,
    },
    {
      status: 404,
    },
  );

const hasPassword = (body: unknown): boolean => typeof body === "object" && body !== null && "password" in body;

export const userRoutes = HttpRouter.empty.pipe(
  HttpRouter.get(
    "/",
    Effect.gen(function* () {
      const users = yield* Effect.promise(() => UserService.findAll());

      return yield* HttpServerResponse.json({
        data: users,
      });
    }),
  ),

  HttpRouter.get(
    "/by-email/:email",
    Effect.gen(function* () {
      const { email } = yield* HttpRouter.schemaPathParams(UserEmailPathParams);
      const user = yield* Effect.promise(() => UserService.findByEmail(email));

      if (user === undefined) {
        return yield* notFound(email);
      }

      return yield* HttpServerResponse.json({
        data: user,
      });
    }),
  ),

  HttpRouter.get(
    "/:id",
    Effect.gen(function* () {
      const { id } = yield* HttpRouter.schemaPathParams(UserPathParams);
      const user = yield* Effect.promise(() => UserService.findById(id));

      if (user === undefined) {
        return yield* notFound(id);
      }

      return yield* HttpServerResponse.json({
        data: user,
      });
    }),
  ),

  HttpRouter.post(
    "/",
    Effect.gen(function* () {
      const request = yield* HttpServerRequest.HttpServerRequest;
      const body = yield* request.json;

      if (hasPassword(body)) {
        return yield* HttpServerResponse.json(
          {
            message: "Use /usecase/users to create a user with authentication",
          },
          {
            status: 400,
          },
        );
      }

      const input = yield* Schema.decodeUnknown(CreateUserInput)(body);
      const user = yield* Effect.promise(() => UserService.create(input));

      return yield* HttpServerResponse.json(
        {
          data: user,
        },
        {
          status: 201,
        },
      );
    }),
  ),

  HttpRouter.del(
    "/:id",
    Effect.gen(function* () {
      const { id } = yield* HttpRouter.schemaPathParams(UserPathParams);
      const deleted = yield* Effect.promise(() => UserService.deleteById(id));

      if (!deleted) {
        return yield* notFound(id);
      }

      return HttpServerResponse.empty({
        status: 204,
      });
    }),
  ),
);
