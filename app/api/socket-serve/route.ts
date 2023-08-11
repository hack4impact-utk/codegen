import { getAllDirectoryPaths, getFile } from "@/server/actions/file";
import { FileData } from "@/types";
import { writeFileSync } from "fs";
import { NextResponse } from "next/server";
import { Server } from "socket.io";

export async function GET(req: Request) {
  try {
    const io = new Server({
      cors: {
        origin: "http://localhost:3000",
      },
    });

    io.on("connection", (socket) => {
      socket.on("newFile", (arg) => {
        socket.emit("fileStream", getFile(arg));
      });

      socket.on("fileStream", (arg) => {
        const file: FileData = arg;
        writeFileSync(file.fullPath, file.contents, "utf-8");
      });

      socket.emit("directory", getAllDirectoryPaths("server/models"));
    });
    io.listen(4000);
  } catch (e: any) {
    console.log("server already running");
  }

  return NextResponse.json({});
}
