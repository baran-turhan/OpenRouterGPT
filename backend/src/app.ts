import express, { Request, Response, NextFunction } from "express";
import cors from "cors";
import multer from "multer";
import fs from "node:fs";
import { SpanStatusCode, trace } from "@opentelemetry/api";
import { HistoryStore } from "./historyStore";
import { config } from "./config";
import {
  ChatRequestBody,
  ChatResponsePayload,
  ModelSummary,
  StoredMessage,
} from "./types";
import {
  fetchAvailableModels,
  mapHistoryToOpenRouter,
  requestChatCompletion,
} from "./openrouter";
import { v4 as uuid } from "uuid";

const tracer = trace.getTracer("madlen-backend");
export const historyStore = new HistoryStore(config.historyFile);

const upload = multer({
  storage: multer.diskStorage({
    destination: (_req, _file, cb) => cb(null, config.uploadsDir),
    filename: (_req, file, cb) =>
      cb(null, `${Date.now()}-${file.originalname}`),
  }),
  limits: { fileSize: 10 * 1024 * 1024 },
});

const ensureUploadsDir = async () => {
  await fs.promises.mkdir(config.uploadsDir, { recursive: true });
};
ensureUploadsDir().catch((error) => {
  console.error("Failed to prepare uploads directory", error);
});

const app = express();
app.use(cors());
app.use(express.json({ limit: "10mb" }));
app.use(express.urlencoded({ extended: true }));
app.use("/uploads", express.static(config.uploadsDir));

app.get("/health", (_req, res) => {
  res.json({ status: "ok", env: config.env });
});

app.get("/api/history", async (req, res, next) => {
  const sessionId = req.query.sessionId?.toString();
  const span = tracer.startSpan("get-history");
  try {
    span.setAttribute("history.session_id", sessionId ?? "missing");
    if (!sessionId) {
      res.status(400).json({ error: "sessionId query param is required" });
      return;
    }
    const history = await historyStore.getSession(sessionId);
    span.setAttribute("history.message_count", history?.messages.length ?? 0);
    res.json(
      history ?? {
        sessionId,
        messages: [],
        updatedAt: new Date().toISOString(),
      }
    );
    span.setStatus({ code: SpanStatusCode.OK });
  } catch (error) {
    next(error);
  } finally {
    span.end();
  }
});

let modelCache: { expiresAt: number; items: ModelSummary[] } = {
  expiresAt: 0,
  items: [],
};

app.get("/api/sessions", async (_req, res, next) => {
  const span = tracer.startSpan("list-sessions");
  try {
    const sessions = await historyStore.listSessions();
    span.setAttribute("sessions.count", sessions.length);
    res.json(sessions);
    span.setStatus({ code: SpanStatusCode.OK });
  } catch (error) {
    next(error);
  } finally {
    span.end();
  }
});

app.get("/api/models", async (_req, res, next) => {
  const span = tracer.startSpan("get-models");
  try {
    if (Date.now() < modelCache.expiresAt && modelCache.items.length) {
      span.setAttribute("models.cache_hit", true);
      res.json(modelCache.items);
      return;
    }
    span.setAttribute("models.cache_hit", false);
    const models = await fetchAvailableModels();
    const freeModels: ModelSummary[] = models
      .filter((model: any) => {
        const pricing = model.pricing ?? {};
        const prompt = pricing.prompt ?? 0;
        const completion = pricing.completion ?? 0;

        return (prompt === 0 && completion === 0) || (prompt === '0' && completion === '0');
      })
      .map((model: any) => ({
        id: model.id,
        name: model.name,
        description: model.description,
        context_length: model.context_length,
        pricing: model.pricing,
      }));
    modelCache = {
      expiresAt: Date.now() + config.modelCacheTtlMs,
      items: freeModels,
    };
    res.json(freeModels);
    span.setAttribute("models.count", freeModels.length);
    span.setStatus({ code: SpanStatusCode.OK });
  } catch (error) {
    next(error);
  } finally {
    span.end();
  }
});

app.post(
  "/api/chat",
  async (
    req: Request<Record<string, unknown>, unknown, ChatRequestBody>,
    res: Response,
    next: NextFunction
  ) => {
    const span = tracer.startSpan("chat");
    try {
      const {
        model,
        message,
        imageUrls,
        sessionId: providedSessionId,
        temperature,
      } = req.body;
      span.setAttributes({
        "chat.model": model ?? "missing",
        "chat.has_images": Boolean(imageUrls?.length),
        "chat.temperature": temperature ?? 0.2,
      });
      if (!model || !message) {
        res.status(400).json({ error: "model and message are required" });
        return;
      }
      const sessionId = providedSessionId ?? uuid();
      span.setAttribute("chat.session_id", sessionId);
      const sessionAfterUser = await historyStore.appendMessage(sessionId, {
        role: "user",
        content: message,
        imageUrls,
        model,
      });
      const formatted = mapHistoryToOpenRouter(sessionAfterUser.messages ?? []);
      const completion = await requestChatCompletion({
        model,
        messages: formatted,
        temperature,
      });
      const assistantMessageText =
        completion?.choices?.[0]?.message?.content ?? "No response";
      const sessionAfterAssistant = await historyStore.appendMessage(
        sessionId,
        {
          role: "assistant",
          content: assistantMessageText,
          model,
        }
      );
      const assistantMessage =
        sessionAfterAssistant.messages[
          sessionAfterAssistant.messages.length - 1
        ];
      if (!assistantMessage) {
        throw new Error("Unable to persist assistant response");
      }
      const payload: ChatResponsePayload = {
        sessionId,
        message: assistantMessage as StoredMessage,
      };
      res.json(payload);
      span.setStatus({ code: SpanStatusCode.OK });
      span.addEvent("assistant_reply", {
        length: assistantMessage?.content.length ?? 0,
      });
    } catch (error) {
      span.recordException(error as Error);
      next(error);
    } finally {
      span.end();
    }
  }
);

app.post("/api/upload", upload.single("file"), (req, res) => {
  if (!req.file) {
    res.status(400).json({ error: "No file uploaded" });
    return;
  }
  const publicPath = `/uploads/${req.file.filename}`;
  res.json({ url: publicPath });
});

app.use((error: Error, _req: Request, res: Response, _next: NextFunction) => {
  console.error(error);
  res.status(500).json({ error: error.message ?? "Unexpected error" });
});

export default app;
