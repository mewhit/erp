import { HttpMiddleware, HttpRouter, HttpServer, HttpServerResponse } from "@effect/platform"
import * as NodeHttpServer from "@effect/platform-node/NodeHttpServer"
import * as NodeRuntime from "@effect/platform-node/NodeRuntime"
import { Config, Layer } from "effect"
import { createServer } from "node:http"
import "./env.js"
import { authGuard, authPublicRoutes, authRoutes } from "./auth/index.js"
import { customerWorkOrderRoutes } from "./customer-work-order/index.js"
import { customerRoutes } from "./customer/index.js"
import { itemRoutes } from "./item/index.js"
import { organizationCustomerRoutes } from "./organization-customer/index.js"
import { organizationUserRoleRoutes } from "./organization-user-role/index.js"
import { organizationRoutes } from "./organization/index.js"
import { roleRoutes } from "./role/index.js"
import { usecaseRoutes } from "./usecase/index.js"
import { userRoutes } from "./user/index.js"
import { workOrderItemRoutes } from "./work-order-item/index.js"
import { workOrderRoutes } from "./work-order/index.js"

const server = createServer()

server.once("listening", () => {
  const address = server.address()
  const port =
    typeof address === "object" && address !== null
      ? address.port
      : process.env.PORT ?? "3000"

  console.log(`API server listening on port ${port}`)
  console.log("Health check path: /health-check")
})

const routes = HttpRouter.empty.pipe(
  HttpRouter.get(
    "/health-check",
    HttpServerResponse.json({
      status: "ok"
    })
  ),
  HttpRouter.mount("/auth", authRoutes),
  HttpRouter.mount("/customer-work-orders", customerWorkOrderRoutes),
  HttpRouter.mount("/customers", customerRoutes),
  HttpRouter.mount("/items", itemRoutes),
  HttpRouter.mount("/organization-customers", organizationCustomerRoutes),
  HttpRouter.mount("/organizations", organizationRoutes),
  HttpRouter.mount("/organization-user-roles", organizationUserRoleRoutes),
  HttpRouter.mount("/roles", roleRoutes),
  HttpRouter.mount("/usecase", usecaseRoutes),
  HttpRouter.mount("/usecases", usecaseRoutes),
  HttpRouter.mount("/users", userRoutes),
  HttpRouter.mount("/work-order-items", workOrderItemRoutes),
  HttpRouter.mount("/work-orders", workOrderRoutes),
  HttpRouter.use(authGuard),
  HttpRouter.mount("/auth", authPublicRoutes)
)

const ServerLive = NodeHttpServer.layerConfig(() => server, {
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
