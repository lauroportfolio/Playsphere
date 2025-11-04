import { createUploadthing, type FileRouter } from "uploadthing/next";
import { UploadThingError } from "uploadthing/server";
import { getAuth } from "@clerk/nextjs/server";

const f = createUploadthing();
const isDev = process.env.NODE_ENV === "development";

export const ourFileRouter = {
  media: f({
    image: { maxFileSize: "4MB", maxFileCount: 1 },
  })
    .middleware(async ({ req }) => {
      const { userId } = getAuth(req);
      if (!userId) throw new UploadThingError("Unauthorized");
      return { userId };
    })
    .onUploadComplete(async ({ metadata, file }) => {
      // ✅ Em ambiente local, apenas loga e ignora o callback remoto
      if (isDev) {
        console.log("🧩 Upload local concluído com sucesso!");
        console.log("URL do arquivo:", file.url || file.ufsUrl);
        return {
          uploadedBy: metadata.userId,
          fileUrl: file.url || file.ufsUrl,
          skippedCallback: true,
        };
      }

      // ✅ Em produção (Vercel)
      console.log("✅ Upload completo em produção!");
      console.log("URL do arquivo:", file.ufsUrl ?? file.url);

      return {
        uploadedBy: metadata.userId,
        fileUrl: file.ufsUrl ?? file.url,
      };
    }),
} satisfies FileRouter;

export type OurFileRouter = typeof ourFileRouter;
