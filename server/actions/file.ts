import { FileData } from "@/types";
import { _Schema, _SchemaProp } from "@/types/schema";
import { readFileSync, readdirSync, statSync } from "fs";
import path from "path";
import { Options } from "prettier";
import * as prettier from "prettier/standalone";
import parserTypeScript from "prettier/plugins/typescript";
import esTree from "prettier/plugins/estree";
import * as uuid from "uuid";

const prettierOptions: Options = {
  parser: "typescript",
  plugins: [parserTypeScript, esTree],
  semi: true,
  trailingComma: "es5",
  singleQuote: true,
  printWidth: 80,
};

const ignoreList: string[] = [
  ".next",
  "node_modules",
  "favicon.ico",
  ".eslintrc.json",
  ".gitignore",
  "next-env.d.ts",
  "next.config.js",
  "package-lock.json",
  "package.json",
  "README.md",
  "tsconfig.json",
  ".git",
  "public",
];

export function getAllDirectoryPaths(dir: string) {
  let allPaths: string[] = [];
  traverseDirectory(allPaths, dir);
  console.log(allPaths);
  return allPaths;
}

function traverseDirectory(allPaths: string[], dir: string) {
  const files = readdirSync(dir);

  files.forEach((file) => {
    if (!ignoreList.includes(file)) {
      // Construct the absolute path
      const filePath = path.join(dir, file);

      const isDirectory = statSync(filePath).isDirectory();

      if (isDirectory) {
        traverseDirectory(allPaths, filePath);
      } else {
        allPaths.push(filePath);
      }
    }
  });
}

export function getFile(filePath: string): FileData {
  var retval: FileData = {
    name: path.basename(filePath),
    fullPath: filePath,
    contents: readFileSync(filePath, "utf-8"),
  };

  return retval;
}

// returns null if it was not able to format the code
export async function generateSchemaCode(
  schema: _Schema
): Promise<string | null> {
  var output: string = "";

  if (!schema.name) return "";

  // imports
  output = output.concat(
    'import { model, Schema, Document, models, Model } from "mongoose";\n\n'
  );

  // declares beginning of schema with name
  output = output.concat(`const ${schema.name}Schema = new Schema(`);

  // begins property declaration
  output = output.concat("{\n");

  // puts in all props
  for (let rootProp of schema.rootProps) {
    output = concatProps(output, rootProp);
  }

  // finishes property declaration
  output = output.concat("},\n");

  // prevents __v from popping up in db
  output = output.concat("{\nversionKey: false\n},\n");

  // closes schema definition
  output = output.concat(")\n\n");

  // exports Document interface
  output = output.concat(
    `export interface ${schema.name}Document extends Omit<${schema.name}, '_id'>, Document {}\n\n`
  );

  output = output.concat(
    `export default (models.${schema.name} as Model<${schema.name}Document>) ||\n`
  );
  output = output.concat(
    `model<${schema.name}Document>('${schema.name}', ${schema.name}Schema, '${
      schema.name!.charAt(0).toLowerCase() + schema.name!.slice(1)
    }s')`
  );

  try {
    const formattedOutput = await prettier.format(output, prettierOptions);
    return formattedOutput;
  } catch (e: any) {
    return null;
  }
}

function concatProps(currOutput: string, prop: _SchemaProp) {
  // prop name and colon
  currOutput = currOutput.concat(`${prop.name}: `);

  // if array, wrap object in []
  if (prop.isArray) {
    currOutput = currOutput.concat("[\n");
  }

  currOutput = currOutput.concat("{\n");

  // only have 'type', 'required', etc. on props with no children
  if (prop.children.length > 0) {
    for (let child of prop.children) {
      currOutput = concatProps(currOutput, child);
    }
  } else {
    currOutput = currOutput.concat(
      `_id: false,\ntype: Schema.Types.${prop.type},\nrequired: ${prop.required},`
    );
    if (prop.type == "ObjectId") {
      currOutput = currOutput.concat(`ref: 'FIGURE_OUT_REFS',`);
    }
  }

  currOutput = currOutput.concat("\n},\n");

  if (prop.isArray) {
    currOutput = currOutput.concat("],\n");
  }

  return currOutput;
}

export function parseSchemaCode(schemaCode: string): _Schema {
  // isolates schema code
  // don't ask how I came up with this regex string
  // matches[1] contains the schema name
  const schemaObjPattern =
    /const\s+(.+)Schema\s*=\s*new\s+Schema\s*\((?:.*\s*)*?(?=\{(?:.*\s*)versionKey)/;

  const schemaJsonTrimPattern = /const\s+(.+)Schema\s*=\s*new\s+Schema\s*\(/;

  const matches = schemaCode.match(schemaObjPattern);
  const schemaName = matches?.at(1);
  console.log(schemaName);
  let schemaBody = matches?.at(0)?.replace(schemaJsonTrimPattern, "").trim();

  if (schemaBody?.endsWith(",")) schemaBody = schemaBody.slice(0, -1);

  // flatten body into single line
  const flattenedBody = schemaBody?.replace(/\s/g, "") as string;

  const schemaAsObj = JSON.parse(convertToJson(flattenedBody));

  const schema: _Schema = convertToSchemaObj(schemaAsObj, schemaName!);

  return schema;
}

// surrounds keys and appropriate values (does not have support for numbers) with quotation marks
// also removes trailing commas
function convertToJson(input: string) {
  const keyPattern = /([_A-Za-z]+(?=:))/g;
  const valPattern = /((?<=[_A-Za-z]+":)[^\[\{\(tf][^,]+)/g;
  const trailingCommasPattern = /,(?=[\}\)\]])/g;
  const typePrefixPattern = /Schema\.Types\./g;

  return input
    .replace(keyPattern, '"$1"')
    .replace(valPattern, '"$1"')
    .replace(trailingCommasPattern, "")
    .replace(typePrefixPattern, "");
}

function convertToSchemaObj(obj: any, schemaName: string) {
  const outputSchema: _Schema = { name: schemaName, rootProps: [] };
  for (const rootProp in obj) {
    outputSchema.rootProps.push(
      convertObjNodeToSchemaNode(obj[rootProp], rootProp)
    );
  }

  return outputSchema;
}

function convertObjNodeToSchemaNode(node: any, name: string): _SchemaProp {
  let repeats = false;
  if (Array.isArray(node)) {
    node = node[0];
    repeats = true;
  }

  const children: _SchemaProp[] = [];
  for (const key in node) {
    if (typeof node[key] === "object") {
      children.push(convertObjNodeToSchemaNode(node[key], key));
    }
  }

  const outputSchemaProp: _SchemaProp = {
    name: name,
    type: node["type"] ?? "Object",
    required: node["required"] ?? false,
    isArray: repeats,
    _key: uuid.v4(),
    children: children,
  };

  return outputSchemaProp;
}
