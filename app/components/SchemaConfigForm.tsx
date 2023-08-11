"use client";

import { _Schema, _SchemaProp } from "@/types/schema";
import { Box, Button, TextField } from "@mui/material";
import React, { useEffect } from "react";
import SchemaPropForm from "./SchemaPropForm";
import * as uuid from "uuid";

interface Props {
  schema: _Schema;
  setSchema: (schema: _Schema) => void;
}

export default function SchemaConfigForm({ schema, setSchema }: Props) {
  function addRootProp() {
    setSchema({
      ...schema,
      rootProps: [
        ...schema.rootProps,
        {
          name: "",
          type: "String",
          required: false,
          isArray: false,
          _key: uuid.v4(),
          children: [],
        },
      ],
    });
  }

  function updateChildren(
    prop: _SchemaProp,
    updatedProp: _SchemaProp,
    targetKey: string
  ): _SchemaProp {
    return {
      ...prop,
      children: prop.children.map((child) =>
        child._key === targetKey
          ? updatedProp
          : updateChildren(child, updatedProp, targetKey)
      ),
    };
  }

  function updateSchema(updatedProp: _SchemaProp) {
    let targetKey = updatedProp._key;
    setSchema({
      ...schema,
      rootProps: schema.rootProps.map((rootProp) =>
        rootProp._key === targetKey
          ? updatedProp
          : updateChildren(rootProp, updatedProp, targetKey)
      ),
    });
  }

  function deleteProp(deleteProp: _SchemaProp) {
    let index = schema.rootProps.findIndex((p) => p._key === deleteProp._key);

    // must recursively traverse to find prop now
    if (index < 0) {
      setSchema({
        ...schema,
        rootProps: schema.rootProps.map((rootProp) =>
          deleteChildProp(rootProp, deleteProp)
        ),
      });
    } else {
      setSchema({
        ...schema,
        rootProps: [...schema.rootProps].splice(index, 1),
      });
    }
  }

  function deleteChildProp(
    prop: _SchemaProp,
    deleteProp: _SchemaProp
  ): _SchemaProp {
    let index = prop.children.findIndex((p) => p._key === deleteProp._key);
    console.log(prop);
    console.log(deleteProp);

    // must recursively traverse to find prop now
    if (index < 0) {
      return {
        ...prop,
        children: prop.children.map((child) =>
          deleteChildProp(child, deleteProp)
        ),
      };
    } else {
      return { ...prop, children: [...prop.children].splice(index, 1) };
    }
  }

  return (
    <Box sx={{ display: "flex", flexDirection: "column" }}>
      <TextField
        label="Schema Name"
        onChange={(e) => setSchema({ ...schema, name: e.target.value })}
        value={schema.name || ""}
      ></TextField>
      <Box sx={{ display: "flex", flexDirection: "column", mt: 4 }}>
        {schema.rootProps.map((prop, index) => (
          <SchemaPropForm
            key={index}
            updateSchema={updateSchema}
            prop={prop}
            deleteProp={deleteProp}
          />
        ))}
      </Box>
      <Box ml={4}>
        <Button onClick={addRootProp}>Add Root Property</Button>
      </Box>
    </Box>
  );
}
