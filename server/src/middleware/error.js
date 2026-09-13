export const notFound = (req, res) =>
  res.status(404).json({ error: `Route not found: ${req.method} ${req.path}` });

export const errorHandler = (err, _req, res, _next) => {
  console.error(err);
  let status = err.status || 500;
  let message = err.message || "Internal server error";

  if (err.type === "entity.parse.failed") {
    status = 400;
    message = "Invalid JSON body";
  }

  if (err?.name === "ZodError") {
    status = 400;
    message = err.issues
      .map((i) => `${i.path.join(".")}: ${i.message}`)
      .join("; ");
  }

  if (err?.code === "P2025") {
    status = 404;
    message = "Record not found";
  }

  res.status(status).json({ error: message });
};