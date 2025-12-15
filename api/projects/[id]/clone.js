"use strict";
var __create = Object.create;
var __defProp = Object.defineProperty;
var __getOwnPropDesc = Object.getOwnPropertyDescriptor;
var __getOwnPropNames = Object.getOwnPropertyNames;
var __getProtoOf = Object.getPrototypeOf;
var __hasOwnProp = Object.prototype.hasOwnProperty;
var __commonJS = (cb, mod) => function __require() {
  return mod || (0, cb[__getOwnPropNames(cb)[0]])((mod = { exports: {} }).exports, mod), mod.exports;
};
var __export = (target, all) => {
  for (var name in all)
    __defProp(target, name, { get: all[name], enumerable: true });
};
var __copyProps = (to, from, except, desc) => {
  if (from && typeof from === "object" || typeof from === "function") {
    for (let key of __getOwnPropNames(from))
      if (!__hasOwnProp.call(to, key) && key !== except)
        __defProp(to, key, { get: () => from[key], enumerable: !(desc = __getOwnPropDesc(from, key)) || desc.enumerable });
  }
  return to;
};
var __toESM = (mod, isNodeMode, target) => (target = mod != null ? __create(__getProtoOf(mod)) : {}, __copyProps(
  // If the importer is in node compatibility mode or this is not an ESM
  // file that has been converted to a CommonJS file using a Babel-
  // compatible transform (i.e. "__esModule" has not been set), then set
  // "default" to the CommonJS "module.exports" for node compatibility.
  isNodeMode || !mod || !mod.__esModule ? __defProp(target, "default", { value: mod, enumerable: true }) : target,
  mod
));
var __toCommonJS = (mod) => __copyProps(__defProp({}, "__esModule", { value: true }), mod);

// node_modules/.pnpm/@umijs+preset-umi@4.6.0_@types+node@24.10.1_@types+react@19.2.7_@types+webpack@5.28.5_e_45e44b04df2620249c5acb630348e8c2/node_modules/@umijs/preset-umi/dist/features/apiRoute/utils.js
var require_utils = __commonJS({
  "node_modules/.pnpm/@umijs+preset-umi@4.6.0_@types+node@24.10.1_@types+react@19.2.7_@types+webpack@5.28.5_e_45e44b04df2620249c5acb630348e8c2/node_modules/@umijs/preset-umi/dist/features/apiRoute/utils.js"(exports2, module2) {
    var __defProp2 = Object.defineProperty;
    var __getOwnPropDesc2 = Object.getOwnPropertyDescriptor;
    var __getOwnPropNames2 = Object.getOwnPropertyNames;
    var __hasOwnProp2 = Object.prototype.hasOwnProperty;
    var __export2 = (target, all) => {
      for (var name in all)
        __defProp2(target, name, { get: all[name], enumerable: true });
    };
    var __copyProps2 = (to, from, except, desc) => {
      if (from && typeof from === "object" || typeof from === "function") {
        for (let key of __getOwnPropNames2(from))
          if (!__hasOwnProp2.call(to, key) && key !== except)
            __defProp2(to, key, { get: () => from[key], enumerable: !(desc = __getOwnPropDesc2(from, key)) || desc.enumerable });
      }
      return to;
    };
    var __toCommonJS2 = (mod) => __copyProps2(__defProp2({}, "__esModule", { value: true }), mod);
    var utils_exports = {};
    __export2(utils_exports, {
      esbuildIgnorePathPrefixPlugin: () => esbuildIgnorePathPrefixPlugin,
      matchApiRoute: () => matchApiRoute2
    });
    module2.exports = __toCommonJS2(utils_exports);
    function esbuildIgnorePathPrefixPlugin() {
      return {
        name: "ignore-path-prefix",
        setup(build) {
          build.onResolve({ filter: /^@fs/ }, (args) => ({
            path: args.path.replace(/^@fs/, "")
          }));
        }
      };
    }
    function matchApiRoute2(apiRoutes2, path) {
      if (path.startsWith("/")) path = path.substring(1);
      if (path.startsWith("api/")) path = path.substring(4);
      const pathSegments = path.split("/").filter((p) => p !== "");
      if (pathSegments.length === 0 || pathSegments.length === 1 && pathSegments[0] === "api") {
        const route2 = apiRoutes2.find((r) => r.path === "/");
        if (route2) return { route: route2, params: {} };
        else return void 0;
      }
      const params = {};
      const route = apiRoutes2.find((route2) => {
        const routePathSegments = route2.path.split("/").filter((p) => p !== "");
        if (routePathSegments.length !== pathSegments.length) return false;
        for (let i = 0; i < routePathSegments.length; i++) {
          const routePathSegment = routePathSegments[i];
          if (routePathSegment.match(/^\[.*]$/)) {
            params[routePathSegment.substring(1, routePathSegment.length - 1)] = pathSegments[i];
            if (i == routePathSegments.length - 1) return true;
            continue;
          }
          if (routePathSegment !== pathSegments[i]) return false;
          if (i == routePathSegments.length - 1) return true;
        }
      });
      if (route) return { route, params };
    }
  }
});

// node_modules/.pnpm/@umijs+preset-umi@4.6.0_@types+node@24.10.1_@types+react@19.2.7_@types+webpack@5.28.5_e_45e44b04df2620249c5acb630348e8c2/node_modules/@umijs/preset-umi/dist/features/apiRoute/request.js
var require_request = __commonJS({
  "node_modules/.pnpm/@umijs+preset-umi@4.6.0_@types+node@24.10.1_@types+react@19.2.7_@types+webpack@5.28.5_e_45e44b04df2620249c5acb630348e8c2/node_modules/@umijs/preset-umi/dist/features/apiRoute/request.js"(exports2, module2) {
    var __defProp2 = Object.defineProperty;
    var __getOwnPropDesc2 = Object.getOwnPropertyDescriptor;
    var __getOwnPropNames2 = Object.getOwnPropertyNames;
    var __hasOwnProp2 = Object.prototype.hasOwnProperty;
    var __export2 = (target, all) => {
      for (var name in all)
        __defProp2(target, name, { get: all[name], enumerable: true });
    };
    var __copyProps2 = (to, from, except, desc) => {
      if (from && typeof from === "object" || typeof from === "function") {
        for (let key of __getOwnPropNames2(from))
          if (!__hasOwnProp2.call(to, key) && key !== except)
            __defProp2(to, key, { get: () => from[key], enumerable: !(desc = __getOwnPropDesc2(from, key)) || desc.enumerable });
      }
      return to;
    };
    var __toCommonJS2 = (mod) => __copyProps2(__defProp2({}, "__esModule", { value: true }), mod);
    var request_exports = {};
    __export2(request_exports, {
      default: () => request_default,
      parseMultipart: () => parseMultipart,
      parseUrlEncoded: () => parseUrlEncoded
    });
    module2.exports = __toCommonJS2(request_exports);
    var import_utils = require_utils();
    var UmiApiRequest3 = class {
      _req;
      _params = {};
      constructor(req, apiRoutes2) {
        this._req = req;
        const m = (0, import_utils.matchApiRoute)(apiRoutes2, this.pathName || "");
        if (m) this._params = m.params;
      }
      get params() {
        return this._params;
      }
      _body = null;
      get body() {
        return this._body;
      }
      get headers() {
        return this._req.headers;
      }
      get method() {
        return this._req.method;
      }
      get query() {
        var _a, _b;
        return ((_b = (_a = this._req.url) == null ? void 0 : _a.split("?")[1]) == null ? void 0 : _b.split("&").reduce((acc, cur) => {
          const [key, value] = cur.split("=");
          const k = acc[key];
          if (k) {
            if (k instanceof Array) {
              k.push(value);
            } else {
              acc[key] = [k, value];
            }
          } else {
            acc[key] = value;
          }
          return acc;
        }, {})) || {};
      }
      get cookies() {
        var _a;
        return (_a = this._req.headers.cookie) == null ? void 0 : _a.split(";").reduce((acc, cur) => {
          const [key, value] = cur.split("=");
          acc[key.trim()] = value;
          return acc;
        }, {});
      }
      get url() {
        return this._req.url;
      }
      get pathName() {
        var _a;
        return (_a = this._req.url) == null ? void 0 : _a.split("?")[0];
      }
      readBody() {
        if (this._req.headers["content-length"] === "0") {
          return Promise.resolve();
        }
        return new Promise((resolve, reject) => {
          let body = [];
          this._req.on("data", (chunk) => {
            body.push(chunk);
          });
          this._req.on("end", () => {
            var _a, _b;
            const bodyBuffer = Buffer.concat(body);
            switch ((_a = this._req.headers["content-type"]) == null ? void 0 : _a.split(";")[0]) {
              case "application/json":
                try {
                  this._body = JSON.parse(bodyBuffer.toString());
                } catch (e) {
                  this._body = body;
                }
                break;
              case "multipart/form-data":
                const boundary = (_b = this.headers["content-type"]) == null ? void 0 : _b.split("boundary=")[1];
                if (!boundary) {
                  this._body = body;
                  break;
                }
                this._body = parseMultipart(bodyBuffer, boundary);
                break;
              case "application/x-www-form-urlencoded":
                this._body = parseUrlEncoded(bodyBuffer.toString());
                break;
              default:
                this._body = body;
                break;
            }
            resolve();
          });
          this._req.on("error", reject);
        });
      }
    };
    function parseMultipart(body, boundary) {
      const hexBoundary = Buffer.from(`--${boundary}`, "utf-8").toString("hex");
      return body.toString("hex").split(hexBoundary).reduce((acc, cur) => {
        var _a, _b;
        const [hexMeta, hexValue] = cur.split(
          Buffer.from("\r\n\r\n").toString("hex")
        );
        const meta = Buffer.from(hexMeta, "hex").toString("utf-8");
        const name = (_a = meta.split('name="')[1]) == null ? void 0 : _a.split('"')[0];
        if (!name) return acc;
        const fileName = (_b = meta.split('filename="')[1]) == null ? void 0 : _b.split('"')[0];
        if (fileName) {
          const fileBufferBeforeTrim = Buffer.from(hexValue, "hex");
          const fileBuffer = fileBufferBeforeTrim.slice(
            0,
            fileBufferBeforeTrim.byteLength - 2
          );
          const contentType = meta.split("Content-Type: ")[1];
          acc[name] = {
            fileName,
            data: fileBuffer,
            contentType
          };
          return acc;
        }
        const valueBufferBeforeTrim = Buffer.from(hexValue, "hex");
        const valueBuffer = valueBufferBeforeTrim.slice(
          0,
          valueBufferBeforeTrim.byteLength - 2
        );
        acc[name] = valueBuffer.toString("utf-8");
        return acc;
      }, {});
    }
    function parseUrlEncoded(body) {
      return body.split("&").reduce((acc, cur) => {
        const [key, value] = cur.split("=");
        acc[key] = decodeURIComponent(value);
        return acc;
      }, {});
    }
    var request_default = UmiApiRequest3;
  }
});

