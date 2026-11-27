import type { Request, Response, RequestHandler } from "express";
import { hashIP, unique } from "../utils/hash";
import { RunBot } from "../services/bot.service";

export const renderIndex: RequestHandler = async (req, res) => {
  const ip = req.socket.remoteAddress || req.ip;
  if (!ip) {
    res.status(400).json({ message: "Invalid IP" });
    return;
  }

  const hashed = hashIP(ip);
  unique[ip] = hashed;

  res.cookie("hash", hashed);
  res.render("index", { csrfToken: req.csrfToken() });
};

export const getToken: RequestHandler = async (req, res) => {
  res.json({ csrfToken: req.csrfToken() });
};

export const startBot: RequestHandler = async (req, res) => {
  const ip = req.socket.remoteAddress || req.ip;
  if (!ip) {
    res.status(400).json({ message: "Invalid IP" });
    return;
  }

  const expected = req.cookies.hash;
  if (unique[ip] !== expected) {
    res.status(403).json({ message: "Forbidden. Visit index first." });
    return;
  }

  unique[ip] = hashIP(ip);
  const url = req.body.url;
  if (!url) {
    res.status(400).json({ message: "Missing URL" });
    return;
  }


  const result = await RunBot(url, req.cookies.user);
  if (result instanceof Error) {
    res.status(500).json({ message: result.message });
    return;
  }

  res.json({ message: "Crawl complete." });
};
