import { createUploadthing, type FileRouter } from "uploadthing/next";
import { getCurrentUser } from "@/lib/auth";

const f = createUploadthing();

const handleAuth = async () => {
  const user = await getCurrentUser();
  if (!user || !(user as any).id) throw new Error("Unauthorized");
  return { userId: (user as any).id };
};

export const ourFileRouter = {
  messageAttachment: f(["image", "video", "audio", "pdf"])
    .middleware(() => handleAuth())
    .onUploadComplete(({ metadata, file }) => {
      console.log("Upload complete for userId:", metadata.userId);
      console.log("file url", file.url);
    }),
} satisfies FileRouter;

export type OurFileRouter = typeof ourFileRouter;