// node_modules/.pnpm/@umijs+preset-umi@4.6.0_@types+node@24.10.1_@types+react@19.2.7_@types+webpack@5.28.5_e_45e44b04df2620249c5acb630348e8c2/node_modules/@umijs/preset-umi/dist/features/apiRoute/response.js
var require_response = __commonJS({
  "node_modules/.pnpm/@umijs+preset-umi@4.6.0_@types+node@24.10.1_@types+react@19.2.7_@types+webpack@5.28.5_e_45e44b04df2620249c5acb630348e8c2/node_modules/@umijs/preset-umi/dist/features/apiRoute/response.js"(exports2, module2) {
    var __defProp2 = Object.defineProperty;
    var __getOwnPropDesc2 = Object.getOwnPropertyDescriptor;
    var __getOwnPropNames2 = Object.getOwnPropertyNames;
    var __hasOwnProp2 = Object.prototype.hasOwnProperty;
    var __export2 = (target, all) => {
      for (var name in all)
        __defProp2(target, name, { get: all[name], enumerable: true });
    };
    var __copyProps2 = (to, from, except, desc) => {
      if (from && typeof from === "object" || typeof from === "function") {
        for (let key of __getOwnPropNames2(from))
          if (!__hasOwnProp2.call(to, key) && key !== except)
            __defProp2(to, key, { get: () => from[key], enumerable: !(desc = __getOwnPropDesc2(from, key)) || desc.enumerable });
      }
      return to;
    };
    var __toCommonJS2 = (mod) => __copyProps2(__defProp2({}, "__esModule", { value: true }), mod);
    var response_exports = {};
    __export2(response_exports, {
      default: () => response_default
    });
    module2.exports = __toCommonJS2(response_exports);
    var UmiApiResponse3 = class {
      _res;
      constructor(res) {
        this._res = res;
      }
      status(statusCode) {
        this._res.statusCode = statusCode;
        return this;
      }
      header(key, value) {
        this._res.setHeader(key, value);
        return this;
      }
      setCookie(key, value) {
        this._res.setHeader("Set-Cookie", `${key}=${value}; path=/`);
        return this;
      }
      end(data) {
        this._res.end(data);
        return this;
      }
      text(data) {
        this._res.setHeader("Content-Type", "text/plain; charset=utf-8");
        this._res.end(data);
        return this;
      }
      html(data) {
        this._res.setHeader("Content-Type", "text/html; charset=utf-8");
        this._res.end(data);
        return this;
      }
      json(data) {
        this._res.setHeader("Content-Type", "application/json");
        this._res.end(JSON.stringify(data));
        return this;
      }
    };
    var response_default = UmiApiResponse3;
  }
});

// node_modules/.pnpm/@umijs+preset-umi@4.6.0_@types+node@24.10.1_@types+react@19.2.7_@types+webpack@5.28.5_e_45e44b04df2620249c5acb630348e8c2/node_modules/@umijs/preset-umi/dist/features/apiRoute/index.js
var require_apiRoute = __commonJS({
  "node_modules/.pnpm/@umijs+preset-umi@4.6.0_@types+node@24.10.1_@types+react@19.2.7_@types+webpack@5.28.5_e_45e44b04df2620249c5acb630348e8c2/node_modules/@umijs/preset-umi/dist/features/apiRoute/index.js"(exports2, module2) {
    var __create2 = Object.create;
    var __defProp2 = Object.defineProperty;
    var __getOwnPropDesc2 = Object.getOwnPropertyDescriptor;
    var __getOwnPropNames2 = Object.getOwnPropertyNames;
    var __getProtoOf2 = Object.getPrototypeOf;
    var __hasOwnProp2 = Object.prototype.hasOwnProperty;
    var __export2 = (target, all) => {
      for (var name in all)
        __defProp2(target, name, { get: all[name], enumerable: true });
    };
    var __copyProps2 = (to, from, except, desc) => {
      if (from && typeof from === "object" || typeof from === "function") {
        for (let key of __getOwnPropNames2(from))
          if (!__hasOwnProp2.call(to, key) && key !== except)
            __defProp2(to, key, { get: () => from[key], enumerable: !(desc = __getOwnPropDesc2(from, key)) || desc.enumerable });
      }
      return to;
    };
    var __toESM2 = (mod, isNodeMode, target) => (target = mod != null ? __create2(__getProtoOf2(mod)) : {}, __copyProps2(
      // If the importer is in node compatibility mode or this is not an ESM
      // file that has been converted to a CommonJS file using a Babel-
      // compatible transform (i.e. "__esModule" has not been set), then set
      // "default" to the CommonJS "module.exports" for node compatibility.
      isNodeMode || !mod || !mod.__esModule ? __defProp2(target, "default", { value: mod, enumerable: true }) : target,
      mod
    ));
    var __toCommonJS2 = (mod) => __copyProps2(__defProp2({}, "__esModule", { value: true }), mod);
    var apiRoute_exports = {};
    __export2(apiRoute_exports, {
      UmiApiRequest: () => import_request.default,
      UmiApiResponse: () => import_response.default,
      matchApiRoute: () => import_utils.matchApiRoute
    });
    module2.exports = __toCommonJS2(apiRoute_exports);
    var import_request = __toESM2(require_request());
    var import_response = __toESM2(require_response());
    var import_utils = require_utils();
  }
});

// src/.umi-production/api/projects/[id]/clone.ts
var clone_exports = {};
__export(clone_exports, {
  default: () => clone_default2
});
module.exports = __toCommonJS(clone_exports);

// src/.umi-production/api/_middlewares.ts
var middlewares_default = async (req, res, next) => {
  next();
};

// lib/prisma.ts
var import_adapter_pg = require("@prisma/adapter-pg");
var import_config = require("dotenv/config");
var import_config2 = require("prisma/config");

// generated/prisma/internal/class.ts
var runtime = __toESM(require("@prisma/client/runtime/client"));
var config = {
  "previewFeatures": [],
  "clientVersion": "7.0.1",
  "engineVersion": "f09f2815f091dbba658cdcd2264306d88bb5bda6",
  "activeProvider": "postgresql",
  "inlineSchema": '// This is your Prisma schema file,\n// learn more about it in the docs: https://pris.ly/d/prisma-schema\n\ngenerator client {\n  provider     = "prisma-client"\n  output       = "../generated/prisma"\n  moduleFormat = "cjs"\n}\n\ndatasource db {\n  provider = "postgresql"\n}\n\n// ============================================================================\n// User Model\n// ============================================================================\n\nmodel User {\n  id        Int      @id @default(autoincrement())\n  email     String   @unique\n  name      String   @unique\n  avatar    String?\n  createdAt DateTime @default(now())\n  updatedAt DateTime @updatedAt\n\n  // One-to-Many: A user can own many projects\n  ownedProjects Project[] @relation("ProjectOwner")\n\n  // Many-to-Many: A user can be a member of many projects\n  memberProjects ProjectMember[]\n\n  // One-to-Many: A user can create many tasks\n  createdTasks Task[] @relation("TaskCreator")\n\n  // One-to-Many: A user can be assigned many tasks\n  assignedTasks Task[] @relation("TaskAssignee")\n\n  // One-to-Many: A user can write many comments\n  comments Comment[]\n}\n\n// ============================================================================\n// Project Model (One-to-Many with User, Many-to-Many with User via ProjectMember)\n// ============================================================================\n\nmodel Project {\n  id          Int      @id @default(autoincrement())\n  name        String\n  description String?\n  status      String   @default("active") // active, archived, completed\n  createdAt   DateTime @default(now())\n  updatedAt   DateTime @updatedAt\n\n  // Many-to-One: Each project has one owner\n  ownerId Int\n  owner   User @relation("ProjectOwner", fields: [ownerId], references: [id], onDelete: Cascade)\n\n  // One-to-Many: A project can have many tasks\n  tasks Task[]\n\n  // Many-to-Many: A project can have many members\n  members ProjectMember[]\n}\n\n// ============================================================================\n// ProjectMember Model (Junction table for Many-to-Many: User <-> Project)\n// ============================================================================\n\nmodel ProjectMember {\n  id        Int      @id @default(autoincrement())\n  role      String   @default("member") // owner, admin, member, viewer\n  joinedAt  DateTime @default(now())\n  createdAt DateTime @default(now())\n  updatedAt DateTime @updatedAt\n\n  userId    Int\n  user      User    @relation(fields: [userId], references: [id], onDelete: Cascade)\n  projectId Int\n  project   Project @relation(fields: [projectId], references: [id], onDelete: Cascade)\n\n  @@unique([userId, projectId])\n}\n\n// ============================================================================\n// Task Model (Many-to-One with Project, Many-to-One with User)\n// ============================================================================\n\nmodel Task {\n  id          Int       @id @default(autoincrement())\n  title       String\n  description String?\n  status      String    @default("todo") // todo, in_progress, review, done\n  priority    String    @default("medium") // low, medium, high, urgent\n  dueDate     DateTime?\n  createdAt   DateTime  @default(now())\n  updatedAt   DateTime  @updatedAt\n\n  // Many-to-One: Each task belongs to a project\n  projectId Int\n  project   Project @relation(fields: [projectId], references: [id], onDelete: Cascade)\n\n  // Many-to-One: Each task has a creator\n  creatorId Int\n  creator   User @relation("TaskCreator", fields: [creatorId], references: [id], onDelete: Cascade)\n\n  // Many-to-One: Each task can be assigned to a user (optional)\n  assigneeId Int?\n  assignee   User? @relation("TaskAssignee", fields: [assigneeId], references: [id], onDelete: SetNull)\n\n  // One-to-Many: A task can have many comments\n  comments Comment[]\n}\n\n// ============================================================================\n// Comment Model (Many-to-One with Task, Many-to-One with User)\n// ============================================================================\n\nmodel Comment {\n  id        Int      @id @default(autoincrement())\n  content   String\n  createdAt DateTime @default(now())\n  updatedAt DateTime @updatedAt\n\n  // Many-to-One: Each comment belongs to a task\n  taskId Int\n  task   Task @relation(fields: [taskId], references: [id], onDelete: Cascade)\n\n  // Many-to-One: Each comment is written by a user\n  authorId Int\n  author   User @relation(fields: [authorId], references: [id], onDelete: Cascade)\n}\n\n// ============================================================================\n// SavedFilter Model - Store user filter preferences per page\n// ============================================================================\n\nmodel SavedFilter {\n  id        Int      @id @default(autoincrement())\n  name      String // Filter preset name (e.g., "default", "my-filters")\n  page      String // Page identifier (e.g., "table", "projects")\n  filters   String // JSON string containing filter values\n  isDefault Boolean  @default(false) // Whether this is the default filter for the page\n  createdAt DateTime @default(now())\n  updatedAt DateTime @updatedAt\n\n  @@unique([name, page]) // Each filter name must be unique per page\n}\n',
  "runtimeDataModel": {
    "models": {},
    "enums": {},
    "types": {}
  }
};
config.runtimeDataModel = JSON.parse('{"models":{"User":{"fields":[{"name":"id","kind":"scalar","type":"Int"},{"name":"email","kind":"scalar","type":"String"},{"name":"name","kind":"scalar","type":"String"},{"name":"avatar","kind":"scalar","type":"String"},{"name":"createdAt","kind":"scalar","type":"DateTime"},{"name":"updatedAt","kind":"scalar","type":"DateTime"},{"name":"ownedProjects","kind":"object","type":"Project","relationName":"ProjectOwner"},{"name":"memberProjects","kind":"object","type":"ProjectMember","relationName":"ProjectMemberToUser"},{"name":"createdTasks","kind":"object","type":"Task","relationName":"TaskCreator"},{"name":"assignedTasks","kind":"object","type":"Task","relationName":"TaskAssignee"},{"name":"comments","kind":"object","type":"Comment","relationName":"CommentToUser"}],"dbName":null},"Project":{"fields":[{"name":"id","kind":"scalar","type":"Int"},{"name":"name","kind":"scalar","type":"String"},{"name":"description","kind":"scalar","type":"String"},{"name":"status","kind":"scalar","type":"String"},{"name":"createdAt","kind":"scalar","type":"DateTime"},{"name":"updatedAt","kind":"scalar","type":"DateTime"},{"name":"ownerId","kind":"scalar","type":"Int"},{"name":"owner","kind":"object","type":"User","relationName":"ProjectOwner"},{"name":"tasks","kind":"object","type":"Task","relationName":"ProjectToTask"},{"name":"members","kind":"object","type":"ProjectMember","relationName":"ProjectToProjectMember"}],"dbName":null},"ProjectMember":{"fields":[{"name":"id","kind":"scalar","type":"Int"},{"name":"role","kind":"scalar","type":"String"},{"name":"joinedAt","kind":"scalar","type":"DateTime"},{"name":"createdAt","kind":"scalar","type":"DateTime"},{"name":"updatedAt","kind":"scalar","type":"DateTime"},{"name":"userId","kind":"scalar","type":"Int"},{"name":"user","kind":"object","type":"User","relationName":"ProjectMemberToUser"},{"name":"projectId","kind":"scalar","type":"Int"},{"name":"project","kind":"object","type":"Project","relationName":"ProjectToProjectMember"}],"dbName":null},"Task":{"fields":[{"name":"id","kind":"scalar","type":"Int"},{"name":"title","kind":"scalar","type":"String"},{"name":"description","kind":"scalar","type":"String"},{"name":"status","kind":"scalar","type":"String"},{"name":"priority","kind":"scalar","type":"String"},{"name":"dueDate","kind":"scalar","type":"DateTime"},{"name":"createdAt","kind":"scalar","type":"DateTime"},{"name":"updatedAt","kind":"scalar","type":"DateTime"},{"name":"projectId","kind":"scalar","type":"Int"},{"name":"project","kind":"object","type":"Project","relationName":"ProjectToTask"},{"name":"creatorId","kind":"scalar","type":"Int"},{"name":"creator","kind":"object","type":"User","relationName":"TaskCreator"},{"name":"assigneeId","kind":"scalar","type":"Int"},{"name":"assignee","kind":"object","type":"User","relationName":"TaskAssignee"},{"name":"comments","kind":"object","type":"Comment","relationName":"CommentToTask"}],"dbName":null},"Comment":{"fields":[{"name":"id","kind":"scalar","type":"Int"},{"name":"content","kind":"scalar","type":"String"},{"name":"createdAt","kind":"scalar","type":"DateTime"},{"name":"updatedAt","kind":"scalar","type":"DateTime"},{"name":"taskId","kind":"scalar","type":"Int"},{"name":"task","kind":"object","type":"Task","relationName":"CommentToTask"},{"name":"authorId","kind":"scalar","type":"Int"},{"name":"author","kind":"object","type":"User","relationName":"CommentToUser"}],"dbName":null},"SavedFilter":{"fields":[{"name":"id","kind":"scalar","type":"Int"},{"name":"name","kind":"scalar","type":"String"},{"name":"page","kind":"scalar","type":"String"},{"name":"filters","kind":"scalar","type":"String"},{"name":"isDefault","kind":"scalar","type":"Boolean"},{"name":"createdAt","kind":"scalar","type":"DateTime"},{"name":"updatedAt","kind":"scalar","type":"DateTime"}],"dbName":null}},"enums":{},"types":{}}');
async function decodeBase64AsWasm(wasmBase64) {
  const { Buffer: Buffer2 } = await import("node:buffer");
  const wasmArray = Buffer2.from(wasmBase64, "base64");
  return new WebAssembly.Module(wasmArray);
}
config.compilerWasm = {
  getRuntime: async () => await import("@prisma/client/runtime/query_compiler_bg.postgresql.js"),
  getQueryCompilerWasmModule: async () => {
    const { wasm } = await import("@prisma/client/runtime/query_compiler_bg.postgresql.wasm-base64.js");
    return await decodeBase64AsWasm(wasm);
  }
};
function getPrismaClientClass() {
  return runtime.getPrismaClient(config);
}

