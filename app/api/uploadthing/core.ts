import { createUploadthing, type FileRouter } from "uploadthing/next";
import { UploadThingError } from "uploadthing/server";
import { currentUser } from "@clerk/nextjs/server";

const f = createUploadthing();

const getUser = async () => await currentUser();

export const ourFileRouter = {
  media: f({
    image: {
      maxFileSize: "4MB",
      maxFileCount: 1,
    },
  })
    .middleware(async ({ req }) => {
      const user = await getUser();

      if (!user) throw new UploadThingError("Unauthorized");

      return { userId: user.id };
    })
    .onUploadComplete(async ({ metadata, file }) => {
      console.log("Upload concluído com sucesso!");
      console.log("File URL:", file.ufsUrl ?? file.url);

      return { 
        uploadedBy: metadata.userId,
        fileUrl: file.ufsUrl ?? file.url
      };
    }),
} satisfies FileRouter;

export type OurFileRouter = typeof ourFileRouter;