import archiver from "archiver";
import archiverZipEncrypted from "archiver-zip-encrypted";

let registered = false;
function ensureFormatRegistered() {
  if (registered) return;
  try {
    archiver.registerFormat("zip-encrypted", archiverZipEncrypted);
  } catch (e) {
    // Already registered (e.g. hot-reload in dev) — safe to ignore.
  }
  registered = true;
}

function streamToBuffer(archive) {
  return new Promise((resolve, reject) => {
    const chunks = [];
    archive.on("data", (chunk) => chunks.push(chunk));
    archive.on("end", () => resolve(Buffer.concat(chunks)));
    archive.on("error", reject);
  });
}

export async function POST(request) {
  ensureFormatRegistered();

  const body = await request.json();
  const { requestId, format, password } = body;

  if (!password || password.length < 4) {
    return Response.json({ error: "Password must be at least 4 characters." }, { status: 400 });
  }
  if (!requestId || !["excel", "pdf"].includes(format)) {
    return Response.json({ error: "Invalid request." }, { status: 400 });
  }

  // Reuse the existing, already-secured Excel/PDF routes by calling them
  // internally — forwarding the session cookie so scoping/permissions are
  // enforced exactly as if the user downloaded it directly.
  const cookie = request.headers.get("cookie") || "";
  const targetPath = format === "pdf" ? "/api/reports/pdf" : "/api/reports/excel";
  const innerRes = await fetch(`${request.nextUrl.origin}${targetPath}?requestId=${requestId}`, {
    headers: { cookie },
  });

  if (!innerRes.ok) {
    return Response.json({ error: "Could not generate the underlying report." }, { status: 500 });
  }

  const fileBuffer = Buffer.from(await innerRes.arrayBuffer());
  const contentDisposition = innerRes.headers.get("content-disposition") || "";
  const filenameMatch = contentDisposition.match(/filename="(.+)"/);
  const innerFilename = filenameMatch ? filenameMatch[1] : `report.${format === "pdf" ? "pdf" : "xlsx"}`;

  const archive = archiver.create("zip-encrypted", { zlib: { level: 8 }, encryptionMethod: "aes256", password });
  const bufferPromise = streamToBuffer(archive);
  archive.append(fileBuffer, { name: innerFilename });
  archive.finalize();
  const zipBuffer = await bufferPromise;

  return new Response(zipBuffer, {
    headers: {
      "Content-Type": "application/zip",
      "Content-Disposition": `attachment; filename="secure-${innerFilename.replace(/\.[^.]+$/, "")}.zip"`,
    },
  });
}
