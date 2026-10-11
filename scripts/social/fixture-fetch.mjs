// Test transport only. Curl is optional for hosts whose Node proxy connections
// are unreliable. It uses the existing network proxy and normal TLS validation.
import { spawn } from "node:child_process";
export function fixtureFetch(origin) {
  return async (url, options = {}) => {
    const destination = new URL(String(url));
    if (destination.origin !== origin) throw new Error("Unexpected fixture destination.");
    for (let attempt = 0; attempt < 2; attempt++) {
      try {
        if (process.env.KALORI_LIVE_CURL !== "1") {
          return await fetch(url, { ...options, signal: AbortSignal.timeout(25000) });
        }
        const headers = [...new Headers(options.headers)].map(([k, v]) =>
          "header = " + JSON.stringify(k + ": " + v));
        const config = [
          "url = " + JSON.stringify(destination.href),
          "request = " + JSON.stringify(options.method ?? "GET"),
          ...headers,
          ...(options.body ? ["data-binary = " + JSON.stringify(String(options.body))] : []),
          'write-out = "\\n__KALORI_HTTP__%{http_code}"',
        ].join("\n");
        const output = await new Promise((resolve, reject) => {
          // Credentials go through stdin, never command arguments or a file.
          const child = spawn("curl", ["--silent", "--show-error", "--max-time", "25", "--config", "-"],
            { timeout: 30000, stdio: ["pipe", "pipe", "pipe"] });
          let stdout = "";
          child.stdout.setEncoding("utf8");
          child.stdout.on("data", (chunk) => { stdout += chunk; });
          child.stderr.resume();
          child.on("error", reject);
          child.on("close", (code) => code === 0 ? resolve(stdout) : reject(new Error("Fixture HTTP transport failed.")));
          child.stdin.end(config);
        });
        const split = output.lastIndexOf("\n__KALORI_HTTP__");
        if (split < 0) throw new Error("Missing fixture HTTP status.");
        const status = Number(output.slice(split + "\n__KALORI_HTTP__".length));
        return new Response(status === 204 ? null : output.slice(0, split), {
          status, headers: { "content-type": "application/json" },
        });
      } catch (e) {
        if (attempt === 1) throw e;
        // Retry only a failed HTTP exchange with exactly the same request.
        // RPC writes carry the same operation UUID, so this cannot double-write.
      }
    }
  };
}
