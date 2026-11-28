import express from "express";
import helmet from "helmet";

const app = express();
app.use(express.urlencoded({ extended: false }));
app.use(express.json());

app.use((req, res, next) => {
  helmet({
    contentSecurityPolicy: {
      useDefaults: true,
      directives: {
        "frame-src": ["https://www.youtube.com/"],
        "script-src": [
          "'self'",
          "https://www.youtube.com/",
          "https://cdn.jsdelivr.net/",
          "https://i.ytimg.com/"
        ],
        "img-src": ["'self'", "https://i.ytimg.com/"],
        "style-src": ["'self'", "https://cdn.jsdelivr.net/"],
        "font-src": ["'self'", "https://cdn.jsdelivr.net/"],
        "connect-src": ["'self'", "http:", "https:"]
      }
    },
    crossOriginEmbedderPolicy: false
  })(req, res, next);
});

const page = (content = "", body = "") => `<!doctype html>
<html lang="en">
<head>
  <meta charset="utf-8" />
  <title>Paste Lab</title>
  <meta name="viewport" content="width=device-width, initial-scale=1" />
  <style>
    body{font-family:system-ui,-apple-system,Segoe UI,Roboto,Ubuntu,Cantarell,Noto Sans,sans-serif; margin:2rem;}
    main{max-width:1400px; margin:0 auto;}
    textarea{width:100%; font-family:ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, "Liberation Mono", "Courier New", monospace; font-size:16px;}
    .preview{border:1px solid #ddd; padding:1rem; border-radius:12px; margin-top:1rem;}
  </style>
</head>
<body>
  <main>
    <h1>Paste Lab</h1>
    <p>Enter content below and preview the rendered output.</p>
    <form method="GET" action="/">
      <textarea name="c" rows="10" cols="50" placeholder="<h1>Hello</h1>">${content}</textarea>
      <div style="margin-top:1rem">
        <button type="submit">Preview</button>
      </div>
    </form>
    ${body}
  </main>
</body>
</html>`;

app.get("/", (req, res) => {
  const input = String(req.query.c ?? "");
  const body = input ? `<div class=\"preview\"><h2>Preview</h2>${input}</div>` : "";
  res.status(200).send(page(input, body));
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`Listening on http://localhost:${PORT}`));
