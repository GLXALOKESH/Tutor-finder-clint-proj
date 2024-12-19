export const getDateTime = () => {
  const date = new Date().toLocaleString("en-US", { timeZone: "Asia/Kolkata" });

  return date;
};

const logMiddleware = (req, res, next) => {
  // Capture the start time
  const startTime = Date.now();

  // Log the request details
  console.log(`[${getDateTime()}] ${req.method} ${req.originalUrl}`);

  // Listen for the response to finish and log additional details
  res.on("finish", () => {
    const endTime = Date.now();
    const responseTime = endTime - startTime;
    console.log(
      `[${getDateTime()}] ${req.method} ${req.originalUrl} ${
        res.statusCode
      } ${responseTime}ms`
    );
  });

  next();
};

export { logMiddleware };
