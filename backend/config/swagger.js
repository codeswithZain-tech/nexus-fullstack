import swaggerJsdoc from "swagger-jsdoc";

const options = {
  definition: {
    openapi: "3.0.0",
    info: {
      title: "Nexus API",
      version: "1.0.0",
      description:
        "Backend API for Nexus - Investor & Entrepreneur Collaboration Platform",
    },
    servers: [
      { url: "http://localhost:5000", description: "Development" },
      { url: "https://nexus-backend-production.up.railway.app", description: "Production" },
    ],
    components: {
      securitySchemes: {
        bearerAuth: {
          type: "http",
          scheme: "bearer",
          bearerFormat: "JWT",
        },
      },
      schemas: {
        User: {
          type: "object",
          properties: {
            _id: { type: "string" },
            name: { type: "string" },
            email: { type: "string" },
            role: { type: "string", enum: ["investor", "entrepreneur"] },
            bio: { type: "string" },
            avatarUrl: { type: "string" },
            isVerified: { type: "boolean" },
            createdAt: { type: "string", format: "date-time" },
          },
        },
        Meeting: {
          type: "object",
          properties: {
            _id: { type: "string" },
            organizer: { type: "string" },
            participant: { type: "string" },
            title: { type: "string" },
            notes: { type: "string" },
            startTime: { type: "string", format: "date-time" },
            endTime: { type: "string", format: "date-time" },
            status: { type: "string", enum: ["pending", "accepted", "rejected", "cancelled"] },
            roomId: { type: "string" },
          },
        },
        Document: {
          type: "object",
          properties: {
            _id: { type: "string" },
            owner: { type: "string" },
            sharedWith: { type: "array", items: { type: "string" } },
            fileName: { type: "string" },
            fileUrl: { type: "string" },
            fileType: { type: "string" },
            version: { type: "integer" },
            status: { type: "string", enum: ["draft", "pending_signature", "signed", "archived"] },
            signature: {
              type: "object",
              properties: {
                signedBy: { type: "string" },
                signatureImageUrl: { type: "string" },
                signedAt: { type: "string", format: "date-time" },
              },
            },
          },
        },
        Transaction: {
          type: "object",
          properties: {
            _id: { type: "string" },
            user: { type: "string" },
            type: { type: "string", enum: ["deposit", "withdraw", "transfer"] },
            amount: { type: "number" },
            toUser: { type: "string" },
            status: { type: "string", enum: ["pending", "completed", "failed"] },
            stripePaymentIntentId: { type: "string" },
            description: { type: "string" },
            createdAt: { type: "string", format: "date-time" },
          },
        },
      },
    },
    paths: {
      "/api/auth/register": {
        post: {
          tags: ["Auth"],
          summary: "Register a new user",
          requestBody: {
            required: true,
            content: {
              "application/json": {
                schema: {
                  type: "object",
                  required: ["name", "email", "password", "role"],
                  properties: {
                    name: { type: "string" },
                    email: { type: "string" },
                    password: { type: "string", minLength: 6 },
                    role: { type: "string", enum: ["investor", "entrepreneur"] },
                  },
                },
              },
            },
          },
          responses: { 201: { description: "User registered" }, 400: { description: "Validation error" } },
        },
      },
      "/api/auth/login": {
        post: {
          tags: ["Auth"],
          summary: "Login with email and password",
          requestBody: {
            required: true,
            content: {
              "application/json": {
                schema: {
                  type: "object",
                  required: ["email", "password"],
                  properties: {
                    email: { type: "string" },
                    password: { type: "string" },
                  },
                },
              },
            },
          },
          responses: { 200: { description: "Login successful" }, 401: { description: "Invalid credentials" } },
        },
      },
      "/api/auth/me": {
        get: {
          tags: ["Auth"],
          summary: "Get current user profile",
          security: [{ bearerAuth: [] }],
          responses: { 200: { description: "User profile" } },
        },
      },
      "/api/auth/forgot-password": {
        post: {
          tags: ["Auth"],
          summary: "Request password reset email",
          requestBody: {
            content: {
              "application/json": {
                schema: { type: "object", properties: { email: { type: "string" } } },
              },
            },
          },
          responses: { 200: { description: "Reset instructions sent" } },
        },
      },
      "/api/auth/reset-password": {
        post: {
          tags: ["Auth"],
          summary: "Reset password with token",
          requestBody: {
            content: {
              "application/json": {
                schema: {
                  type: "object",
                  properties: {
                    token: { type: "string" },
                    newPassword: { type: "string", minLength: 6 },
                  },
                },
              },
            },
          },
          responses: { 200: { description: "Password reset successful" } },
        },
      },
      "/api/auth/2fa/send": {
        post: {
          tags: ["2FA"],
          summary: "Send OTP for two-factor authentication",
          security: [{ bearerAuth: [] }],
          responses: { 200: { description: "OTP sent" } },
        },
      },
      "/api/auth/2fa/verify": {
        post: {
          tags: ["2FA"],
          summary: "Verify OTP",
          security: [{ bearerAuth: [] }],
          requestBody: {
            content: {
              "application/json": {
                schema: { type: "object", properties: { otp: { type: "string" } } },
              },
            },
          },
          responses: { 200: { description: "2FA verified" } },
        },
      },
      "/api/users/profile": {
        get: {
          tags: ["Users"],
          summary: "Get user profile",
          security: [{ bearerAuth: [] }],
          responses: { 200: { description: "Profile data" } },
        },
        put: {
          tags: ["Users"],
          summary: "Update user profile",
          security: [{ bearerAuth: [] }],
          requestBody: {
            content: {
              "application/json": {
                schema: {
                  type: "object",
                  properties: {
                    name: { type: "string" },
                    bio: { type: "string" },
                    avatarUrl: { type: "string" },
                    preferences: { type: "object" },
                  },
                },
              },
            },
          },
          responses: { 200: { description: "Profile updated" } },
        },
      },
      "/api/users/investors": {
        get: {
          tags: ["Users"],
          summary: "List all investors (entrepreneur only)",
          security: [{ bearerAuth: [] }],
          responses: { 200: { description: "List of investors" } },
        },
      },
      "/api/users/entrepreneurs": {
        get: {
          tags: ["Users"],
          summary: "List all entrepreneurs (investor only)",
          security: [{ bearerAuth: [] }],
          responses: { 200: { description: "List of entrepreneurs" } },
        },
      },
      "/api/meetings": {
        post: {
          tags: ["Meetings"],
          summary: "Schedule a new meeting",
          security: [{ bearerAuth: [] }],
          requestBody: {
            content: {
              "application/json": {
                schema: {
                  type: "object",
                  required: ["participant", "title", "startTime", "endTime"],
                  properties: {
                    participant: { type: "string" },
                    title: { type: "string" },
                    notes: { type: "string" },
                    startTime: { type: "string", format: "date-time" },
                    endTime: { type: "string", format: "date-time" },
                  },
                },
              },
            },
          },
          responses: { 201: { description: "Meeting created" }, 409: { description: "Time conflict" } },
        },
        get: {
          tags: ["Meetings"],
          summary: "Get all meetings for current user",
          security: [{ bearerAuth: [] }],
          responses: { 200: { description: "List of meetings" } },
        },
      },
      "/api/meetings/{id}/respond": {
        put: {
          tags: ["Meetings"],
          summary: "Accept or reject a meeting invitation",
          security: [{ bearerAuth: [] }],
          parameters: [{ name: "id", in: "path", required: true, schema: { type: "string" } }],
          requestBody: {
            content: {
              "application/json": {
                schema: {
                  type: "object",
                  properties: { status: { type: "string", enum: ["accepted", "rejected"] } },
                },
              },
            },
          },
          responses: { 200: { description: "Meeting updated" } },
        },
      },
      "/api/meetings/{id}": {
        delete: {
          tags: ["Meetings"],
          summary: "Cancel a meeting",
          security: [{ bearerAuth: [] }],
          parameters: [{ name: "id", in: "path", required: true, schema: { type: "string" } }],
          responses: { 200: { description: "Meeting cancelled" } },
        },
      },
      "/api/documents/upload": {
        post: {
          tags: ["Documents"],
          summary: "Upload a document",
          security: [{ bearerAuth: [] }],
          requestBody: {
            content: { "multipart/form-data": { schema: { type: "object", properties: { file: { type: "string", format: "binary" }, sharedWith: { type: "string" } } } } },
          },
          responses: { 201: { description: "Document uploaded" } },
        },
      },
      "/api/documents": {
        get: {
          tags: ["Documents"],
          summary: "Get all documents (owned or shared)",
          security: [{ bearerAuth: [] }],
          responses: { 200: { description: "List of documents" } },
        },
      },
      "/api/documents/{id}/sign": {
        post: {
          tags: ["Documents"],
          summary: "E-sign a document",
          security: [{ bearerAuth: [] }],
          parameters: [{ name: "id", in: "path", required: true, schema: { type: "string" } }],
          requestBody: {
            content: {
              "application/json": {
                schema: { type: "object", properties: { signatureImageUrl: { type: "string" } } },
              },
            },
          },
          responses: { 200: { description: "Document signed" } },
        },
      },
      "/api/payments/deposit": {
        post: {
          tags: ["Payments"],
          summary: "Deposit funds (Stripe sandbox)",
          security: [{ bearerAuth: [] }],
          requestBody: {
            content: {
              "application/json": {
                schema: { type: "object", properties: { amount: { type: "number" } } },
              },
            },
          },
          responses: { 201: { description: "Deposit transaction created" } },
        },
      },
      "/api/payments/withdraw": {
        post: {
          tags: ["Payments"],
          summary: "Withdraw funds",
          security: [{ bearerAuth: [] }],
          requestBody: {
            content: {
              "application/json": {
                schema: { type: "object", properties: { amount: { type: "number" } } },
              },
            },
          },
          responses: { 201: { description: "Withdrawal transaction created" } },
        },
      },
      "/api/payments/transfer": {
        post: {
          tags: ["Payments"],
          summary: "Transfer funds to another user",
          security: [{ bearerAuth: [] }],
          requestBody: {
            content: {
              "application/json": {
                schema: { type: "object", properties: { toUser: { type: "string" }, amount: { type: "number" } } },
              },
            },
          },
          responses: { 201: { description: "Transfer transaction created" } },
        },
      },
      "/api/payments/history": {
        get: {
          tags: ["Payments"],
          summary: "Get transaction history",
          security: [{ bearerAuth: [] }],
          responses: { 200: { description: "List of transactions" } },
        },
      },
      "/api/health": {
        get: {
          tags: ["Health"],
          summary: "Health check endpoint",
          responses: { 200: { description: "Server is healthy" } },
        },
      },
    },
  },
  apis: [],
};

export const swaggerSpec = swaggerJsdoc(options);
