import {
  _Schema,
  _SchemaProp,
  possibleTypes,
  possibleTypesType,
} from "@/types/schema";
import {
  TextField,
  Box,
  Autocomplete,
  FormControlLabel,
  Checkbox,
  Button,
  IconButton,
} from "@mui/material";
import React from "react";
import * as uuid from "uuid";
import DeleteIcon from "@mui/icons-material/Delete";

interface Props {
  prop: _SchemaProp;
  updateSchema: (updatedProp: _SchemaProp) => void;
  deleteProp: (delteProp: _SchemaProp) => void;
}

export default function SchemaPropForm({
  prop,
  updateSchema,
  deleteProp,
}: Props) {
  function addChildProperty() {
    prop.children.push({
      name: "",
      type: "String",
      required: false,
      isArray: false,
      _key: uuid.v4(),
      children: [],
    });
    updateSchema({ ...prop, type: "Object" });
  }

  return (
    <>
      <Box ml={4}>
        <TextField
          label="Property Name"
          onChange={(e) => {
            prop.name = e.target.value;
            updateSchema(prop);
          }}
          value={prop.name}
        ></TextField>
        <Autocomplete
          autoHighlight
          options={possibleTypes}
          onChange={(_e, val) => {
            prop.type = val as possibleTypesType;
            updateSchema(prop);
          }}
          renderOption={(props, option) => {
            return (
              <li {...props} key={option}>
                {option}
              </li>
            );
          }}
          getOptionLabel={(type) => type}
          renderInput={(params) => (
            <TextField {...params} placeholder={"Type"} variant="outlined" />
          )}
          value={prop.type || null}
        />
        <FormControlLabel
          control={
            <Checkbox
              onChange={(_e, checked) => {
                prop.required = checked;
                updateSchema(prop);
              }}
              checked={prop.required}
            />
          }
          label="Required"
        />
        <FormControlLabel
          control={
            <Checkbox
              onChange={(_e, checked) => {
                prop.isArray = checked;
                updateSchema(prop);
              }}
              checked={prop.isArray}
            />
          }
          label="Repeats?"
        />
        <Button onClick={addChildProperty}>Add Child Property</Button>
        <IconButton onClick={() => deleteProp(prop)}>
          <DeleteIcon />
        </IconButton>
      </Box>
      <Box sx={{ display: "flex", flexDirection: "column", ml: 8 }}>
        {prop.children.map((child) => (
          <SchemaPropForm
            key={child._key}
            prop={child}
            updateSchema={updateSchema}
            deleteProp={deleteProp}
          />
        ))}
      </Box>
    </>
  );
}
