import { HttpMiddleware, HttpRouter, HttpServer, HttpServerResponse } from "@effect/platform"
import { NodeHttpServer, NodeRuntime } from "@effect/platform-node"
import { Config, Layer } from "effect"
import { createServer } from "node:http"
import { authRoutes } from "./auth/index.js"
import { itemRoutes } from "./item/index.js"
import { organizationUserRoleRoutes } from "./organization-user-role/index.js"
import { organizationRoutes } from "./organization/index.js"
import { roleRoutes } from "./role/index.js"
import { usecaseRoutes } from "./usecase/index.js"
import { userRoutes } from "./user/index.js"

const routes = HttpRouter.empty.pipe(
  HttpRouter.get(
    "/health-check",
    HttpServerResponse.json({
      status: "ok"
    })
  ),
  HttpRouter.mount("/auth", authRoutes),
  HttpRouter.mount("/items", itemRoutes),
  HttpRouter.mount("/organizations", organizationRoutes),
  HttpRouter.mount("/organization-user-roles", organizationUserRoleRoutes),
  HttpRouter.mount("/roles", roleRoutes),
  HttpRouter.mount("/usecases", usecaseRoutes),
  HttpRouter.mount("/users", userRoutes)
)

const ServerLive = NodeHttpServer.layerConfig(() => createServer(), {
  port: Config.integer("PORT").pipe(Config.withDefault(3000))
})

const AppLive = routes.pipe(
  HttpServer.serve((app) =>
    HttpMiddleware.logger(
      HttpMiddleware.cors({
        allowedHeaders: ["Content-Type", "Authorization"]
      })(app)
    )
  ),
  HttpServer.withLogAddress
)

NodeRuntime.runMain(Layer.launch(Layer.provide(AppLive, ServerLive)))