// generated/prisma/internal/prismaNamespace.ts
var runtime2 = __toESM(require("@prisma/client/runtime/client"));
var getExtensionContext = runtime2.Extensions.getExtensionContext;
var NullTypes2 = {
  DbNull: runtime2.NullTypes.DbNull,
  JsonNull: runtime2.NullTypes.JsonNull,
  AnyNull: runtime2.NullTypes.AnyNull
};
var TransactionIsolationLevel = runtime2.makeStrictEnum({
  ReadUncommitted: "ReadUncommitted",
  ReadCommitted: "ReadCommitted",
  RepeatableRead: "RepeatableRead",
  Serializable: "Serializable"
});
var defineExtension = runtime2.Extensions.defineExtension;

// generated/prisma/client.ts
var PrismaClient = getPrismaClientClass();

// lib/prisma.ts
var adapter = new import_adapter_pg.PrismaPg({
  connectionString: (0, import_config2.env)("DATABASE_URL")
});
var prisma;
if (process.env.NODE_ENV === "development") {
  if (!global.prisma) {
    global.prisma = new PrismaClient({ adapter, log: ["error", "warn"] });
  }
  prisma = global.prisma;
} else {
  prisma = new PrismaClient({ adapter });
}
var prisma_default = prisma;

// src/api/projects/[id]/clone.ts
async function clone_default(req, res) {
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method not allowed" });
  }
  const { id } = req.params;
  const projectId = parseInt(id, 10);
  const {
    name,
    ownerId,
    includeTasks = true,
    includeMembers = true
  } = req.body;
  if (isNaN(projectId)) {
    return res.status(400).json({ error: "Invalid project ID" });
  }
  try {
    const originalProject = await prisma_default.project.findUnique({
      where: { id: projectId },
      include: {
        tasks: includeTasks ? {
          select: {
            title: true,
            description: true,
            status: true,
            priority: true,
            dueDate: true,
            creatorId: true,
            assigneeId: true
          }
        } : false,
        members: includeMembers ? {
          select: {
            userId: true,
            role: true
          }
        } : false
      }
    });
    if (!originalProject) {
      return res.status(404).json({ error: "Project not found" });
    }
    const newOwnerId = ownerId ? parseInt(ownerId, 10) : originalProject.ownerId;
    const newProjectName = name || `${originalProject.name} (Copy)`;
    const newProject = await prisma_default.project.create({
      data: {
        name: newProjectName,
        description: originalProject.description,
        status: "active",
        ownerId: newOwnerId
      }
    });
    if (includeMembers && originalProject.members && originalProject.members.length > 0) {
      const membersToCreate = originalProject.members.map((member) => ({
        userId: member.userId,
        projectId: newProject.id,
        role: member.userId === newOwnerId ? "owner" : member.role
      }));
      const ownerInMembers = membersToCreate.some(
        (m) => m.userId === newOwnerId
      );
      if (!ownerInMembers) {
        membersToCreate.push({
          userId: newOwnerId,
          projectId: newProject.id,
          role: "owner"
        });
      }
      await prisma_default.projectMember.createMany({
        data: membersToCreate,
        skipDuplicates: true
      });
    } else {
      await prisma_default.projectMember.create({
        data: {
          userId: newOwnerId,
          projectId: newProject.id,
          role: "owner"
        }
      });
    }
    if (includeTasks && originalProject.tasks && originalProject.tasks.length > 0) {
      const tasksToCreate = originalProject.tasks.map((task) => ({
        title: task.title,
        description: task.description,
        status: "todo",
        // Reset status for cloned tasks
        priority: task.priority,
        dueDate: task.dueDate,
        projectId: newProject.id,
        creatorId: newOwnerId,
        assigneeId: task.assigneeId
      }));
      await prisma_default.task.createMany({
        data: tasksToCreate
      });
    }
    const clonedProject = await prisma_default.project.findUnique({
      where: { id: newProject.id },
      include: {
        owner: {
          select: { id: true, name: true, email: true, avatar: true }
        },
        _count: {
          select: { tasks: true, members: true }
        }
      }
    });
    res.status(201).json({
      data: clonedProject,
      success: true,
      message: "Project cloned successfully"
    });
  } catch (error) {
    console.error("Clone project error:", error);
    res.status(500).json({ error: "Failed to clone project" });
  }
}

