"use client";

import { Box, Button, Typography } from "@mui/material";
import React, { useEffect } from "react";
import io from "socket.io-client";
import Editor from "react-simple-code-editor";
import { highlight, languages } from "prismjs";
import { FileData } from "@/types";
import SchemaConfigForm from "./components/SchemaConfigForm";
import { _Schema } from "@/types/schema";
import { generateSchemaCode, parseSchemaCode } from "@/server/actions/file";

export default function Home() {
  const [socket, setSocket] = React.useState<any>();
  const [currentFile, setCurrentFile] = React.useState<FileData>(
    {} as FileData
  );
  const [directoryContents, setDirectoryContents] = React.useState<string[]>(
    []
  );
  const [schema, setSchema] = React.useState<_Schema>({ rootProps: [] });

  useEffect(() => {
    updateCode();
  }, [schema]);

  useEffect(() => {
    setupServerSocket();
  }, []);

  async function setupServerSocket() {
    await fetch("http://localhost:3000/api/socket-serve");

    const newSocket = io("http://localhost:4000");
    setSocket(newSocket);
    newSocket.on("directory", (arg) => setDirectoryContents(arg as string[]));
    newSocket.on("fileStream", (arg) => loadNewFile(arg as FileData));
  }

  function loadNewFile(file: FileData) {
    setCurrentFile(file);

    try {
      const updatedSchema = parseSchemaCode(file.contents);
      setSchema(updatedSchema);
    } catch (e: any) {}
  }

  function selectNewFile(path: string) {
    socket.emit("newFile", path);
  }

  async function saveFile(newFile: FileData) {
    if (socket) {
      socket.emit("fileStream", newFile);
    }
  }

  async function updateCode() {
    let newFile = {
      ...currentFile,
      contents: (await generateSchemaCode(schema)) ?? currentFile.contents,
    };
    setCurrentFile(newFile);
    saveFile(newFile);
  }

  //await doc.save(); -- use this to see if schema is good
  return (
    <>
      <Box sx={{ display: "flex", flexDirection: "column" }}>
        {directoryContents.map((path, i) => (
          <Button key={i} onClick={() => selectNewFile(path)}>
            {path}
          </Button>
        ))}
      </Box>
      <Box
        sx={{
          display: "flex",
          flexDirection: "row",
          width: "100%",
          justifyContent: "space-evenly",
        }}
      >
        <SchemaConfigForm schema={schema} setSchema={setSchema} />
        <Editor
          value={currentFile.contents || ""}
          onValueChange={(newFileContents) =>
            setCurrentFile({ ...currentFile, contents: newFileContents })
          }
          highlight={(code) =>
            highlight(code, languages.javascript, "javascript")
          }
          style={{
            fontFamily: '"Fira code", "Fira Mono", monospace',
            fontSize: 12,
          }}
        />
      </Box>
    </>
  );
}
