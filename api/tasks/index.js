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

// node_modules/.pnpm/@umijs+preset-umi@4.6.0_@types+node@24.10.1_@types+react@19.2.7_@types+webpack@5.28.5_l_d6594da494a3068e810849d7b1244828/node_modules/@umijs/preset-umi/dist/features/apiRoute/utils.js
var require_utils = __commonJS({
  "node_modules/.pnpm/@umijs+preset-umi@4.6.0_@types+node@24.10.1_@types+react@19.2.7_@types+webpack@5.28.5_l_d6594da494a3068e810849d7b1244828/node_modules/@umijs/preset-umi/dist/features/apiRoute/utils.js"(exports2, module2) {
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

// node_modules/.pnpm/@umijs+preset-umi@4.6.0_@types+node@24.10.1_@types+react@19.2.7_@types+webpack@5.28.5_l_d6594da494a3068e810849d7b1244828/node_modules/@umijs/preset-umi/dist/features/apiRoute/request.js
var require_request = __commonJS({
  "node_modules/.pnpm/@umijs+preset-umi@4.6.0_@types+node@24.10.1_@types+react@19.2.7_@types+webpack@5.28.5_l_d6594da494a3068e810849d7b1244828/node_modules/@umijs/preset-umi/dist/features/apiRoute/request.js"(exports2, module2) {
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

// node_modules/.pnpm/@umijs+preset-umi@4.6.0_@types+node@24.10.1_@types+react@19.2.7_@types+webpack@5.28.5_l_d6594da494a3068e810849d7b1244828/node_modules/@umijs/preset-umi/dist/features/apiRoute/response.js
var require_response = __commonJS({
  "node_modules/.pnpm/@umijs+preset-umi@4.6.0_@types+node@24.10.1_@types+react@19.2.7_@types+webpack@5.28.5_l_d6594da494a3068e810849d7b1244828/node_modules/@umijs/preset-umi/dist/features/apiRoute/response.js"(exports2, module2) {
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

// node_modules/.pnpm/@umijs+preset-umi@4.6.0_@types+node@24.10.1_@types+react@19.2.7_@types+webpack@5.28.5_l_d6594da494a3068e810849d7b1244828/node_modules/@umijs/preset-umi/dist/features/apiRoute/index.js
var require_apiRoute = __commonJS({
  "node_modules/.pnpm/@umijs+preset-umi@4.6.0_@types+node@24.10.1_@types+react@19.2.7_@types+webpack@5.28.5_l_d6594da494a3068e810849d7b1244828/node_modules/@umijs/preset-umi/dist/features/apiRoute/index.js"(exports2, module2) {
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

// src/.umi-production/api/tasks/index.ts
var tasks_exports = {};
__export(tasks_exports, {
  default: () => tasks_default2
});
module.exports = __toCommonJS(tasks_exports);

// src/.umi-production/api/_middlewares.ts
var middlewares_default = async (req, res, next) => {
  next();
};

// lib/prisma.ts
var import_adapter_libsql = require("@prisma/adapter-libsql");
var import_config = require("dotenv/config");

// generated/prisma/internal/class.ts
var runtime = __toESM(require("@prisma/client/runtime/client"));
var config = {
  "previewFeatures": [],
  "clientVersion": "7.0.1",
  "engineVersion": "f09f2815f091dbba658cdcd2264306d88bb5bda6",
  "activeProvider": "sqlite",
  "inlineSchema": '// This is your Prisma schema file,\n// learn more about it in the docs: https://pris.ly/d/prisma-schema\n\ngenerator client {\n  provider     = "prisma-client"\n  output       = "../generated/prisma"\n  moduleFormat = "cjs"\n}\n\ndatasource db {\n  provider = "sqlite"\n}\n\n// ============================================================================\n// User Model\n// ============================================================================\n\nmodel User {\n  id        Int      @id @default(autoincrement())\n  email     String   @unique\n  name      String   @unique\n  avatar    String?\n  createdAt DateTime @default(now())\n  updatedAt DateTime @updatedAt\n\n  // One-to-Many: A user can own many projects\n  ownedProjects Project[] @relation("ProjectOwner")\n\n  // Many-to-Many: A user can be a member of many projects\n  memberProjects ProjectMember[]\n\n  // One-to-Many: A user can create many tasks\n  createdTasks Task[] @relation("TaskCreator")\n\n  // One-to-Many: A user can be assigned many tasks\n  assignedTasks Task[] @relation("TaskAssignee")\n\n  // One-to-Many: A user can write many comments\n  comments Comment[]\n}\n\n// ============================================================================\n// Project Model (One-to-Many with User, Many-to-Many with User via ProjectMember)\n// ============================================================================\n\nmodel Project {\n  id          Int      @id @default(autoincrement())\n  name        String\n  description String?\n  status      String   @default("active") // active, archived, completed\n  createdAt   DateTime @default(now())\n  updatedAt   DateTime @updatedAt\n\n  // Many-to-One: Each project has one owner\n  ownerId Int\n  owner   User @relation("ProjectOwner", fields: [ownerId], references: [id], onDelete: Cascade)\n\n  // One-to-Many: A project can have many tasks\n  tasks Task[]\n\n  // Many-to-Many: A project can have many members\n  members ProjectMember[]\n}\n\n// ============================================================================\n// ProjectMember Model (Junction table for Many-to-Many: User <-> Project)\n// ============================================================================\n\nmodel ProjectMember {\n  id        Int      @id @default(autoincrement())\n  role      String   @default("member") // owner, admin, member, viewer\n  joinedAt  DateTime @default(now())\n  createdAt DateTime @default(now())\n  updatedAt DateTime @updatedAt\n\n  userId    Int\n  user      User    @relation(fields: [userId], references: [id], onDelete: Cascade)\n  projectId Int\n  project   Project @relation(fields: [projectId], references: [id], onDelete: Cascade)\n\n  @@unique([userId, projectId])\n}\n\n// ============================================================================\n// Task Model (Many-to-One with Project, Many-to-One with User)\n// ============================================================================\n\nmodel Task {\n  id          Int       @id @default(autoincrement())\n  title       String\n  description String?\n  status      String    @default("todo") // todo, in_progress, review, done\n  priority    String    @default("medium") // low, medium, high, urgent\n  dueDate     DateTime?\n  createdAt   DateTime  @default(now())\n  updatedAt   DateTime  @updatedAt\n\n  // Many-to-One: Each task belongs to a project\n  projectId Int\n  project   Project @relation(fields: [projectId], references: [id], onDelete: Cascade)\n\n  // Many-to-One: Each task has a creator\n  creatorId Int\n  creator   User @relation("TaskCreator", fields: [creatorId], references: [id], onDelete: Cascade)\n\n  // Many-to-One: Each task can be assigned to a user (optional)\n  assigneeId Int?\n  assignee   User? @relation("TaskAssignee", fields: [assigneeId], references: [id], onDelete: SetNull)\n\n  // One-to-Many: A task can have many comments\n  comments Comment[]\n}\n\n// ============================================================================\n// Comment Model (Many-to-One with Task, Many-to-One with User)\n// ============================================================================\n\nmodel Comment {\n  id        Int      @id @default(autoincrement())\n  content   String\n  createdAt DateTime @default(now())\n  updatedAt DateTime @updatedAt\n\n  // Many-to-One: Each comment belongs to a task\n  taskId Int\n  task   Task @relation(fields: [taskId], references: [id], onDelete: Cascade)\n\n  // Many-to-One: Each comment is written by a user\n  authorId Int\n  author   User @relation(fields: [authorId], references: [id], onDelete: Cascade)\n}\n\n// ============================================================================\n// SavedFilter Model - Store user filter preferences per page\n// ============================================================================\n\nmodel SavedFilter {\n  id        Int      @id @default(autoincrement())\n  name      String // Filter preset name (e.g., "default", "my-filters")\n  page      String // Page identifier (e.g., "table", "projects")\n  filters   String // JSON string containing filter values\n  isDefault Boolean  @default(false) // Whether this is the default filter for the page\n  createdAt DateTime @default(now())\n  updatedAt DateTime @updatedAt\n\n  @@unique([name, page]) // Each filter name must be unique per page\n}\n',
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
  getRuntime: async () => await import("@prisma/client/runtime/query_compiler_bg.sqlite.js"),
  getQueryCompilerWasmModule: async () => {
    const { wasm } = await import("@prisma/client/runtime/query_compiler_bg.sqlite.wasm-base64.js");
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
  Serializable: "Serializable"
});
var defineExtension = runtime2.Extensions.defineExtension;

// generated/prisma/client.ts
var PrismaClient = getPrismaClientClass();

// lib/prisma.ts
var adapter = new import_adapter_libsql.PrismaLibSql({
  url: "file:./dev.db"
});
var prisma = new PrismaClient({
  adapter
});

// src/api/tasks/index.ts
async function tasks_default(req, res) {
  switch (req.method) {
    case "GET":
      try {
        const {
          current = "1",
          pageSize = "10",
          projectId,
          status,
          priority,
          assigneeId,
          creatorId
        } = req.query;
        const page = parseInt(current, 10);
        const limit = parseInt(pageSize, 10);
        const skip = (page - 1) * limit;
        const where = {};
        if (projectId) where.projectId = parseInt(projectId, 10);
        if (status) where.status = status;
        if (priority) where.priority = priority;
        if (assigneeId) where.assigneeId = parseInt(assigneeId, 10);
        if (creatorId) where.creatorId = parseInt(creatorId, 10);
        const [tasks, total] = await prisma.$transaction([
          prisma.task.findMany({
            skip,
            take: limit,
            where,
            orderBy: { createdAt: "desc" },
            include: {
              project: {
                select: { id: true, name: true }
              },
              creator: {
                select: { id: true, name: true, email: true, avatar: true }
              },
              assignee: {
                select: { id: true, name: true, email: true, avatar: true }
              },
              _count: {
                select: { comments: true }
              }
            }
          }),
          prisma.task.count({ where })
        ]);
        res.status(200).json({
          data: tasks,
          total,
          success: true
        });
      } catch (error) {
        res.status(500).json({ error: "Failed to retrieve tasks" });
      }
      break;
    case "POST":
      try {
        const {
          title,
          description,
          projectId,
          creatorId,
          assigneeId,
          status,
          priority,
          dueDate
        } = req.body;
        if (!title || !projectId || !creatorId) {
          return res.status(400).json({ error: "Title, projectId, and creatorId are required" });
        }
        const task = await prisma.task.create({
          data: {
            title,
            description,
            projectId: parseInt(projectId, 10),
            creatorId: parseInt(creatorId, 10),
            assigneeId: assigneeId ? parseInt(assigneeId, 10) : null,
            status: status || "todo",
            priority: priority || "medium",
            dueDate: dueDate ? new Date(dueDate) : null
          },
          include: {
            project: {
              select: { id: true, name: true }
            },
            creator: {
              select: { id: true, name: true, email: true, avatar: true }
            },
            assignee: {
              select: { id: true, name: true, email: true, avatar: true }
            }
          }
        });
        res.status(201).json({ data: task, success: true });
      } catch (error) {
        res.status(500).json({ error: "Failed to create task" });
      }
      break;
    default:
      res.status(405).json({ error: "Method not allowed" });
  }
}

// src/.umi-production/api/tasks/index.ts
var import_apiRoute = __toESM(require_apiRoute());
var apiRoutes = [{ "path": "members", "id": "projects/[id]/members", "parentId": "projects/[id]", "file": "projects/[id]/members.ts", "absPath": "/projects/[id]/members", "__content": "import { UmiApiRequest, UmiApiResponse } from '@umijs/max';\nimport { prisma } from 'lib/prisma';\n\nexport default async function (req: UmiApiRequest, res: UmiApiResponse) {\n  const { id } = req.params;\n  const projectId = parseInt(id as string, 10);\n\n  if (isNaN(projectId)) {\n    return res.status(400).json({ error: 'Invalid project ID' });\n  }\n\n  switch (req.method) {\n    case 'GET':\n      try {\n        const members = await prisma.projectMember.findMany({\n          where: { projectId },\n          include: {\n            user: {\n              select: { id: true, name: true, email: true, avatar: true },\n            },\n          },\n          orderBy: { joinedAt: 'asc' },\n        });\n\n        res.status(200).json({ data: members, success: true });\n      } catch (error) {\n        res.status(500).json({ error: 'Failed to retrieve members' });\n      }\n      break;\n\n    case 'POST':\n      try {\n        const { userId, role } = req.body;\n\n        if (!userId) {\n          return res.status(400).json({ error: 'userId is required' });\n        }\n\n        const member = await prisma.projectMember.create({\n          data: {\n            userId: parseInt(userId, 10),\n            projectId,\n            role: role || 'member',\n          },\n          include: {\n            user: {\n              select: { id: true, name: true, email: true, avatar: true },\n            },\n          },\n        });\n\n        res.status(201).json({ data: member, success: true });\n      } catch (error) {\n        res.status(500).json({ error: 'Failed to add member' });\n      }\n      break;\n\n    case 'DELETE':\n      try {\n        const { userId } = req.body;\n\n        if (!userId) {\n          return res.status(400).json({ error: 'userId is required' });\n        }\n\n        await prisma.projectMember.delete({\n          where: {\n            userId_projectId: {\n              userId: parseInt(userId, 10),\n              projectId,\n            },\n          },\n        });\n\n        res.status(204).end();\n      } catch (error) {\n        res.status(500).json({ error: 'Failed to remove member' });\n      }\n      break;\n\n    default:\n      res.status(405).json({ error: 'Method not allowed' });\n  }\n}" }, { "path": "comments", "id": "comments/index", "file": "comments/index.ts", "absPath": "/comments", "__content": "import { UmiApiRequest, UmiApiResponse } from '@umijs/max';\nimport { prisma } from 'lib/prisma';\n\nexport default async function (req: UmiApiRequest, res: UmiApiResponse) {\n  switch (req.method) {\n    case 'GET':\n      try {\n        const { current = '1', pageSize = '10', taskId, authorId } = req.query;\n\n        const page = parseInt(current as string, 10);\n        const limit = parseInt(pageSize as string, 10);\n        const skip = (page - 1) * limit;\n\n        const where: Record<string, unknown> = {};\n        if (taskId) where.taskId = parseInt(taskId as string, 10);\n        if (authorId) where.authorId = parseInt(authorId as string, 10);\n\n        const [comments, total] = await prisma.$transaction([\n          prisma.comment.findMany({\n            skip,\n            take: limit,\n            where,\n            orderBy: { createdAt: 'desc' },\n            include: {\n              author: {\n                select: { id: true, name: true, email: true, avatar: true },\n              },\n              task: {\n                select: { id: true, title: true },\n              },\n            },\n          }),\n          prisma.comment.count({ where }),\n        ]);\n\n        res.status(200).json({\n          data: comments,\n          total,\n          success: true,\n        });\n      } catch (error) {\n        res.status(500).json({ error: 'Failed to retrieve comments' });\n      }\n      break;\n\n    case 'POST':\n      try {\n        const { content, taskId, authorId } = req.body;\n\n        if (!content || !taskId || !authorId) {\n          return res\n            .status(400)\n            .json({ error: 'Content, taskId, and authorId are required' });\n        }\n\n        const comment = await prisma.comment.create({\n          data: {\n            content,\n            taskId: parseInt(taskId, 10),\n            authorId: parseInt(authorId, 10),\n          },\n          include: {\n            author: {\n              select: { id: true, name: true, email: true, avatar: true },\n            },\n            task: {\n              select: { id: true, title: true },\n            },\n          },\n        });\n\n        res.status(201).json({ data: comment, success: true });\n      } catch (error) {\n        res.status(500).json({ error: 'Failed to create comment' });\n      }\n      break;\n\n    default:\n      res.status(405).json({ error: 'Method not allowed' });\n  }\n}" }, { "path": "projects", "id": "projects/index", "file": "projects/index.ts", "absPath": "/projects", "__content": "import { UmiApiRequest, UmiApiResponse } from '@umijs/max';\nimport { prisma } from 'lib/prisma';\n\nexport default async function (req: UmiApiRequest, res: UmiApiResponse) {\n  switch (req.method) {\n    case 'GET':\n      try {\n        const { current = '1', pageSize = '10', ownerId, status } = req.query;\n        const page = parseInt(current as string, 10);\n        const limit = parseInt(pageSize as string, 10);\n        const skip = (page - 1) * limit;\n\n        const where: Record<string, unknown> = {};\n        if (ownerId) where.ownerId = parseInt(ownerId as string, 10);\n        if (status) where.status = status;\n\n        const [projects, total] = await prisma.$transaction([\n          prisma.project.findMany({\n            skip,\n            take: limit,\n            where,\n            orderBy: { createdAt: 'desc' },\n            include: {\n              owner: {\n                select: { id: true, name: true, email: true, avatar: true },\n              },\n              _count: {\n                select: { tasks: true, members: true },\n              },\n            },\n          }),\n          prisma.project.count({ where }),\n        ]);\n\n        res.status(200).json({\n          data: projects,\n          total,\n          success: true,\n        });\n      } catch (error) {\n        res.status(500).json({ error: 'Failed to retrieve projects' });\n      }\n      break;\n\n    case 'POST':\n      try {\n        const { name, description, ownerId, status } = req.body;\n\n        if (!name || !ownerId) {\n          return res.status(400).json({ error: 'Name and ownerId are required' });\n        }\n\n        const project = await prisma.project.create({\n          data: {\n            name,\n            description,\n            status: status || 'active',\n            ownerId: parseInt(ownerId, 10),\n          },\n          include: {\n            owner: {\n              select: { id: true, name: true, email: true, avatar: true },\n            },\n          },\n        });\n\n        // Add owner as a project member with 'owner' role\n        await prisma.projectMember.create({\n          data: {\n            userId: parseInt(ownerId, 10),\n            projectId: project.id,\n            role: 'owner',\n          },\n        });\n\n        res.status(201).json({ data: project, success: true });\n      } catch (error) {\n        res.status(500).json({ error: 'Failed to create project' });\n      }\n      break;\n\n    default:\n      res.status(405).json({ error: 'Method not allowed' });\n  }\n}" }, { "path": "comments/[id]", "id": "comments/[id]", "file": "comments/[id].ts", "absPath": "/comments/[id]", "__content": "import { UmiApiRequest, UmiApiResponse } from '@umijs/max';\nimport { prisma } from 'lib/prisma';\n\nexport default async function (req: UmiApiRequest, res: UmiApiResponse) {\n  const { id } = req.params;\n  const commentId = parseInt(id as string, 10);\n\n  if (isNaN(commentId)) {\n    return res.status(400).json({ error: 'Invalid comment ID' });\n  }\n\n  switch (req.method) {\n    case 'GET':\n      try {\n        const comment = await prisma.comment.findUnique({\n          where: { id: commentId },\n          include: {\n            author: {\n              select: { id: true, name: true, email: true, avatar: true },\n            },\n            task: {\n              select: { id: true, title: true },\n            },\n          },\n        });\n\n        if (!comment) {\n          return res.status(404).json({ error: 'Comment not found' });\n        }\n\n        res.status(200).json({ data: comment, success: true });\n      } catch (error) {\n        res.status(500).json({ error: 'Failed to retrieve comment' });\n      }\n      break;\n\n    case 'PUT':\n      try {\n        const { content } = req.body;\n\n        if (!content) {\n          return res.status(400).json({ error: 'Content is required' });\n        }\n\n        const comment = await prisma.comment.update({\n          where: { id: commentId },\n          data: { content },\n          include: {\n            author: {\n              select: { id: true, name: true, email: true, avatar: true },\n            },\n            task: {\n              select: { id: true, title: true },\n            },\n          },\n        });\n\n        res.status(200).json({ data: comment, success: true });\n      } catch (error) {\n        res.status(500).json({ error: 'Failed to update comment' });\n      }\n      break;\n\n    case 'DELETE':\n      try {\n        await prisma.comment.delete({\n          where: { id: commentId },\n        });\n        res.status(204).end();\n      } catch (error) {\n        res.status(500).json({ error: 'Failed to delete comment' });\n      }\n      break;\n\n    default:\n      res.status(405).json({ error: 'Method not allowed' });\n  }\n}" }, { "path": "filters", "id": "filters/index", "file": "filters/index.ts", "absPath": "/filters", "__content": "import { UmiApiRequest, UmiApiResponse } from '@umijs/max';\nimport { prisma } from 'lib/prisma';\n\nexport default async function (req: UmiApiRequest, res: UmiApiResponse) {\n  switch (req.method) {\n    case 'GET':\n      try {\n        const { page, name } = req.query;\n\n        const where: Record<string, unknown> = {};\n        if (page) where.page = page;\n        if (name) where.name = name;\n\n        // Get all filters matching criteria (always return array for consistency)\n        const filters = await prisma.savedFilter.findMany({\n          where,\n          orderBy: [{ isDefault: 'desc' }, { updatedAt: 'desc' }], // Default filters first\n        });\n\n        res.status(200).json({\n          data: filters.map((f) => ({\n            ...f,\n            filters: JSON.parse(f.filters),\n          })),\n          success: true,\n        });\n      } catch (error) {\n        res.status(500).json({ error: 'Failed to retrieve filters' });\n      }\n      break;\n\n    case 'POST':\n      try {\n        const { name, page, filters, isDefault } = req.body;\n\n        if (!name || !page || !filters) {\n          return res.status(400).json({\n            error: 'Name, page, and filters are required',\n          });\n        }\n\n        // If setting as default, unset other defaults for this page\n        if (isDefault) {\n          await prisma.savedFilter.updateMany({\n            where: { page, isDefault: true },\n            data: { isDefault: false },\n          });\n        }\n\n        // Upsert the filter (create or update)\n        const filter = await prisma.savedFilter.upsert({\n          where: { name_page: { name, page } },\n          update: {\n            filters: JSON.stringify(filters),\n            isDefault: isDefault ?? false,\n          },\n          create: {\n            name,\n            page,\n            filters: JSON.stringify(filters),\n            isDefault: isDefault ?? false,\n          },\n        });\n\n        res.status(200).json({\n          data: { ...filter, filters: JSON.parse(filter.filters) },\n          success: true,\n        });\n      } catch (error) {\n        res.status(500).json({ error: 'Failed to save filter' });\n      }\n      break;\n\n    case 'DELETE':\n      try {\n        const { name, page } = req.body;\n\n        if (!name || !page) {\n          return res.status(400).json({\n            error: 'Name and page are required',\n          });\n        }\n\n        await prisma.savedFilter.delete({\n          where: { name_page: { name, page } },\n        });\n\n        res.status(200).json({ success: true });\n      } catch (error) {\n        res.status(500).json({ error: 'Failed to delete filter' });\n      }\n      break;\n\n    default:\n      res.status(405).json({ error: 'Method not allowed' });\n  }\n}\n" }, { "path": "projects/[id]", "id": "projects/[id]", "file": "projects/[id].ts", "absPath": "/projects/[id]", "__content": "import { UmiApiRequest, UmiApiResponse } from '@umijs/max';\nimport { prisma } from 'lib/prisma';\n\nexport default async function (req: UmiApiRequest, res: UmiApiResponse) {\n  const { id } = req.params;\n  const projectId = parseInt(id as string, 10);\n\n  if (isNaN(projectId)) {\n    return res.status(400).json({ error: 'Invalid project ID' });\n  }\n\n  switch (req.method) {\n    case 'GET':\n      try {\n        const project = await prisma.project.findUnique({\n          where: { id: projectId },\n          include: {\n            owner: {\n              select: { id: true, name: true, email: true, avatar: true },\n            },\n            members: {\n              include: {\n                user: {\n                  select: { id: true, name: true, email: true, avatar: true },\n                },\n              },\n            },\n            tasks: {\n              include: {\n                assignee: {\n                  select: { id: true, name: true, email: true, avatar: true },\n                },\n                comments: {\n                  include: {\n                    author: {\n                      select: { id: true, name: true, email: true, avatar: true },\n                    },\n                  },\n                  orderBy: { createdAt: 'desc' },\n                },\n              },\n              orderBy: { createdAt: 'desc' },\n            },\n          },\n        });\n\n        if (!project) {\n          return res.status(404).json({ error: 'Project not found' });\n        }\n\n        res.status(200).json({ data: project, success: true });\n      } catch (error) {\n        res.status(500).json({ error: 'Failed to retrieve project' });\n      }\n      break;\n\n    case 'PUT':\n      try {\n        const { name, description, status } = req.body;\n\n        const project = await prisma.project.update({\n          where: { id: projectId },\n          data: {\n            ...(name && { name }),\n            ...(description !== undefined && { description }),\n            ...(status && { status }),\n          },\n          include: {\n            owner: {\n              select: { id: true, name: true, email: true, avatar: true },\n            },\n          },\n        });\n\n        res.status(200).json({ data: project, success: true });\n      } catch (error) {\n        res.status(500).json({ error: 'Failed to update project' });\n      }\n      break;\n\n    case 'DELETE':\n      try {\n        await prisma.project.delete({\n          where: { id: projectId },\n        });\n        res.status(204).end();\n      } catch (error) {\n        res.status(500).json({ error: 'Failed to delete project' });\n      }\n      break;\n\n    default:\n      res.status(405).json({ error: 'Method not allowed' });\n  }\n}" }, { "path": "tasks", "id": "tasks/index", "file": "tasks/index.ts", "absPath": "/tasks", "__content": "import { UmiApiRequest, UmiApiResponse } from '@umijs/max';\nimport { prisma } from 'lib/prisma';\n\nexport default async function (req: UmiApiRequest, res: UmiApiResponse) {\n  switch (req.method) {\n    case 'GET':\n      try {\n        const {\n          current = '1',\n          pageSize = '10',\n          projectId,\n          status,\n          priority,\n          assigneeId,\n          creatorId,\n        } = req.query;\n\n        const page = parseInt(current as string, 10);\n        const limit = parseInt(pageSize as string, 10);\n        const skip = (page - 1) * limit;\n\n        const where: Record<string, unknown> = {};\n        if (projectId) where.projectId = parseInt(projectId as string, 10);\n        if (status) where.status = status;\n        if (priority) where.priority = priority;\n        if (assigneeId) where.assigneeId = parseInt(assigneeId as string, 10);\n        if (creatorId) where.creatorId = parseInt(creatorId as string, 10);\n\n        const [tasks, total] = await prisma.$transaction([\n          prisma.task.findMany({\n            skip,\n            take: limit,\n            where,\n            orderBy: { createdAt: 'desc' },\n            include: {\n              project: {\n                select: { id: true, name: true },\n              },\n              creator: {\n                select: { id: true, name: true, email: true, avatar: true },\n              },\n              assignee: {\n                select: { id: true, name: true, email: true, avatar: true },\n              },\n              _count: {\n                select: { comments: true },\n              },\n            },\n          }),\n          prisma.task.count({ where }),\n        ]);\n\n        res.status(200).json({\n          data: tasks,\n          total,\n          success: true,\n        });\n      } catch (error) {\n        res.status(500).json({ error: 'Failed to retrieve tasks' });\n      }\n      break;\n\n    case 'POST':\n      try {\n        const {\n          title,\n          description,\n          projectId,\n          creatorId,\n          assigneeId,\n          status,\n          priority,\n          dueDate,\n        } = req.body;\n\n        if (!title || !projectId || !creatorId) {\n          return res\n            .status(400)\n            .json({ error: 'Title, projectId, and creatorId are required' });\n        }\n\n        const task = await prisma.task.create({\n          data: {\n            title,\n            description,\n            projectId: parseInt(projectId, 10),\n            creatorId: parseInt(creatorId, 10),\n            assigneeId: assigneeId ? parseInt(assigneeId, 10) : null,\n            status: status || 'todo',\n            priority: priority || 'medium',\n            dueDate: dueDate ? new Date(dueDate) : null,\n          },\n          include: {\n            project: {\n              select: { id: true, name: true },\n            },\n            creator: {\n              select: { id: true, name: true, email: true, avatar: true },\n            },\n            assignee: {\n              select: { id: true, name: true, email: true, avatar: true },\n            },\n          },\n        });\n\n        res.status(201).json({ data: task, success: true });\n      } catch (error) {\n        res.status(500).json({ error: 'Failed to create task' });\n      }\n      break;\n\n    default:\n      res.status(405).json({ error: 'Method not allowed' });\n  }\n}" }, { "path": "users", "id": "users/index", "file": "users/index.ts", "absPath": "/users", "__content": "import { UmiApiRequest, UmiApiResponse } from '@umijs/max';\nimport { prisma } from 'lib/prisma';\n\nexport default async function (req: UmiApiRequest, res: UmiApiResponse) {\n  switch (req.method) {\n    case 'POST':\n      await new Promise((resolve) => setTimeout(resolve, 1000));\n      const { current = '1', pageSize = '10', sorter, ids } = req.body;\n      const page = parseInt(current as string, 10);\n      const limit = parseInt(pageSize as string, 10);\n      const skip = (page - 1) * limit;\n\n      try {\n        const [users, total] = await prisma.$transaction([\n          prisma.user.findMany({\n            skip,\n            take: limit,\n            orderBy: sorter,\n            where: {\n              id: { in: ids },\n            },\n          }),\n          prisma.user.count(),\n        ]);\n\n        res.status(200).json({\n          data: users,\n          total,\n          success: true,\n        });\n      } catch (error) {\n        res.status(500).json({ error: 'Failed to retrieve users' });\n      }\n      break;\n    // case 'POST':\n    //   const { name, email } = req.body;\n    //   try {\n    //     const newUser = await prisma.user.create({\n    //       data: {\n    //         name,\n    //         email,\n    //         avatar: `https://i.pravatar.cc/150?u=${mock.Random.guid()}`,\n    //       },\n    //     });\n    //     res.status(201).json(newUser);\n    //   } catch (error) {\n    //     res.status(500).json({ error: 'Failed to create user' });\n    //   }\n    //   break;\n    case 'DELETE':\n      const { id: deleteId } = req.query;\n      if (!deleteId) {\n        return res.status(400).json({ error: 'Missing user ID' });\n      }\n      try {\n        await prisma.user.delete({\n          where: { id: Number(deleteId) },\n        });\n        res.status(204).end();\n      } catch (error) {\n        res.status(500).json({ error: 'Failed to delete user' });\n      }\n      break;\n    case 'PUT':\n      const { id: updateId } = req.query;\n      const { name: updateName, email: updateEmail } = req.body;\n      if (!updateId) {\n        return res.status(400).json({ error: 'Missing user ID' });\n      }\n      try {\n        const updatedUser = await prisma.user.update({\n          where: { id: Number(updateId) },\n          data: {\n            name: updateName,\n            email: updateEmail,\n          },\n        });\n        res.status(200).json(updatedUser);\n      } catch (error) {\n        res.status(500).json({ error: 'Failed to update user' });\n      }\n      break;\n    default:\n      res.status(405).json({ error: 'Method not allowed' });\n  }\n}\n" }, { "path": "tasks/[id]", "id": "tasks/[id]", "file": "tasks/[id].ts", "absPath": "/tasks/[id]", "__content": "import { UmiApiRequest, UmiApiResponse } from '@umijs/max';\nimport { prisma } from 'lib/prisma';\n\nexport default async function (req: UmiApiRequest, res: UmiApiResponse) {\n  const { id } = req.params;\n  const taskId = parseInt(id as string, 10);\n\n  if (isNaN(taskId)) {\n    return res.status(400).json({ error: 'Invalid task ID' });\n  }\n\n  switch (req.method) {\n    case 'GET':\n      try {\n        const task = await prisma.task.findUnique({\n          where: { id: taskId },\n          include: {\n            project: {\n              select: { id: true, name: true },\n            },\n            creator: {\n              select: { id: true, name: true, email: true, avatar: true },\n            },\n            assignee: {\n              select: { id: true, name: true, email: true, avatar: true },\n            },\n            comments: {\n              include: {\n                author: {\n                  select: { id: true, name: true, email: true, avatar: true },\n                },\n              },\n              orderBy: { createdAt: 'desc' },\n            },\n          },\n        });\n\n        if (!task) {\n          return res.status(404).json({ error: 'Task not found' });\n        }\n\n        res.status(200).json({ data: task, success: true });\n      } catch (error) {\n        res.status(500).json({ error: 'Failed to retrieve task' });\n      }\n      break;\n\n    case 'PUT':\n      try {\n        const { title, description, status, priority, assigneeId, dueDate } =\n          req.body;\n\n        const task = await prisma.task.update({\n          where: { id: taskId },\n          data: {\n            ...(title && { title }),\n            ...(description !== undefined && { description }),\n            ...(status && { status }),\n            ...(priority && { priority }),\n            ...(assigneeId !== undefined && {\n              assigneeId: assigneeId ? parseInt(assigneeId, 10) : null,\n            }),\n            ...(dueDate !== undefined && {\n              dueDate: dueDate ? new Date(dueDate) : null,\n            }),\n          },\n          include: {\n            project: {\n              select: { id: true, name: true },\n            },\n            creator: {\n              select: { id: true, name: true, email: true, avatar: true },\n            },\n            assignee: {\n              select: { id: true, name: true, email: true, avatar: true },\n            },\n          },\n        });\n\n        res.status(200).json({ data: task, success: true });\n      } catch (error) {\n        res.status(500).json({ error: 'Failed to update task' });\n      }\n      break;\n\n    case 'DELETE':\n      try {\n        await prisma.task.delete({\n          where: { id: taskId },\n        });\n        res.status(204).end();\n      } catch (error) {\n        res.status(500).json({ error: 'Failed to delete task' });\n      }\n      break;\n\n    default:\n      res.status(405).json({ error: 'Method not allowed' });\n  }\n}" }];
var tasks_default2 = async (req, res) => {
  const umiReq = new import_apiRoute.UmiApiRequest(req, apiRoutes);
  await umiReq.readBody();
  const umiRes = new import_apiRoute.UmiApiResponse(res);
  await new Promise((resolve) => middlewares_default(umiReq, umiRes, resolve));
  await tasks_default(umiReq, umiRes);
};