// src/.umi-production/api/projects/[id]/clone.ts
var import_apiRoute = __toESM(require_apiRoute());
var apiRoutes = [{ "path": "v2/projects/options", "id": "v2/projects/options/index", "file": "v2/projects/options/index.ts", "absPath": "/v2/projects/options", "__content": "import { UmiApiRequest, UmiApiResponse } from '@umijs/max';\nimport prisma from 'lib/prisma';\n\n/**\n * Projects Options API\n *\n * GET /api/v2/projects/options\n *\n * Params:\n * - ids:         Hydrate mode (?ids=1,2,3)\n * - cursor:      Pagination cursor\n * - limit:       Items per page (default: 10, max: 100)\n * - keyword:     Search by name\n * - parentField: Dependent field (ownerId | memberId)\n * - parentValue: Dependent field value\n */\n\n// Parse parentValue - supports single value or comma-separated array\nfunction parseParentValue(value: string): number[] {\n  const decoded = decodeURIComponent(value);\n  return decoded.split(',').map((v) => Number(v.trim())).filter(Boolean);\n}\n\n// Dependent filter mapping - supports array of values\nconst filterMap: Record<string, (values: number[]) => object> = {\n  ownerId: (ids) => ({ ownerId: { in: ids } }),\n  memberId: (ids) => ({ members: { some: { userId: { in: ids } } } }),\n};\n\nexport default async function handler(req: UmiApiRequest, res: UmiApiResponse) {\n  if (req.method !== 'GET') {\n    return res.status(405).json({ error: 'Method not allowed' });\n  }\n\n  const { ids, cursor, limit = '10', keyword, parentField, parentValue } = req.query as Record<\n    string,\n    string\n  >;\n\n  try {\n    // Hydrate mode\n    if (ids) {\n      const idList = ids.split(',').map(Number).filter(Boolean);\n      const data = await prisma.project.findMany({\n        where: { id: { in: idList } },\n      });\n      return res.status(200).json({ data, success: true });\n    }\n\n    // Build where clause\n    const conditions: object[] = [];\n\n    if (parentField && parentValue && filterMap[parentField]) {\n      const values = parseParentValue(parentValue);\n      if (values.length > 0) {\n        conditions.push(filterMap[parentField](values));\n      }\n    }\n\n    if (keyword) {\n      conditions.push({\n        name: { contains: keyword, mode: 'insensitive' },\n      });\n    }\n\n    const where = conditions.length > 0 ? { AND: conditions } : {};\n    const take = Math.min(Number(limit) || 10, 100);\n\n    const [projects, total] = await Promise.all([\n      prisma.project.findMany({\n        where,\n        take: take + 1,\n        orderBy: { id: 'asc' },\n        ...(cursor && { cursor: { id: Number(cursor) }, skip: 1 }),\n      }),\n      prisma.project.count({ where }),\n    ]);\n\n    const hasNextPage = projects.length > take;\n    const data = hasNextPage ? projects.slice(0, take) : projects;\n\n    return res.status(200).json({\n      data,\n      pageInfo: {\n        hasNextPage,\n        hasPrevPage: Boolean(cursor),\n        startCursor: data[0]?.id?.toString() ?? null,\n        endCursor: data[data.length - 1]?.id?.toString() ?? null,\n        total,\n      },\n      success: true,\n    });\n  } catch (error) {\n    console.error('Projects options error:', error);\n    console.error('Query params:', { ids, cursor, limit, keyword, parentField, parentValue });\n    return res.status(500).json({\n      error: 'Failed to fetch projects',\n      message: error instanceof Error ? error.message : 'Unknown error',\n      success: false,\n    });\n  }\n}" }, { "path": "v2/filters/options", "id": "v2/filters/options/index", "file": "v2/filters/options/index.ts", "absPath": "/v2/filters/options", "__content": "import { UmiApiRequest, UmiApiResponse } from '@umijs/max';\nimport prisma from 'lib/prisma';\n\n/**\n * Filters Options API\n *\n * GET /api/v2/filters/options\n *\n * Params:\n * - ids:         Hydrate mode (?ids=1,2,3)\n * - cursor:      Pagination cursor\n * - limit:       Items per page (default: 10, max: 100)\n * - keyword:     Search by name\n * - parentField: Dependent field (page | isDefault)\n * - parentValue: Dependent field value\n */\n\n// Parse parentValue - supports single value or comma-separated array\nfunction parseParentValue(value: string): string[] {\n  const decoded = decodeURIComponent(value);\n  return decoded.split(',').map((v) => v.trim()).filter(Boolean);\n}\n\n// Dependent filter mapping\nconst filterMap: Record<string, (values: string[]) => object> = {\n  page: (values) => ({ page: { in: values } }),\n  isDefault: (values) => ({ isDefault: values.includes('true') }),\n};\n\nexport default async function handler(req: UmiApiRequest, res: UmiApiResponse) {\n  if (req.method !== 'GET') {\n    return res.status(405).json({ error: 'Method not allowed' });\n  }\n\n  const { ids, cursor, limit = '10', keyword, parentField, parentValue } = req.query as Record<\n    string,\n    string\n  >;\n\n  try {\n    // Hydrate mode\n    if (ids) {\n      const idList = ids.split(',').map(Number).filter(Boolean);\n      const data = await prisma.savedFilter.findMany({\n        where: { id: { in: idList } },\n      });\n      return res.status(200).json({ data, success: true });\n    }\n\n    // Build where clause\n    const conditions: object[] = [];\n\n    if (parentField && parentValue && filterMap[parentField]) {\n      const values = parseParentValue(parentValue);\n      if (values.length > 0) {\n        conditions.push(filterMap[parentField](values));\n      }\n    }\n\n    if (keyword) {\n      conditions.push({\n        name: { contains: keyword, mode: 'insensitive' },\n      });\n    }\n\n    const where = conditions.length > 0 ? { AND: conditions } : {};\n    const take = Math.min(Number(limit) || 10, 100);\n\n    const [filters, total] = await Promise.all([\n      prisma.savedFilter.findMany({\n        where,\n        take: take + 1,\n        orderBy: { id: 'asc' },\n        ...(cursor && { cursor: { id: Number(cursor) }, skip: 1 }),\n      }),\n      prisma.savedFilter.count({ where }),\n    ]);\n\n    const hasNextPage = filters.length > take;\n    const data = hasNextPage ? filters.slice(0, take) : filters;\n\n    return res.status(200).json({\n      data,\n      pageInfo: {\n        hasNextPage,\n        hasPrevPage: Boolean(cursor),\n        startCursor: data[0]?.id?.toString() ?? null,\n        endCursor: data[data.length - 1]?.id?.toString() ?? null,\n        total,\n      },\n      success: true,\n    });\n  } catch (error) {\n    console.error('Filters options error:', error);\n    console.error('Query params:', { ids, cursor, limit, keyword, parentField, parentValue });\n    return res.status(500).json({\n      error: 'Failed to fetch filters',\n      message: error instanceof Error ? error.message : 'Unknown error',\n      success: false,\n    });\n  }\n}" }, { "path": "v2/tasks/options", "id": "v2/tasks/options/index", "file": "v2/tasks/options/index.ts", "absPath": "/v2/tasks/options", "__content": "import { UmiApiRequest, UmiApiResponse } from '@umijs/max';\nimport prisma from 'lib/prisma';\n\n/**\n * Tasks Options API\n *\n * GET /api/v2/tasks/options\n *\n * Params:\n * - ids:         Hydrate mode (?ids=1,2,3)\n * - cursor:      Pagination cursor\n * - limit:       Items per page (default: 10, max: 100)\n * - keyword:     Search by title\n * - parentField: Dependent field (projectId | assigneeId | creatorId | status | priority)\n * - parentValue: Dependent field value\n */\n\n// Parse parentValue - supports single value or comma-separated array\nfunction parseParentValue(value: string): (number | string)[] {\n  // Decode URL-encoded value first\n  const decoded = decodeURIComponent(value);\n  const parts = decoded.split(',').filter(Boolean);\n  // Try to parse as numbers, fallback to strings\n  return parts.map((v) => {\n    const num = Number(v.trim());\n    return isNaN(num) ? v.trim() : num;\n  });\n}\n\n// Dependent filter mapping - supports array of values\nconst filterMap: Record<string, (values: (number | string)[]) => object> = {\n  projectId: (ids) => ({ projectId: { in: ids.map(Number) } }),\n  assigneeId: (ids) => ({ assigneeId: { in: ids.map(Number) } }),\n  creatorId: (ids) => ({ creatorId: { in: ids.map(Number) } }),\n  status: (values) => ({ status: { in: values.map(String) } }),\n  priority: (values) => ({ priority: { in: values.map(String) } }),\n};\n\nexport default async function handler(req: UmiApiRequest, res: UmiApiResponse) {\n  if (req.method !== 'GET') {\n    return res.status(405).json({ error: 'Method not allowed' });\n  }\n\n  const { ids, cursor, limit = '10', keyword, parentField, parentValue } = req.query as Record<\n    string,\n    string\n  >;\n\n  try {\n    // Hydrate mode\n    if (ids) {\n      const idList = ids.split(',').map(Number).filter(Boolean);\n      const data = await prisma.task.findMany({\n        where: { id: { in: idList } },\n      });\n      return res.status(200).json({ data, success: true });\n    }\n\n    // Build where clause\n    const conditions: object[] = [];\n\n    if (parentField && parentValue && filterMap[parentField]) {\n      const values = parseParentValue(parentValue);\n      if (values.length > 0) {\n        conditions.push(filterMap[parentField](values));\n      }\n    }\n\n    if (keyword) {\n      conditions.push({\n        title: { contains: keyword, mode: 'insensitive' },\n      });\n    }\n\n    const where = conditions.length > 0 ? { AND: conditions } : {};\n    const take = Math.min(Number(limit) || 10, 100);\n\n    const [tasks, total] = await Promise.all([\n      prisma.task.findMany({\n        where,\n        take: take + 1,\n        orderBy: { id: 'asc' },\n        ...(cursor && { cursor: { id: Number(cursor) }, skip: 1 }),\n      }),\n      prisma.task.count({ where }),\n    ]);\n\n    const hasNextPage = tasks.length > take;\n    const data = hasNextPage ? tasks.slice(0, take) : tasks;\n\n    return res.status(200).json({\n      data,\n      pageInfo: {\n        hasNextPage,\n        hasPrevPage: Boolean(cursor),\n        startCursor: data[0]?.id?.toString() ?? null,\n        endCursor: data[data.length - 1]?.id?.toString() ?? null,\n        total,\n      },\n      success: true,\n    });\n  } catch (error) {\n    console.error('Tasks options error:', error);\n    console.error('Query params:', { ids, cursor, limit, keyword, parentField, parentValue });\n    return res.status(500).json({\n      error: 'Failed to fetch tasks',\n      message: error instanceof Error ? error.message : 'Unknown error',\n      success: false,\n    });\n  }\n}" }, { "path": "v2/users/options", "id": "v2/users/options/index", "file": "v2/users/options/index.ts", "absPath": "/v2/users/options", "__content": "import { UmiApiRequest, UmiApiResponse } from '@umijs/max';\nimport prisma from 'lib/prisma';\n\n/**\n * Users Options API\n *\n * GET /api/v2/users/options\n *\n * Params:\n * - ids:         Hydrate mode (?ids=1,2,3)\n * - cursor:      Pagination cursor\n * - limit:       Items per page (default: 10, max: 100)\n * - keyword:     Search name/email\n * - parentField: Dependent field name (projectId | taskId)\n * - parentValue: Dependent field value\n */\n\n// Parse parentValue - supports single value or comma-separated array\nfunction parseParentValue(value: string): number[] {\n  const decoded = decodeURIComponent(value);\n  return decoded.split(',').map((v) => Number(v.trim())).filter(Boolean);\n}\n\n// Dependent filter mapping - supports array of values\nconst filterMap: Record<string, (values: number[]) => object> = {\n  projectId: (ids) => ({ memberProjects: { some: { projectId: { in: ids } } } }),\n  taskId: (ids) => ({ assignedTasks: { some: { id: { in: ids } } } }),\n};\n\nexport default async function handler(req: UmiApiRequest, res: UmiApiResponse) {\n  if (req.method !== 'GET') {\n    return res.status(405).json({ error: 'Method not allowed' });\n  }\n\n  const { ids, cursor, limit = '10', keyword, parentField, parentValue } = req.query as Record<\n    string,\n    string\n  >;\n\n  try {\n    // Hydrate mode\n    if (ids) {\n      const idList = ids.split(',').map(Number).filter(Boolean);\n      const data = await prisma.user.findMany({\n        where: { id: { in: idList } },\n      });\n      return res.status(200).json({ data, success: true });\n    }\n\n    // Build where clause\n    const conditions: object[] = [];\n\n    // Dependent filter\n    if (parentField && parentValue && filterMap[parentField]) {\n      const values = parseParentValue(parentValue);\n      if (values.length > 0) {\n        conditions.push(filterMap[parentField](values));\n      }\n    }\n\n    // Keyword search\n    if (keyword) {\n      conditions.push({\n        OR: [\n          { name: { contains: keyword, mode: 'insensitive' } },\n          { email: { contains: keyword, mode: 'insensitive' } },\n        ],\n      });\n    }\n\n    const where = conditions.length > 0 ? { AND: conditions } : {};\n    const take = Math.min(Number(limit) || 10, 100);\n\n    const [users, total] = await Promise.all([\n      prisma.user.findMany({\n        where,\n        take: take + 1,\n        orderBy: { id: 'asc' },\n        ...(cursor && { cursor: { id: Number(cursor) }, skip: 1 }),\n      }),\n      prisma.user.count({ where }),\n    ]);\n\n    const hasNextPage = users.length > take;\n    const data = hasNextPage ? users.slice(0, take) : users;\n\n    return res.status(200).json({\n      data,\n      pageInfo: {\n        hasNextPage,\n        hasPrevPage: Boolean(cursor),\n        startCursor: data[0]?.id?.toString() ?? null,\n        endCursor: data[data.length - 1]?.id?.toString() ?? null,\n        total,\n      },\n      success: true,\n    });\n  } catch (error) {\n    console.error('Users options error:', error);\n    console.error('Query params:', { ids, cursor, limit, keyword, parentField, parentValue });\n    return res.status(500).json({\n      error: 'Failed to fetch users',\n      message: error instanceof Error ? error.message : 'Unknown error',\n      success: false,\n    });\n  }\n}\n" }, { "path": "projects/[id]/members", "id": "projects/[id]/members", "file": "projects/[id]/members.ts", "absPath": "/projects/[id]/members", "__content": "import { UmiApiRequest, UmiApiResponse } from '@umijs/max';\nimport prisma from 'lib/prisma';\n\nexport default async function (req: UmiApiRequest, res: UmiApiResponse) {\n  const { id } = req.params;\n  const projectId = parseInt(id as string, 10);\n\n  if (isNaN(projectId)) {\n    return res.status(400).json({ error: 'Invalid project ID' });\n  }\n\n  switch (req.method) {\n    case 'GET':\n      try {\n        const members = await prisma.projectMember.findMany({\n          where: { projectId },\n          include: {\n            user: {\n              select: { id: true, name: true, email: true, avatar: true },\n            },\n          },\n          orderBy: { joinedAt: 'asc' },\n        });\n\n        res.status(200).json({ data: members, success: true });\n      } catch (error) {\n        res.status(500).json({ error: 'Failed to retrieve members' });\n      }\n      break;\n\n    case 'POST':\n      try {\n        const { userId, role } = req.body;\n\n        if (!userId) {\n          return res.status(400).json({ error: 'userId is required' });\n        }\n\n        const member = await prisma.projectMember.create({\n          data: {\n            userId: parseInt(userId, 10),\n            projectId,\n            role: role || 'member',\n          },\n          include: {\n            user: {\n              select: { id: true, name: true, email: true, avatar: true },\n            },\n          },\n        });\n\n        res.status(201).json({ data: member, success: true });\n      } catch (error) {\n        res.status(500).json({ error: 'Failed to add member' });\n      }\n      break;\n\n    case 'DELETE':\n      try {\n        const { userId } = req.body;\n\n        if (!userId) {\n          return res.status(400).json({ error: 'userId is required' });\n        }\n\n        await prisma.projectMember.delete({\n          where: {\n            userId_projectId: {\n              userId: parseInt(userId, 10),\n              projectId,\n            },\n          },\n        });\n\n        res.status(204).end();\n      } catch (error) {\n        res.status(500).json({ error: 'Failed to remove member' });\n      }\n      break;\n\n    default:\n      res.status(405).json({ error: 'Method not allowed' });\n  }\n}\n" }, { "path": "projects/[id]/clone", "id": "projects/[id]/clone", "file": "projects/[id]/clone.ts", "absPath": "/projects/[id]/clone", "__content": "import { UmiApiRequest, UmiApiResponse } from '@umijs/max';\nimport prisma from 'lib/prisma';\n\n// POST /api/projects/:id/clone - Clone a project with its tasks and members\nexport default async function (req: UmiApiRequest, res: UmiApiResponse) {\n  if (req.method !== 'POST') {\n    return res.status(405).json({ error: 'Method not allowed' });\n  }\n\n  const { id } = req.params;\n  const projectId = parseInt(id as string, 10);\n  const {\n    name,\n    ownerId,\n    includeTasks = true,\n    includeMembers = true,\n  } = req.body;\n\n  if (isNaN(projectId)) {\n    return res.status(400).json({ error: 'Invalid project ID' });\n  }\n\n  try {\n    // Get original project with tasks and members\n    const originalProject = await prisma.project.findUnique({\n      where: { id: projectId },\n      include: {\n        tasks: includeTasks\n          ? {\n              select: {\n                title: true,\n                description: true,\n                status: true,\n                priority: true,\n                dueDate: true,\n                creatorId: true,\n                assigneeId: true,\n              },\n            }\n          : false,\n        members: includeMembers\n          ? {\n              select: {\n                userId: true,\n                role: true,\n              },\n            }\n          : false,\n      },\n    });\n\n    if (!originalProject) {\n      return res.status(404).json({ error: 'Project not found' });\n    }\n\n    const newOwnerId = ownerId\n      ? parseInt(ownerId, 10)\n      : originalProject.ownerId;\n    const newProjectName = name || `${originalProject.name} (Copy)`;\n\n    // Create new project\n    const newProject = await prisma.project.create({\n      data: {\n        name: newProjectName,\n        description: originalProject.description,\n        status: 'active',\n        ownerId: newOwnerId,\n      },\n    });\n\n    // Clone members if requested\n    if (\n      includeMembers &&\n      originalProject.members &&\n      originalProject.members.length > 0\n    ) {\n      const membersToCreate = originalProject.members.map((member) => ({\n        userId: member.userId,\n        projectId: newProject.id,\n        role: member.userId === newOwnerId ? 'owner' : member.role,\n      }));\n\n      // Check if new owner is already in members list\n      const ownerInMembers = membersToCreate.some(\n        (m) => m.userId === newOwnerId,\n      );\n      if (!ownerInMembers) {\n        membersToCreate.push({\n          userId: newOwnerId,\n          projectId: newProject.id,\n          role: 'owner',\n        });\n      }\n\n      await prisma.projectMember.createMany({\n        data: membersToCreate,\n        skipDuplicates: true,\n      });\n    } else {\n      // Add owner as member\n      await prisma.projectMember.create({\n        data: {\n          userId: newOwnerId,\n          projectId: newProject.id,\n          role: 'owner',\n        },\n      });\n    }\n\n    // Clone tasks if requested\n    if (\n      includeTasks &&\n      originalProject.tasks &&\n      originalProject.tasks.length > 0\n    ) {\n      const tasksToCreate = originalProject.tasks.map((task) => ({\n        title: task.title,\n        description: task.description,\n        status: 'todo', // Reset status for cloned tasks\n        priority: task.priority,\n        dueDate: task.dueDate,\n        projectId: newProject.id,\n        creatorId: newOwnerId,\n        assigneeId: task.assigneeId,\n      }));\n\n      await prisma.task.createMany({\n        data: tasksToCreate,\n      });\n    }\n\n    // Fetch complete project with relations\n    const clonedProject = await prisma.project.findUnique({\n      where: { id: newProject.id },\n      include: {\n        owner: {\n          select: { id: true, name: true, email: true, avatar: true },\n        },\n        _count: {\n          select: { tasks: true, members: true },\n        },\n      },\n    });\n\n    res.status(201).json({\n      data: clonedProject,\n      success: true,\n      message: 'Project cloned successfully',\n    });\n  } catch (error) {\n    console.error('Clone project error:', error);\n    res.status(500).json({ error: 'Failed to clone project' });\n  }\n}\n" }, { "path": "projects/[id]", "id": "projects/[id]/index", "file": "projects/[id]/index.ts", "absPath": "/projects/[id]", "__content": "import { UmiApiRequest, UmiApiResponse } from '@umijs/max';\nimport prisma from 'lib/prisma';\n\nexport default async function (req: UmiApiRequest, res: UmiApiResponse) {\n  const { id } = req.params;\n  const projectId = parseInt(id as string, 10);\n\n  if (isNaN(projectId)) {\n    return res.status(400).json({ error: 'Invalid project ID' });\n  }\n\n  switch (req.method) {\n    case 'GET':\n      try {\n        const project = await prisma.project.findUnique({\n          where: { id: projectId },\n          include: {\n            owner: {\n              select: { id: true, name: true, email: true, avatar: true },\n            },\n            members: {\n              include: {\n                user: {\n                  select: { id: true, name: true, email: true, avatar: true },\n                },\n              },\n            },\n            tasks: {\n              include: {\n                assignee: {\n                  select: { id: true, name: true, email: true, avatar: true },\n                },\n                comments: {\n                  include: {\n                    author: {\n                      select: {\n                        id: true,\n                        name: true,\n                        email: true,\n                        avatar: true,\n                      },\n                    },\n                  },\n                  orderBy: { createdAt: 'desc' },\n                },\n              },\n              orderBy: { createdAt: 'desc' },\n            },\n          },\n        });\n\n        if (!project) {\n          return res.status(404).json({ error: 'Project not found' });\n        }\n\n        res.status(200).json({ data: project, success: true });\n      } catch (error) {\n        res.status(500).json({ error: 'Failed to retrieve project' });\n      }\n      break;\n\n    case 'PUT':\n      try {\n        const { name, description, status } = req.body;\n\n        const project = await prisma.project.update({\n          where: { id: projectId },\n          data: {\n            ...(name && { name }),\n            ...(description !== undefined && { description }),\n            ...(status && { status }),\n          },\n          include: {\n            owner: {\n              select: { id: true, name: true, email: true, avatar: true },\n            },\n          },\n        });\n\n        res.status(200).json({ data: project, success: true });\n      } catch (error) {\n        res.status(500).json({ error: 'Failed to update project' });\n      }\n      break;\n\n    case 'DELETE':\n      try {\n        await prisma.project.delete({\n          where: { id: projectId },\n        });\n        res.status(204).end();\n      } catch (error) {\n        res.status(500).json({ error: 'Failed to delete project' });\n      }\n      break;\n\n    default:\n      res.status(405).json({ error: 'Method not allowed' });\n  }\n}\n" }, { "path": "projects/[id]/tasks", "id": "projects/[id]/tasks", "file": "projects/[id]/tasks.ts", "absPath": "/projects/[id]/tasks", "__content": "import { UmiApiRequest, UmiApiResponse } from '@umijs/max';\nimport prisma from 'lib/prisma';\n\n// GET /api/projects/:id/tasks - Get tasks for a specific project\nexport default async function (req: UmiApiRequest, res: UmiApiResponse) {\n  if (req.method !== 'GET') {\n    return res.status(405).json({ error: 'Method not allowed' });\n  }\n\n  const { id } = req.params;\n  const { current = '1', pageSize = '10', status, priority } = req.query;\n  const projectId = parseInt(id as string, 10);\n\n  if (isNaN(projectId)) {\n    return res.status(400).json({ error: 'Invalid project ID' });\n  }\n\n  try {\n    const page = parseInt(current as string, 10);\n    const limit = parseInt(pageSize as string, 10);\n    const skip = (page - 1) * limit;\n\n    const where: Record<string, unknown> = { projectId };\n    if (status) where.status = status;\n    if (priority) where.priority = priority;\n\n    const [tasks, total] = await Promise.all([\n      prisma.task.findMany({\n        where,\n        skip,\n        take: limit,\n        orderBy: { createdAt: 'desc' },\n        include: {\n          creator: {\n            select: { id: true, name: true, email: true, avatar: true },\n          },\n          assignee: {\n            select: { id: true, name: true, email: true, avatar: true },\n          },\n          _count: {\n            select: { comments: true },\n          },\n        },\n      }),\n      prisma.task.count({ where }),\n    ]);\n\n    res.status(200).json({\n      data: tasks,\n      total,\n      success: true,\n    });\n  } catch (error) {\n    console.error(error);\n    res.status(500).json({ error: 'Failed to retrieve project tasks' });\n  }\n}\n" }, { "path": "users/[id]/projects", "id": "users/[id]/projects", "file": "users/[id]/projects.ts", "absPath": "/users/[id]/projects", "__content": "import { UmiApiRequest, UmiApiResponse } from '@umijs/max';\nimport prisma from 'lib/prisma';\n\n// GET /api/users/:id/projects - Get projects where user is a member\nexport default async function (req: UmiApiRequest, res: UmiApiResponse) {\n  if (req.method !== 'GET') {\n    return res.status(405).json({ error: 'Method not allowed' });\n  }\n\n  const { id } = req.params;\n  const { current = '1', pageSize = '10' } = req.query;\n  const userId = parseInt(id as string, 10);\n\n  if (isNaN(userId)) {\n    return res.status(400).json({ error: 'Invalid user ID' });\n  }\n\n  try {\n    const page = parseInt(current as string, 10);\n    const limit = parseInt(pageSize as string, 10);\n    const skip = (page - 1) * limit;\n\n    // Find projects where user is a member (via ProjectMember table)\n    const [projectMembers, total] = await Promise.all([\n      prisma.projectMember.findMany({\n        where: { userId },\n        skip,\n        take: limit,\n        include: {\n          project: {\n            include: {\n              owner: {\n                select: { id: true, name: true, email: true, avatar: true },\n              },\n              _count: {\n                select: { tasks: true, members: true },\n              },\n            },\n          },\n        },\n        orderBy: { project: { createdAt: 'desc' } },\n      }),\n      prisma.projectMember.count({ where: { userId } }),\n    ]);\n\n    const projects = projectMembers.map((pm) => ({\n      ...pm.project,\n      memberRole: pm.role,\n    }));\n\n    res.status(200).json({\n      data: projects,\n      total,\n      success: true,\n    });\n  } catch (error) {\n    console.error(error);\n    res.status(500).json({ error: 'Failed to retrieve user projects' });\n  }\n}\n" }, { "path": "health/[id]", "id": "health/[id]/index", "file": "health/[id]/index.ts", "absPath": "/health/[id]", "__content": "import { UmiApiRequest, UmiApiResponse } from '@umijs/max';\n\nexport default async function (req: UmiApiRequest, res: UmiApiResponse) {\n  switch (req.method) {\n    case 'GET':\n      res.status(200).json({ error: 'Successfully HELLOO' });\n      break;\n\n    default:\n      res.status(405).json({ error: 'Method not allowed' });\n  }\n}\n" }, { "path": "health/[id]/tasks", "id": "health/[id]/tasks", "file": "health/[id]/tasks.ts", "absPath": "/health/[id]/tasks", "__content": "import { UmiApiRequest, UmiApiResponse } from '@umijs/max';\n\nexport default async function (req: UmiApiRequest, res: UmiApiResponse) {\n  switch (req.method) {\n    case 'GET':\n      res.status(200).json({ error: 'Successfully TASKS' });\n      break;\n\n    default:\n      res.status(405).json({ error: 'Method not allowed' });\n  }\n}\n" }, { "path": "tasks/by-projects", "id": "tasks/by-projects", "file": "tasks/by-projects.ts", "absPath": "/tasks/by-projects", "__content": "import { UmiApiRequest, UmiApiResponse } from '@umijs/max';\nimport prisma from 'lib/prisma';\n\n// POST /api/tasks/by-projects - Get tasks from multiple projects\nexport default async function (req: UmiApiRequest, res: UmiApiResponse) {\n  if (req.method !== 'POST') {\n    return res.status(405).json({ error: 'Method not allowed' });\n  }\n\n  const {\n    projectIds = [],\n    current = 1,\n    pageSize = 10,\n    ids = [],\n    status,\n    priority,\n  } = req.body;\n\n  try {\n    const page = parseInt(current as string, 10);\n    const limit = parseInt(pageSize as string, 10);\n    const skip = (page - 1) * limit;\n\n    // Build where clause\n    let whereClause: Record<string, unknown> = {};\n\n    // If specific task IDs requested (for fetchByIds)\n    if (ids.length > 0) {\n      whereClause = { id: { in: ids } };\n    }\n    // If filtering by project IDs\n    else if (projectIds.length > 0) {\n      whereClause = {\n        projectId: { in: projectIds.map((id: string | number) => Number(id)) },\n      };\n    }\n\n    // Add optional filters\n    if (status) whereClause.status = status;\n    if (priority) whereClause.priority = priority;\n\n    const [tasks, total] = await Promise.all([\n      prisma.task.findMany({\n        where: whereClause,\n        skip,\n        take: limit,\n        include: {\n          project: {\n            select: { id: true, name: true },\n          },\n          creator: {\n            select: { id: true, name: true, email: true, avatar: true },\n          },\n          assignee: {\n            select: { id: true, name: true, email: true, avatar: true },\n          },\n          _count: {\n            select: { comments: true },\n          },\n        },\n        orderBy: { createdAt: 'desc' },\n      }),\n      prisma.task.count({ where: whereClause }),\n    ]);\n\n    res.status(200).json({\n      data: tasks,\n      total,\n      success: true,\n    });\n  } catch (error) {\n    console.error('Error fetching tasks by projects:', error);\n    res.status(500).json({ error: 'Failed to retrieve tasks' });\n  }\n}\n" }, { "path": "selections", "id": "selections/index", "file": "selections/index.ts", "absPath": "/selections", "__content": "/**\n * Selections API - Save/Load user selections for SmartSelect demo\n *\n * GET: Load saved selections for a page\n * POST: Save selections for a page\n */\n\nimport { UmiApiRequest, UmiApiResponse } from '@umijs/max';\nimport prisma from 'lib/prisma';\n\nexport default async function handler(\n  req: UmiApiRequest,\n  res: UmiApiResponse,\n) {\n  const { method } = req;\n\n  try {\n    switch (method) {\n      case 'GET': {\n        // Get page from query params\n        const { page = 'smart-select-demo' } = req.query;\n\n        // Find saved filter for this page\n        const saved = await prisma.savedFilter.findFirst({\n          where: {\n            page: page as string,\n            isDefault: true,\n          },\n        });\n\n        if (!saved) {\n          return res.status(200).json({\n            success: true,\n            data: null,\n          });\n        }\n\n        // Parse the JSON filters\n        const selections = JSON.parse(saved.filters || '{}');\n\n        return res.status(200).json({\n          success: true,\n          data: selections,\n        });\n      }\n\n      case 'POST': {\n        const { page = 'smart-select-demo', selections } = req.body;\n\n        if (!selections) {\n          return res.status(400).json({\n            success: false,\n            error: 'Missing selections data',\n          });\n        }\n\n        // Upsert the saved filter\n        const saved = await prisma.savedFilter.upsert({\n          where: {\n            name_page: {\n              name: 'default',\n              page,\n            },\n          },\n          update: {\n            filters: JSON.stringify(selections),\n            updatedAt: new Date(),\n          },\n          create: {\n            name: 'default',\n            page,\n            filters: JSON.stringify(selections),\n            isDefault: true,\n          },\n        });\n\n        return res.status(200).json({\n          success: true,\n          data: JSON.parse(saved.filters),\n        });\n      }\n\n      default:\n        res.header('Allow', 'GET, POST');\n        return res.status(405).json({\n          success: false,\n          error: `Method ${method} Not Allowed`,\n        });\n    }\n  } catch (error) {\n    console.error('Selections API Error:', error);\n    return res.status(500).json({\n      success: false,\n      error: error instanceof Error ? error.message : 'Unknown error',\n    });\n  }\n}" }, { "path": "comments", "id": "comments/index", "file": "comments/index.ts", "absPath": "/comments", "__content": "import { UmiApiRequest, UmiApiResponse } from '@umijs/max';\nimport prisma from 'lib/prisma';\n\nexport default async function (req: UmiApiRequest, res: UmiApiResponse) {\n  switch (req.method) {\n    case 'GET':\n      try {\n        const { current = '1', pageSize = '10', taskId, authorId } = req.query;\n\n        const page = parseInt(current as string, 10);\n        const limit = parseInt(pageSize as string, 10);\n        const skip = (page - 1) * limit;\n\n        const where: Record<string, unknown> = {};\n        if (taskId) where.taskId = parseInt(taskId as string, 10);\n        if (authorId) where.authorId = parseInt(authorId as string, 10);\n\n        const [comments, total] = await Promise.all([\n          prisma.comment.findMany({\n            skip,\n            take: limit,\n            where,\n            orderBy: { createdAt: 'desc' },\n            include: {\n              author: {\n                select: { id: true, name: true, email: true, avatar: true },\n              },\n              task: {\n                select: { id: true, title: true },\n              },\n            },\n          }),\n          prisma.comment.count({ where }),\n        ]);\n\n        res.status(200).json({\n          data: comments,\n          total,\n          success: true,\n        });\n      } catch (error) {\n        res.status(500).json({ error: 'Failed to retrieve comments' });\n      }\n      break;\n\n    case 'POST':\n      try {\n        const { content, taskId, authorId } = req.body;\n\n        if (!content || !taskId || !authorId) {\n          return res\n            .status(400)\n            .json({ error: 'Content, taskId, and authorId are required' });\n        }\n\n        const comment = await prisma.comment.create({\n          data: {\n            content,\n            taskId: parseInt(taskId, 10),\n            authorId: parseInt(authorId, 10),\n          },\n          include: {\n            author: {\n              select: { id: true, name: true, email: true, avatar: true },\n            },\n            task: {\n              select: { id: true, title: true },\n            },\n          },\n        });\n\n        res.status(201).json({ data: comment, success: true });\n      } catch (error) {\n        res.status(500).json({ error: 'Failed to create comment' });\n      }\n      break;\n\n    default:\n      res.status(405).json({ error: 'Method not allowed' });\n  }\n}\n" }, { "path": "projects", "id": "projects/index", "file": "projects/index.ts", "absPath": "/projects", "__content": "import { UmiApiRequest, UmiApiResponse } from '@umijs/max';\nimport prisma from 'lib/prisma';\n\nexport default async function (req: UmiApiRequest, res: UmiApiResponse) {\n  switch (req.method) {\n    case 'GET':\n      try {\n        const {\n          current = '1',\n          pageSize = '10',\n          ownerId,\n          ownerIds = [],\n        } = req.query;\n        const page = parseInt(current as string, 10);\n        const limit = parseInt(pageSize as string, 10);\n        const skip = (page - 1) * limit;\n\n        const where: Record<string, unknown> = {};\n        if (ownerId) where.ownerId = parseInt(ownerId as string, 10);\n\n        const [projects, total] = await Promise.all([\n          prisma.project.findMany({\n            skip,\n            take: limit,\n            where,\n            orderBy: { createdAt: 'desc' },\n            include: {\n              owner: {\n                select: { id: true, name: true, email: true, avatar: true },\n              },\n              _count: {\n                select: { tasks: true, members: true },\n              },\n            },\n          }),\n          prisma.project.count({ where }),\n        ]);\n\n        res.status(200).json({\n          data: projects,\n          total,\n          success: true,\n        });\n      } catch (error) {\n        res.status(500).json({ error: 'Failed to retrieve projects' });\n      }\n      break;\n\n    case 'POST':\n      try {\n        const {\n          action,\n          name,\n          description,\n          ownerId,\n          status,\n          memberIds = [],\n          ids = [],\n          current = 1,\n          pageSize = 10,\n          keyword,\n        } = req.body;\n\n        // Action: Get projects by IDs (for hydration)\n        if (action === 'by-ids') {\n          if (!ids.length) {\n            return res.status(200).json({ data: [], total: 0, success: true });\n          }\n          const projects = await prisma.project.findMany({\n            where: { id: { in: ids.map((id: string | number) => Number(id)) } },\n            include: {\n              owner: {\n                select: { id: true, name: true, email: true, avatar: true },\n              },\n              members: {\n                select: {\n                  userId: true,\n                  role: true,\n                  user: {\n                    select: { id: true, name: true, avatar: true },\n                  },\n                },\n              },\n              _count: {\n                select: { tasks: true, members: true },\n              },\n            },\n          });\n          return res.status(200).json({ data: projects, total: projects.length, success: true });\n        }\n\n        // Action: Get projects by member IDs\n        if (action === 'by-members') {\n          const page = parseInt(current as string, 10);\n          const limit = parseInt(pageSize as string, 10);\n          const skip = (page - 1) * limit;\n\n          const whereClause: Record<string, unknown> = {};\n\n          // If filtering by member IDs\n          if (memberIds.length > 0) {\n            whereClause.members = {\n              some: {\n                userId: {\n                  in: memberIds.map((id: string | number) => Number(id)),\n                },\n              },\n            };\n          }\n\n          // Search by keyword\n          if (keyword) {\n            whereClause.OR = [\n              { name: { contains: keyword, mode: 'insensitive' } },\n              { description: { contains: keyword, mode: 'insensitive' } },\n            ];\n          }\n\n          const [projects, total] = await Promise.all([\n            prisma.project.findMany({\n              where: whereClause,\n              skip,\n              take: limit,\n              include: {\n                owner: {\n                  select: { id: true, name: true, email: true, avatar: true },\n                },\n                members: {\n                  select: {\n                    userId: true,\n                    role: true,\n                    user: {\n                      select: { id: true, name: true, avatar: true },\n                    },\n                  },\n                },\n                _count: {\n                  select: { tasks: true, members: true },\n                },\n              },\n              orderBy: { createdAt: 'desc' },\n            }),\n            prisma.project.count({ where: whereClause }),\n          ]);\n\n          return res.status(200).json({\n            data: projects,\n            total,\n            success: true,\n          });\n        }\n\n        // Default action: Create new project\n        if (!name || !ownerId) {\n          return res\n            .status(400)\n            .json({ error: 'Name and ownerId are required' });\n        }\n\n        const project = await prisma.project.create({\n          data: {\n            name,\n            description,\n            status: status || 'active',\n            ownerId: parseInt(ownerId, 10),\n          },\n          include: {\n            owner: {\n              select: { id: true, name: true, email: true, avatar: true },\n            },\n          },\n        });\n\n        // Add owner as a project member with 'owner' role\n        await prisma.projectMember.create({\n          data: {\n            userId: parseInt(ownerId, 10),\n            projectId: project.id,\n            role: 'owner',\n          },\n        });\n\n        res.status(201).json({ data: project, success: true });\n      } catch (error) {\n        console.error('Projects API error:', error);\n        res.status(500).json({ error: 'Failed to process request' });\n      }\n      break;\n\n    default:\n      res.status(405).json({ error: 'Method not allowed' });\n  }\n}\n" }, { "path": "comments/[id]", "id": "comments/[id]", "file": "comments/[id].ts", "absPath": "/comments/[id]", "__content": "import { UmiApiRequest, UmiApiResponse } from '@umijs/max';\nimport prisma from 'lib/prisma';\n\nexport default async function (req: UmiApiRequest, res: UmiApiResponse) {\n  const { id } = req.params;\n  const commentId = parseInt(id as string, 10);\n\n  if (isNaN(commentId)) {\n    return res.status(400).json({ error: 'Invalid comment ID' });\n  }\n\n  switch (req.method) {\n    case 'GET':\n      try {\n        const comment = await prisma.comment.findUnique({\n          where: { id: commentId },\n          include: {\n            author: {\n              select: { id: true, name: true, email: true, avatar: true },\n            },\n            task: {\n              select: { id: true, title: true },\n            },\n          },\n        });\n\n        if (!comment) {\n          return res.status(404).json({ error: 'Comment not found' });\n        }\n\n        res.status(200).json({ data: comment, success: true });\n      } catch (error) {\n        res.status(500).json({ error: 'Failed to retrieve comment' });\n      }\n      break;\n\n    case 'PUT':\n      try {\n        const { content } = req.body;\n\n        if (!content) {\n          return res.status(400).json({ error: 'Content is required' });\n        }\n\n        const comment = await prisma.comment.update({\n          where: { id: commentId },\n          data: { content },\n          include: {\n            author: {\n              select: { id: true, name: true, email: true, avatar: true },\n            },\n            task: {\n              select: { id: true, title: true },\n            },\n          },\n        });\n\n        res.status(200).json({ data: comment, success: true });\n      } catch (error) {\n        res.status(500).json({ error: 'Failed to update comment' });\n      }\n      break;\n\n    case 'DELETE':\n      try {\n        await prisma.comment.delete({\n          where: { id: commentId },\n        });\n        res.status(204).end();\n      } catch (error) {\n        res.status(500).json({ error: 'Failed to delete comment' });\n      }\n      break;\n\n    default:\n      res.status(405).json({ error: 'Method not allowed' });\n  }\n}\n" }, { "path": "filters", "id": "filters/index", "file": "filters/index.ts", "absPath": "/filters", "__content": "import { UmiApiRequest, UmiApiResponse } from '@umijs/max';\nimport prisma from 'lib/prisma';\n\nexport default async function (req: UmiApiRequest, res: UmiApiResponse) {\n  switch (req.method) {\n    case 'GET':\n      try {\n        const { page, name } = req.query;\n\n        const where: Record<string, unknown> = {};\n        if (page) where.page = page;\n        if (name) where.name = name;\n\n        // Get all filters matching criteria (always return array for consistency)\n        const filters = await prisma.savedFilter.findMany({\n          where,\n          orderBy: [{ isDefault: 'desc' }, { updatedAt: 'desc' }], // Default filters first\n        });\n\n        res.status(200).json({\n          data: filters.map((f) => ({\n            ...f,\n            filters: JSON.parse(f.filters),\n          })),\n          success: true,\n        });\n      } catch (error) {\n        res.status(500).json({ error: 'Failed to retrieve filters' });\n      }\n      break;\n\n    case 'POST':\n      try {\n        const { name, page, filters, isDefault } = req.body;\n\n        if (!name || !page || !filters) {\n          return res.status(400).json({\n            error: 'Name, page, and filters are required',\n          });\n        }\n\n        // If setting as default, unset other defaults for this page\n        if (isDefault) {\n          await prisma.savedFilter.updateMany({\n            where: { page, isDefault: true },\n            data: { isDefault: false },\n          });\n        }\n\n        // Upsert the filter (create or update)\n        const filter = await prisma.savedFilter.upsert({\n          where: { name_page: { name, page } },\n          update: {\n            filters: JSON.stringify(filters),\n            isDefault: isDefault ?? false,\n          },\n          create: {\n            name,\n            page,\n            filters: JSON.stringify(filters),\n            isDefault: isDefault ?? false,\n          },\n        });\n\n        res.status(200).json({\n          data: { ...filter, filters: JSON.parse(filter.filters) },\n          success: true,\n        });\n      } catch (error) {\n        res.status(500).json({ error: 'Failed to save filter' });\n      }\n      break;\n\n    case 'DELETE':\n      try {\n        const { name, page } = req.body;\n\n        if (!name || !page) {\n          return res.status(400).json({\n            error: 'Name and page are required',\n          });\n        }\n\n        await prisma.savedFilter.delete({\n          where: { name_page: { name, page } },\n        });\n\n        res.status(200).json({ success: true });\n      } catch (error) {\n        res.status(500).json({ error: 'Failed to delete filter' });\n      }\n      break;\n\n    default:\n      res.status(405).json({ error: 'Method not allowed' });\n  }\n}\n" }, { "path": "health", "id": "health/index", "file": "health/index.ts", "absPath": "/health", "__content": "import { UmiApiRequest, UmiApiResponse } from '@umijs/max';\n\nexport default async function (req: UmiApiRequest, res: UmiApiResponse) {\n  switch (req.method) {\n    case 'GET':\n      res.status(200).json({ error: 'Successfully' });\n      break;\n\n    default:\n      res.status(405).json({ error: 'Method not allowed' });\n  }\n}\n" }, { "path": "tasks", "id": "tasks/index", "file": "tasks/index.ts", "absPath": "/tasks", "__content": "import { UmiApiRequest, UmiApiResponse } from '@umijs/max';\nimport prisma from 'lib/prisma';\n\nexport default async function (req: UmiApiRequest, res: UmiApiResponse) {\n  switch (req.method) {\n    case 'GET':\n      try {\n        const {\n          current = '1',\n          pageSize = '10',\n          projectId,\n          status,\n          priority,\n          assigneeId,\n          creatorId,\n        } = req.query;\n\n        const page = parseInt(current as string, 10);\n        const limit = parseInt(pageSize as string, 10);\n        const skip = (page - 1) * limit;\n\n        const where: Record<string, unknown> = {};\n        if (projectId) where.projectId = parseInt(projectId as string, 10);\n        if (status) where.status = status;\n        if (priority) where.priority = priority;\n        if (assigneeId) where.assigneeId = parseInt(assigneeId as string, 10);\n        if (creatorId) where.creatorId = parseInt(creatorId as string, 10);\n\n        const [tasks, total] = await Promise.all([\n          prisma.task.findMany({\n            skip,\n            take: limit,\n            where,\n            orderBy: { createdAt: 'desc' },\n            include: {\n              project: {\n                select: { id: true, name: true },\n              },\n              creator: {\n                select: { id: true, name: true, email: true, avatar: true },\n              },\n              assignee: {\n                select: { id: true, name: true, email: true, avatar: true },\n              },\n              _count: {\n                select: { comments: true },\n              },\n            },\n          }),\n          prisma.task.count({ where }),\n        ]);\n\n        res.status(200).json({\n          data: tasks,\n          total,\n          success: true,\n        });\n      } catch (error) {\n        res.status(500).json({ error: 'Failed to retrieve tasks' });\n      }\n      break;\n\n    case 'POST':\n      try {\n        const {\n          action,\n          title,\n          description,\n          projectId,\n          projectIds = [],\n          ids = [],\n          creatorId,\n          assigneeId,\n          status,\n          priority,\n          dueDate,\n          current = 1,\n          pageSize = 10,\n          keyword,\n        } = req.body;\n\n        // Action: Get tasks by IDs (for hydration)\n        if (action === 'by-ids') {\n          if (!ids.length) {\n            return res.status(200).json({ data: [], total: 0, success: true });\n          }\n          const tasks = await prisma.task.findMany({\n            where: { id: { in: ids.map((id: string | number) => Number(id)) } },\n            include: {\n              project: {\n                select: { id: true, name: true },\n              },\n              creator: {\n                select: { id: true, name: true, email: true, avatar: true },\n              },\n              assignee: {\n                select: { id: true, name: true, email: true, avatar: true },\n              },\n            },\n          });\n          return res.status(200).json({ data: tasks, total: tasks.length, success: true });\n        }\n\n        // Action: Get tasks by project IDs\n        if (action === 'by-projects') {\n          const page = parseInt(current as string, 10);\n          const limit = parseInt(pageSize as string, 10);\n          const skip = (page - 1) * limit;\n\n          const whereClause: Record<string, unknown> = {};\n\n          // Filter by project IDs\n          if (projectIds.length > 0) {\n            whereClause.projectId = {\n              in: projectIds.map((id: string | number) => Number(id)),\n            };\n          }\n\n          // Search by keyword\n          if (keyword) {\n            whereClause.OR = [\n              { title: { contains: keyword, mode: 'insensitive' } },\n              { description: { contains: keyword, mode: 'insensitive' } },\n            ];\n          }\n\n          const [tasks, total] = await Promise.all([\n            prisma.task.findMany({\n              where: whereClause,\n              skip,\n              take: limit,\n              include: {\n                project: {\n                  select: { id: true, name: true },\n                },\n                creator: {\n                  select: { id: true, name: true, email: true, avatar: true },\n                },\n                assignee: {\n                  select: { id: true, name: true, email: true, avatar: true },\n                },\n              },\n              orderBy: { createdAt: 'desc' },\n            }),\n            prisma.task.count({ where: whereClause }),\n          ]);\n\n          return res.status(200).json({\n            data: tasks,\n            total,\n            success: true,\n          });\n        }\n\n        // Default action: Create new task\n        if (!title || !projectId || !creatorId) {\n          return res\n            .status(400)\n            .json({ error: 'Title, projectId, and creatorId are required' });\n        }\n\n        const task = await prisma.task.create({\n          data: {\n            title,\n            description,\n            projectId: parseInt(projectId, 10),\n            creatorId: parseInt(creatorId, 10),\n            assigneeId: assigneeId ? parseInt(assigneeId, 10) : null,\n            status: status || 'todo',\n            priority: priority || 'medium',\n            dueDate: dueDate ? new Date(dueDate) : null,\n          },\n          include: {\n            project: {\n              select: { id: true, name: true },\n            },\n            creator: {\n              select: { id: true, name: true, email: true, avatar: true },\n            },\n            assignee: {\n              select: { id: true, name: true, email: true, avatar: true },\n            },\n          },\n        });\n\n        res.status(201).json({ data: task, success: true });\n      } catch (error) {\n        console.error('Tasks API error:', error);\n        res.status(500).json({ error: 'Failed to process task request' });\n      }\n      break;\n\n    default:\n      res.status(405).json({ error: 'Method not allowed' });\n  }\n}\n" }, { "path": "users", "id": "users/index", "file": "users/index.ts", "absPath": "/users", "__content": "import { UmiApiRequest, UmiApiResponse } from '@umijs/max';\nimport prisma from 'lib/prisma';\n\nexport default async function (req: UmiApiRequest, res: UmiApiResponse) {\n  switch (req.method) {\n    case 'POST': {\n      const { action, name, email, avatar } = req.body;\n\n      // Create new user\n      if (action === 'create') {\n        if (!name || !email) {\n          return res.status(400).json({ error: 'Name and email are required' });\n        }\n\n        try {\n          const existingUser = await prisma.user.findFirst({\n            where: {\n              OR: [{ email }, { name }],\n            },\n          });\n\n          if (existingUser) {\n            return res.status(400).json({\n              error:\n                existingUser.email === email\n                  ? 'Email already exists'\n                  : 'Name already exists',\n            });\n          }\n\n          const newUser = await prisma.user.create({\n            data: {\n              name,\n              email,\n              avatar: avatar || null,\n            },\n          });\n\n          return res.status(201).json({ data: newUser, success: true });\n        } catch (error) {\n          console.error(error);\n          return res.status(500).json({ error: 'Failed to create user' });\n        }\n      }\n\n      // Action: Get users by IDs (for hydration)\n      if (action === 'by-ids') {\n        const { ids = [] } = req.body;\n        if (!ids.length) {\n          return res.status(200).json({ data: [], total: 0, success: true });\n        }\n        try {\n          const users = await prisma.user.findMany({\n            where: { id: { in: ids.map((id: string | number) => Number(id)) } },\n          });\n          return res.status(200).json({ data: users, total: users.length, success: true });\n        } catch (error) {\n          console.error(error);\n          return res.status(500).json({ error: 'Failed to retrieve users by IDs' });\n        }\n      }\n\n      // List users (default action)\n      const { current = '1', pageSize = '10', sorter, ids = [], keyword } = req.body;\n      const page = parseInt(current as string, 10);\n      const limit = parseInt(pageSize as string, 10);\n      const skip = (page - 1) * limit;\n\n      try {\n        const whereClause: Record<string, unknown> = {};\n\n        // Filter by IDs if provided\n        if (ids.length > 0) {\n          whereClause.id = { in: ids };\n        }\n\n        // Search by keyword\n        if (keyword) {\n          whereClause.OR = [\n            { name: { contains: keyword, mode: 'insensitive' } },\n            { email: { contains: keyword, mode: 'insensitive' } },\n          ];\n        }\n\n        const [users, total] = await Promise.all([\n          prisma.user.findMany({\n            skip,\n            take: limit,\n            orderBy: sorter || { id: 'asc' },\n            where: whereClause,\n          }),\n          prisma.user.count({\n            where: whereClause,\n          }),\n        ]);\n\n        res.status(200).json({\n          data: users,\n          total,\n          success: true,\n        });\n      } catch (error) {\n        console.error(error);\n        res.status(500).json({ error: 'Failed to retrieve users' });\n      }\n      break;\n    }\n    case 'DELETE': {\n      const { id: deleteId } = req.query;\n      if (!deleteId) {\n        return res.status(400).json({ error: 'Missing user ID' });\n      }\n      try {\n        await prisma.user.delete({\n          where: { id: Number(deleteId) },\n        });\n        res.status(204).json({ success: true });\n      } catch (error) {\n        res.status(500).json({ error: 'Failed to delete user' });\n      }\n      break;\n    }\n    case 'PUT': {\n      const { id: updateId } = req.query;\n      const { name: updateName, email: updateEmail } = req.body;\n      if (!updateId) {\n        return res.status(400).json({ error: 'Missing user ID' });\n      }\n      try {\n        const updatedUser = await prisma.user.update({\n          where: { id: Number(updateId) },\n          data: {\n            name: updateName,\n            email: updateEmail,\n          },\n        });\n        res.status(200).json(updatedUser);\n      } catch (error) {\n        res.status(500).json({ error: 'Failed to update user' });\n      }\n      break;\n    }\n    default:\n      res.status(405).json({ error: 'Method not allowed' });\n  }\n}\n" }, { "path": "tasks/[id]", "id": "tasks/[id]", "file": "tasks/[id].ts", "absPath": "/tasks/[id]", "__content": "import { UmiApiRequest, UmiApiResponse } from '@umijs/max';\nimport prisma from 'lib/prisma';\n\nexport default async function (req: UmiApiRequest, res: UmiApiResponse) {\n  const { id } = req.params;\n  const taskId = parseInt(id as string, 10);\n\n  if (isNaN(taskId)) {\n    return res.status(400).json({ error: 'Invalid task ID' });\n  }\n\n  switch (req.method) {\n    case 'GET':\n      try {\n        const task = await prisma.task.findUnique({\n          where: { id: taskId },\n          include: {\n            project: {\n              select: { id: true, name: true },\n            },\n            creator: {\n              select: { id: true, name: true, email: true, avatar: true },\n            },\n            assignee: {\n              select: { id: true, name: true, email: true, avatar: true },\n            },\n            comments: {\n              include: {\n                author: {\n                  select: { id: true, name: true, email: true, avatar: true },\n                },\n              },\n              orderBy: { createdAt: 'desc' },\n            },\n          },\n        });\n\n        if (!task) {\n          return res.status(404).json({ error: 'Task not found' });\n        }\n\n        res.status(200).json({ data: task, success: true });\n      } catch (error) {\n        res.status(500).json({ error: 'Failed to retrieve task' });\n      }\n      break;\n\n    case 'PUT':\n      try {\n        const { title, description, status, priority, assigneeId, dueDate } =\n          req.body;\n\n        const task = await prisma.task.update({\n          where: { id: taskId },\n          data: {\n            ...(title && { title }),\n            ...(description !== undefined && { description }),\n            ...(status && { status }),\n            ...(priority && { priority }),\n            ...(assigneeId !== undefined && {\n              assigneeId: assigneeId ? parseInt(assigneeId, 10) : null,\n            }),\n            ...(dueDate !== undefined && {\n              dueDate: dueDate ? new Date(dueDate) : null,\n            }),\n          },\n          include: {\n            project: {\n              select: { id: true, name: true },\n            },\n            creator: {\n              select: { id: true, name: true, email: true, avatar: true },\n            },\n            assignee: {\n              select: { id: true, name: true, email: true, avatar: true },\n            },\n          },\n        });\n\n        res.status(200).json({ data: task, success: true });\n      } catch (error) {\n        res.status(500).json({ error: 'Failed to update task' });\n      }\n      break;\n\n    case 'DELETE':\n      try {\n        await prisma.task.delete({\n          where: { id: taskId },\n        });\n        res.status(204).end();\n      } catch (error) {\n        res.status(500).json({ error: 'Failed to delete task' });\n      }\n      break;\n\n    default:\n      res.status(405).json({ error: 'Method not allowed' });\n  }\n}\n" }];
var clone_default2 = async (req, res) => {
  const umiReq = new import_apiRoute.UmiApiRequest(req, apiRoutes);
  await umiReq.readBody();
  const umiRes = new import_apiRoute.UmiApiResponse(res);
  await new Promise((resolve) => middlewares_default(umiReq, umiRes, resolve));
  await clone_default(umiReq, umiRes);
};
